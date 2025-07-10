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
  const { setValue: setWSProfile } = useStateManagement<any>("ws-profile", "");
  useEffect(() => {
    const connectWebSocket = () => {
      if (!webSocket) {
        setWSStatus("Connecting"); // Set status to connecting when attempting to connect
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
          let data;
          try {
            data = JSON.parse(e.data);
          } catch (e) {
            console.error("Failed to parse WebSocket message:", e);
            return;
          }
          console.log("🚀 ~ connectWebSocket ~ data:", data);
          if (data.type === "relay_connection_status") {
            setWSProfile(data.data.profile);
          }
        };
        webSocket.onclose = () => {
          webSocket = null;
          console.log("WebSocket disconnected. Attempting to reconnect...");
          setWs(null);
          setWSStatus("Reconnecting"); // Change status to "Reconnecting"
          reconnectTimeout = setTimeout(() => {
            if (!webSocket) {
              connectWebSocket();
            }
          }, 5000); // Reconnect after 5 seconds
        };

        webSocket.onerror = (error) => {
          console.error("WebSocket error:", error);
          if (webSocket && webSocket.readyState === WebSocket.OPEN) {
            webSocket.close(); // Close the connection to trigger onclose and reconnect
          }
          webSocket = null;
          connectWebSocket();
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
