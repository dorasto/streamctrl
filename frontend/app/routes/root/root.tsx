import { Label } from "~/components/ui/label";
import type { Route } from "../+types/home";
import { useAuth } from "~/components/base/auth-provider";
import ObsList from "~/components/root/obs-list";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "streamCTRL | Dashboard" },
    { name: "description", content: "Welcome to StreamCTRL!" },
  ];
}

export default function Root() {
  const auth = useAuth();
  const { data: session } = auth.authClient.useSession();

  return (
    <div className="flex flex-col gap-3">
      <ObsList />
    </div>
  );
}
