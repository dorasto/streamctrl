import { useEffect, useState } from "react";
import { useStateManagement } from "~/hooks/useStateManagement";
let webSocket: WebSocket | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
const useWebSocket = () => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const { setValue: setWSStatus } = useStateManagement<any>(
    "ws-status",
    "Disconnected"
  );
  const { setValue: setOBSStatus } = useStateManagement<any>(
    "ws-obs-status",
    "Disconnected"
  );
  const { setValue: setWSProfile } = useStateManagement<any>("ws-profile", "");
  const { setValue: setWSProfiles } = useStateManagement<any[]>(
    "ws-profiles",
    []
  );
  useEffect(() => {
    const connectWebSocket = () => {
      if (!webSocket) {
        setWSStatus("Connecting"); // Set status to connecting when attempting to connect
        setWSProfile("");
        webSocket = new WebSocket(import.meta.env.VITE_WS_URL);
        webSocket.onopen = () => {
          console.log("Connected to Hono OBS Relay WebSocket!");
          setWSStatus("Connected");
          setWs(webSocket);
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
          }
        };
        webSocket.onmessage = (e) => {
          let wsMessage;
          try {
            wsMessage = JSON.parse(e.data);
          } catch (e) {
            console.error("Failed to parse WebSocket message:", e);
            return;
          }
          console.log("🚀 ~ useWebSocket ~ onmessage ~ wsMessage:", wsMessage);
          if (wsMessage.type === "relay_connection_status") {
            setWSProfile(wsMessage.data.profile);
          }
          if (wsMessage.type === "relay_connection_profiles") {
            setWSProfiles(wsMessage.profiles);
          }
          if (wsMessage.type === "relay_obs_status") {
            if (wsMessage.data.comment === "Switching profiles") {
              setWSProfile("Switching profiles...");
            }
            if (wsMessage.data.connection === "identified") {
              setOBSStatus("Connected");
              setWSProfile(wsMessage.data.profile);
            } else if (wsMessage.data.connection === "disconnected") {
              setOBSStatus("Disconnected");
            }
          }
        };
        webSocket.onclose = () => {
          webSocket = null;
          console.log("WebSocket disconnected. Attempting to reconnect...");
          setWs(null);
          setWSStatus("Reconnecting"); // Change status to "Reconnecting"
          setWSProfile("");
          setOBSStatus("Disconnected");
          if (!webSocket) {
            connectWebSocket();
          }
        };

        webSocket.onerror = (error) => {
          console.error("WebSocket error:", error);
          if (webSocket && webSocket.readyState === WebSocket.OPEN) {
            webSocket.close(); // Close the connection to trigger onclose and reconnect
          }
          webSocket = null;
          setWs(null);
          setWSStatus("Disconnected"); // Change status to "Reconnecting"
          setWSProfile("");
          setOBSStatus("Disconnected");
        };
      }
    };
    setTimeout(() => {
      connectWebSocket();
    }, 100);
    // Clean up WebSocket connection and timeout when the component unmounts
    return () => {
      console.log("Clearing WebSocket on unmount.");
      webSocket?.close(); // This will trigger onclose, which cleans the map
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);
  return ws;
};

export default useWebSocket;
