import type { Route } from "../+types/home";
import { useAuth } from "~/components/base/auth-provider";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "streamCTRL | Dashboard" },
    { name: "description", content: "Welcome to StreamCTRL!" },
  ];
}

export default function Root() {
  const auth = useAuth();
  const { data: session } = auth.authClient.useSession();

  return <div>Hello, {session.user.name || session.user.email}!</div>;
}
