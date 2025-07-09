import { Label } from "~/components/ui/label";
import { useAuth } from "~/components/base/auth-provider";
import ObsList from "~/components/root/obs-list";
import type { Route } from "./+types";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "streamCTRL | Dashboard" },
    { name: "description", content: "Welcome to StreamCTRL!" },
  ];
}

export default function ObsPage() {
  const auth = useAuth();
  const { data: session } = auth.authClient.useSession();

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardHeader>
          <CardTitle>OBS Name</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={"secondary"}>Connected</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
