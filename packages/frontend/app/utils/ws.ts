import { useEffect, useState } from "react";
import { useStateManagement } from "~/hooks/useStateManagement";

const useWebSocket = () => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const { value: wSStatus, setValue: setWSStatus } = useStateManagement<any>(
    "ws-status",
    "Disconnected"
  );
  useEffect(() => {
    let webSocket: WebSocket | null = null;
    const connectWebSocket = () => {
      webSocket = new WebSocket("ws://localhost:5468/ws");
      webSocket.onopen = () => {
        console.log("Connected to Hono OBS Relay WebSocket!");
        setWSStatus("Connected");
        setWs(webSocket);
      };
      webSocket.onclose = () => {
        setWs(null);
      };
      webSocket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    };
    connectWebSocket();
    // Clean up WebSocket connection when the component unmounts or dependencies change
    return () => {
      if (webSocket) {
        webSocket.close();
      }
    };
  }, []);
  return { ws };
};
export default useWebSocket;
