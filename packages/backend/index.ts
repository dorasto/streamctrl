import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { serveStatic } from "hono/serve-static";
import WebSocket from "ws"; // This is the 'ws' npm package's WebSocket
import { createNodeWebSocket } from "@hono/node-ws";
import fs from "fs"; // fs is needed for getContent in serveStatic
import { WSContext } from "hono/ws";
import { auth } from "./auth"; // Assuming 'auth' is still used for API security
import { connectToObs, currentObsProfile, obsWs, obsWsConnected } from "./obs";
import apiRoutes from "./routes/api";
import { db } from "db";
import * as schema from "db/schema/index";
import { sql } from "drizzle-orm";
export let dbObsProfiles: any[] = [];
export function setDbObsProfiles(newProfiles: any[]): void {
  dbObsProfiles = newProfiles;
}
export let actions: any[] = [];
export function setDbObsActions(newActions: any[]): void {
  actions = newActions;
}
const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();
app.use(
  "*",
  cors({
    origin: "http://localhost:5173",
    allowHeaders: [],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
    maxAge: 600,
    credentials: true,
  })
);
app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return next();
  }
  c.set("user", session.user);
  c.set("session", session.session);
  return next();
});
// Authentication middleware
app.use("/api/*", async (c, next) => {
  const session = c.get("session");
  if (!session) {
    return c.text("Unauthorized", 401);
  }
  return next();
});
// Store connected frontend WebSocket clients
export const frontendClients = new Set<WSContext<WebSocket>>();
db.select()
  .from(schema.profile)
  .then(async (data) => {
    dbObsProfiles = data;
    if (dbObsProfiles.length > 0) {
      const active = dbObsProfiles.find((e) => e.active);
      if (active) {
        actions = await db
          .select()
          .from(schema.action)
          .where(
            sql`${schema.action.profileIds} ?| array[${active.id}]::text[]`
          );
        connectToObs(active);
      } else {
        console.warn("No OBS profiles active");
      }
    } else {
      console.warn("No OBS profiles");
    }
  });
// --- Helper function to send requests to OBS via obsWs (REAL) ---
// This function needs to be accessible to API routes, so we'll put it here.
export async function sendObsRequestToBackend(
  requestType: string,
  requestData: {}
): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!obsWs || obsWs.readyState !== WebSocket.OPEN) {
      return reject(new Error("OBS WebSocket is not connected."));
    }

    const requestId = crypto.randomUUID();
    const message = {
      op: 6, // Request op code (Client-to-Server Request)
      d: {
        requestType: requestType,
        requestId: requestId,
        requestData: requestData,
      },
    };

    const handler = (event: WebSocket.MessageEvent) => {
      try {
        const responseString =
          typeof event.data === "string"
            ? event.data
            : new TextDecoder().decode(event.data as BufferSource);
        const response = JSON.parse(responseString);
        if (
          response.op === 7 && // Acknowledgment of a request
          response.d?.requestId === requestId &&
          response.d.requestStatus !== undefined
        ) {
          obsWs?.removeEventListener("message", handler); // Remove handler after response
          if (response.d.requestStatus.result) {
            resolve(response.d.responseData);
          } else {
            reject(
              new Error(
                response.d.requestStatus.comment || "OBS request failed."
              )
            );
          }
        }
      } catch (e) {
        console.error("Error parsing OBS response for request:", e);
      }
    };

    obsWs.addEventListener("message", handler); // Add handler for this specific request's response
    obsWs.send(JSON.stringify(message));

    // Timeout for the request
    setTimeout(() => {
      obsWs?.removeEventListener("message", handler); // Ensure handler is removed on timeout
      reject(new Error(`Request '${requestType}' timed out.`));
    }, 5000);
  });
}
// --- Hono Routes ---

// Serve static files (kept as is)
app.use(
  "/static/*",
  serveStatic({
    root: "./public",
    getContent: async (path: string) => {
      if (fs.existsSync(path)) {
        return fs.readFileSync(path);
      }
      return null;
    },
  })
);

// Serve the root HTML file directly (kept as is)
app.get(
  "/",
  serveStatic({
    root: "./public",
    path: "/index.html",
    getContent: async (path: string) => {
      if (fs.existsSync(path)) {
        return fs.readFileSync(path);
      }
      return null;
    },
  })
);
app.route("/api", apiRoutes);
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

// WebSocket endpoint for frontend clients (remains for real-time updates)
app.get(
  "/ws",
  upgradeWebSocket((c) => {
    return {
      onOpen: (evt, ws) => {
        const session = c.get("session");
        if (!session) {
          ws.send(
            JSON.stringify({
              type: "relay_connection_status", // Relay's own connection to frontend
              data: { status: "Auth Failed" },
            })
          );
          ws.close();
          return;
        }
        console.log("Frontend client connected!");
        frontendClients.add(ws);
        // On new frontend connection, send initial relay status and current OBS status
        ws.send(
          JSON.stringify({
            type: "relay_connection_status", // Relay's own connection to frontend
            data: { status: "connected", clientId: crypto.randomUUID() },
          })
        );
        // Also send current OBS status via relay_obs_status type
        ws.send(
          JSON.stringify({
            type: "relay_obs_status",
            data: {
              connection: obsWsConnected ? "identified" : "disconnected", // Current OBS state
              profile: {
                name: currentObsProfile?.name || "None",
                id: currentObsProfile?.id || "none",
              },
            },
          })
        );
      },
      onClose: (evt, ws) => {
        console.log("Frontend client disconnected!");
        frontendClients.delete(ws);
      },
      onError: (evt, ws) => {
        const errorEvent = evt as Event & { error?: any };
        console.error(
          "Frontend WebSocket Error:",
          errorEvent.error || evt.type
        );
        frontendClients.delete(ws);
      },
    };
  })
);

const server = serve({
  fetch: app.fetch,
  hostname: "0.0.0.0",
  port: 5468,
}).on("listening", () => {
  console.log("Server is running on port 5468");
});
injectWebSocket(server);
