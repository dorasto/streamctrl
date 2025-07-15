import { useEffect, useState } from "react";
import { useStateManagement } from "~/hooks/useStateManagement";
import type {
  RelayProfileListUpdateMessage,
  WebSocketMessage,
  WebSocketUnknownMessageStructure,
} from "types/ws";
const wsUrl = import.meta.env.VITE_WS_URL;
let webSocket: WebSocket | null = null;

const useWebSocket = () => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const { setValue: setWSStatus } = useStateManagement<string>(
    "ws-status",
    "Disconnected"
  );
  const { setValue: setWSClientId } = useStateManagement<string>(
    "ws-client-id",
    ""
  );
  const { setValue: setOBSStatus } = useStateManagement<string>(
    "ws-obs-status",
    "Disconnected"
  );
  const { setValue: setWSProfile } = useStateManagement<any>("ws-profile", "");
  const { setValue: setWSProfiles } = useStateManagement<
    RelayProfileListUpdateMessage["profiles"]
  >("ws-profiles", []);

  useEffect(() => {
    const connectWebSocket = () => {
      if (!webSocket) {
        setWSStatus("Connecting");
        setWSProfile("");
        webSocket = new WebSocket(wsUrl || "/ws");

        webSocket.onopen = () => {
          console.log("Connected to Hono OBS Relay WebSocket!");
          setWSStatus("Connected");
          setWs(webSocket);
        };

        webSocket.onmessage = (event) => {
          let wsMessage: WebSocketMessage;
          try {
            wsMessage = JSON.parse(event.data);
          } catch (e) {
            console.error("Failed to parse WebSocket message:", e);
            return;
          }

          switch (wsMessage.type) {
            case "RELAY_CONNECTION_STATUS":
              setWSProfile(wsMessage.data.profile);
              setWSClientId(wsMessage.data.clientId);
              break;
            case "RELAY_PROFILE_LIST":
              if (wsMessage.profiles) {
                setWSProfiles(wsMessage.profiles);
              }
              break;
            case "OBS_CONNECTION_STATUS": // Changed to OBS_CONNECTION_STATUS
              if (wsMessage.data.comment === "Switching profiles") {
                setWSProfile("Switching profiles...");
              }
              if (wsMessage.data.connection === "identified") {
                setOBSStatus("Connected");
                setWSProfile(wsMessage.data.profile!);
              } else if (wsMessage.data.connection === "disconnected") {
                setOBSStatus("Disconnected");
              }
              break;
            default:
              const unknownMessage =
                wsMessage as WebSocketUnknownMessageStructure;
              console.warn(
                "Unknown WebSocket message type:",
                unknownMessage.type
              );
          }
        };

        webSocket.onclose = () => {
          webSocket = null;
          console.log("WebSocket disconnected. Attempting to reconnect...");
          setWs(null);
          setWSStatus("Reconnecting");
          setWSProfile("");
          setOBSStatus("Disconnected");
          connectWebSocket();
        };

        webSocket.onerror = (error) => {
          console.error("WebSocket error:", error);
          if (webSocket && webSocket.readyState === WebSocket.OPEN) {
            webSocket.close();
          }
          webSocket = null;
          setWs(null);
          setWSStatus("Disconnected");
          setWSProfile("");
          setOBSStatus("Disconnected");
        };
      }
    };

    const timeoutId = setTimeout(() => {
      connectWebSocket();
    }, 100);

    return () => {
      console.log("Clearing WebSocket on unmount.");
      clearTimeout(timeoutId);
      webSocket?.close();
    };
  }, []);

  return ws;
};

export default useWebSocket;
