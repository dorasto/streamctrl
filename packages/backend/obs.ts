import WebSocket from "ws"; // This is the 'ws' npm package's WebSocket
import { createHash } from "crypto";
import { actions, frontendClients, sendObsRequestToBackend } from ".";
import * as schema from "db/schema/index";
import { db } from "db";
import { arrayOverlaps, sql } from "drizzle-orm";
// OBS WebSocket connection
export let obsWs: WebSocket | null = null;
export let obsWsConnected: boolean = false; // Track OBS connection status more explicitly
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null; // Use setTimeout for single reconnect attempts
// --- Dummy Database / Profile Management ---];
export type IProfile = typeof schema.profile.$inferSelect;

export let currentObsProfile: any = null; // Currently active OBS profile

// Function to compute the SHA256 hash
const sha256 = (str: string): string => {
  return createHash("sha256").update(str).digest("base64");
};
// --- OBS WebSocket Connection Logic (REAL) ---
export const connectToObs = (profile: IProfile) => {
  // Clear any existing reconnect timeout if trying a new connection
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  // If an existing connection exists, close it gracefully
  if (obsWs) {
    console.log(
      `Closing existing OBS connection for profile: ${currentObsProfile?.name}`
    );
    obsWs.removeAllListeners(); // Remove all listeners from the old WebSocket instance
    obsWs.close(1000, "Switching profiles"); // 1000 is Normal Closure
    obsWs = null; // Clear the old WebSocket instance
    obsWsConnected = false; // Immediately mark as disconnected
  }

  currentObsProfile = profile; // Set the new current profile
  console.log(
    //@ts-expect-error
    `Attempting to connect to OBS WebSocket for profile: ${profile.name} at ${profile.connection.ip}...`
  );
  //@ts-expect-error
  obsWs = new WebSocket(profile.connection.ip); // Attempt real WebSocket connection

  obsWs.addEventListener("open", () => {
    console.log(
      `Connected to OBS WebSocket for profile: ${profile.name}. Waiting for Hello message...`
    );
    obsWsConnected = false; // Not fully connected/authenticated yet
    if (reconnectTimeout) {
      // Clear reconnect if connection successfully opens
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
  });
  // Main message handler for OBS WebSocket
  obsWs.addEventListener("message", (event) => {
    const messageData = event.data;
    let parsedMessage: any;
    try {
      const messageString =
        typeof messageData === "string"
          ? messageData
          : new TextDecoder().decode(messageData as BufferSource);
      parsedMessage = JSON.parse(messageString);
    } catch (e) {
      console.error("Failed to parse OBS message:", e);
      return;
    }
    ActionRunnerTest(actions, parsedMessage);
    // --- Handle OBS Hello (Op Code 0) for authentication ---
    if (parsedMessage.op === 0) {
      const authenticationRequired =
        parsedMessage.d.authentication !== undefined;
      //@ts-expect-error
      const obsPassword = profile.connection.password || ""; // Use password from the selected profile

      if (authenticationRequired && obsPassword) {
        const authChallenge = parsedMessage.d.authentication.challenge;
        const authSalt = parsedMessage.d.authentication.salt;
        const rpcVersion = parsedMessage.d.rpcVersion || 1;
        const secret = sha256(obsPassword + authSalt);
        const authResponse = sha256(secret + authChallenge);
        obsWs?.send(
          JSON.stringify({
            op: 1, // Identify op code
            d: {
              rpcVersion: rpcVersion,
              authentication: authResponse,
            },
          })
        );
      } else if (!authenticationRequired) {
        // Send Identify without authentication if not required by OBS
        obsWs?.send(
          JSON.stringify({
            op: 1, // Identify op code
            d: {
              rpcVersion: parsedMessage.d.rpcVersion || 1,
            },
          })
        );
      } else if (authenticationRequired && !obsPassword) {
        console.error(
          `OBS requires authentication for profile '${profile.name}' but no password is set in backend config!`
        );
        obsWs?.close(1008, "Authentication Required but password missing"); // Close with Policy Violation
        return;
      }
    }
    if (parsedMessage.op === 2) {
      obsWsConnected = true;
      frontendClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "relay_obs_status", // Explicitly from relay, about OBS status
              data: {
                connection: "identified",
                profile: {
                  name: currentObsProfile?.name || "Unknown Profile",
                  id: currentObsProfile?.id || "unknown",
                },
              },
            })
          );
        }
      });
    }

    // Forward ALL messages received from OBS to frontend clients
    frontendClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "obs_message", // Clearly indicates this is a raw OBS message
            data: parsedMessage, // The original parsed OBS message
          })
        );
      }
    });
  });

  obsWs.addEventListener("error", (event) => {
    console.error(
      `OBS WebSocket Error for profile ${profile.name}:`,
      event.error || event.type
    );
    obsWsConnected = false; // Assume disconnected on error
    // Notify frontend of disconnection from relay about OBS
    frontendClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "relay_obs_status",
            data: {
              connection: "disconnected",
              reason: "error",
              profile: {
                name: currentObsProfile?.name || "Unknown Profile",
                id: currentObsProfile?.id || "unknown",
              },
              error: event.error?.message || event.type, // Include error detail
            },
          })
        );
      }
    });
    // If an error occurs, try to reconnect to the current profile
    if (!reconnectTimeout && currentObsProfile === profile) {
      console.log(
        `Scheduling reconnect for profile ${profile.name} in 5 seconds due to error...`
      );
      reconnectTimeout = setTimeout(() => connectToObs(profile), 5000);
    }
  });

  obsWs.addEventListener("close", (event) => {
    console.log(
      `OBS WebSocket Closed for profile ${profile.name}: Code ${event.code}, Reason: ${event.reason}`
    );
    obsWsConnected = false;
    // Notify frontend of disconnection from relay about OBS
    frontendClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "relay_obs_status",
            data: {
              connection: "disconnected",
              reason: "closed",
              code: event.code,
              comment: event.reason,
              profile: {
                name: currentObsProfile?.name || "Unknown Profile",
                id: currentObsProfile?.id || "unknown",
              },
            },
          })
        );
      }
    });
    // Only attempt to reconnect if the close was not initiated by us (e.g., switching profiles, code 1000)
    // and if there isn't an existing reconnect attempt already scheduled,
    // and ensure we're trying to reconnect to the profile that just closed.
    if (
      event.code !== 1000 &&
      !reconnectTimeout &&
      currentObsProfile === profile
    ) {
      console.log(
        `Scheduling reconnect for profile ${profile.name} in 5 seconds due to close...`
      );
      reconnectTimeout = setTimeout(() => connectToObs(profile), 5000);
    }
  });
};

function ActionRunnerTest(actions: any[], message: any) {
  const found = actions.find((e) =>
    e.triggers.find(
      (trigger: any) =>
        e.active &&
        trigger.type === message.d.eventType &&
        trigger.itemId === message.d.eventData.sceneItemId &&
        trigger.sceneUuid === message.d.eventData.sceneUuid
    )
  );
  found?.actions.map((e) => {
    sendObsRequestToBackend(e.type, {
      ...e.settings,
      sceneItemEnabled: message.d.eventData.sceneItemEnabled,
    });
  });
}
