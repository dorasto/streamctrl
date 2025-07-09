import { Link } from "react-router";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";

export default function ObsList() {
  return (
    <div className="flex flex-col gap-3">
      <Label className="text-2xl font-bold">Connections</Label>
      <div className="grid grid-cols-3 gap-3">
        <Link to={"/group/1"}>
          <Card>
            <CardHeader>
              <CardTitle>OBS Name</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={"secondary"}>Connected</Badge>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
