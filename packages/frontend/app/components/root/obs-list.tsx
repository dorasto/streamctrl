import { Link } from "react-router";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { useStateManagement } from "~/hooks/useStateManagement";

export default function ObsList() {
  const { value: WSProfiles } = useStateManagement<any[]>("ws-profiles", []);
  return (
    <div className="flex flex-col gap-3">
      <Label className="text-2xl font-bold">Connections</Label>
      <div className="grid grid-cols-3 gap-3">
        {WSProfiles.map((profile, index) => (
          <Link to={"/group/" + profile.id} key={index}>
            <Card>
              <CardHeader>
                <CardTitle>{profile.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={"secondary"}>
                  {profile.active ? "Connected" : "Disconnected"}
                </Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
