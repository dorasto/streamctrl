// ~/utils/WsContext.ts
import { createContext, useContext, type ReactNode } from "react";

interface ContextType {
  session: any;
  ws: WebSocket | null; // It can be null initially or if disconnected
}

const RootContext = createContext<ContextType | undefined>(undefined);

export function RootProvider({
  children,
  ws,
  session,
}: {
  children: ReactNode;
  ws: WebSocket | null;
  session: any;
}) {
  return (
    <RootContext.Provider value={{ ws, session }}>
      {children}
    </RootContext.Provider>
  );
}

export function useLayoutData() {
  const context = useContext(RootContext);
  if (context === undefined) {
    throw new Error("useWs must be used within a WsProvider");
  }
  return context;
}
