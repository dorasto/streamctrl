import { CheckCircleIcon, CircleOffIcon } from "lucide-react";
import { Pill, PillStatus } from "~/components/ui/pill";
import { useStateManagement } from "~/hooks/useStateManagement";
import { cn } from "~/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useLayoutData } from "~/utils/Context";
export default function PillBar() {
  const { value: WSStatus } = useStateManagement<any>(
    "ws-status",
    "Disconnected"
  );
  const { value: OBSStatus } = useStateManagement<any>(
    "ws-obs-status",
    "Disconnected"
  );
  const { value: WSProfile } = useStateManagement<any>("ws-profile", "");
  const { value: WSProfiles } = useStateManagement<any[]>("ws-profiles", []);
  const { ws } = useLayoutData();
  return (
    <>
      <Pill variant={"outline"} className="">
        <PillStatus>
          {WSStatus === "Connected" && (
            <CheckCircleIcon className={"text-green-500"} size={12} />
          )}
          {WSStatus !== "Connected" && (
            <CircleOffIcon className={"text-red-500"} size={12} />
          )}{" "}
          Websocket
        </PillStatus>
        <PillStatus className="border-r-0">
          {OBSStatus === "Connected" && (
            <CheckCircleIcon className={"text-green-500"} size={12} />
          )}
          {OBSStatus !== "Connected" && (
            <CircleOffIcon className={"text-red-500"} size={12} />
          )}
          OBS
        </PillStatus>
      </Pill>

      <Pill variant={"outline"} className="max-h-[27.6px] pr-0">
        <PillStatus>
          <CheckCircleIcon className="text-green-500" size={12} />
          Profile
        </PillStatus>
        <Select
          value={WSProfile?.id || WSProfile}
          onValueChange={(value) => {
            if (ws) {
              ws.send(
                JSON.stringify({
                  type: "switch_profile",
                  id: value,
                })
              );
            }
          }}
        >
          <SelectTrigger className="w-[180px] text-xs ">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WSProfiles.map((profile, index) => (
              <SelectItem key={index} value={profile.id}>
                {profile.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Pill>
    </>
  );
}
