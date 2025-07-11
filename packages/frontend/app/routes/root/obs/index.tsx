import type { Route } from "./+types";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { useLayoutData } from "~/utils/Context";
import { useParams } from "react-router";
import { useStateManagement } from "~/hooks/useStateManagement";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "streamCTRL | Dashboard" },
    { name: "description", content: "Welcome to StreamCTRL!" },
  ];
}

export default function ObsPage() {
  const { groupId } = useParams();
  const { value: WSProfiles } = useStateManagement<any[]>("ws-profiles", []);
  const { value: WSActions } = useStateManagement<any[]>("ws-actions", []);
  const profile = WSProfiles.find((e) => e.id === groupId);
  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardHeader>
          <CardTitle>{profile?.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={"secondary"}>
            {" "}
            {profile?.active ? "Connected" : "Disconnected"}
          </Badge>
        </CardContent>
      </Card>
      {profile?.active && JSON.stringify(WSActions)}
    </div>
  );
}
