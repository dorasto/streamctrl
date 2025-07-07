import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth.server";

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});

export type ISession = typeof authClient.$Infer.Session;

export const signIn = async () => {
  const data = await authClient.signIn.social({
    provider: "twitch",
  });
};
