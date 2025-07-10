import type { Route } from "./+types";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { useLayoutData } from "~/utils/Context";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "streamCTRL | Dashboard" },
    { name: "description", content: "Welcome to StreamCTRL!" },
  ];
}

export default function ObsPage() {
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
