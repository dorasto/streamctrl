import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<any>(null);

  useEffect(() => {
    const loadAuth = async () => {
      const authModule = await import("~/lib/auth.client");
      setAuth(authModule);
    };
    loadAuth();
  }, []);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
