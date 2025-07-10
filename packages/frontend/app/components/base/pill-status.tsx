import { CheckCircleIcon } from "lucide-react";
import { Pill, PillStatus } from "~/components/ui/pill";
import { useStateManagement } from "~/hooks/useStateManagement";

export default function PillBar() {
  const { value: WSStatus } = useStateManagement<any>(
    "ws-status",
    "Disconnected"
  );
  const { value: WSProfile } = useStateManagement<any>("ws-profile", "");
  return (
    <>
      <Pill variant={"outline"} className="">
        <PillStatus>
          <CheckCircleIcon className="text-green-500" size={12} />
          Websocket
        </PillStatus>
        {WSStatus}
      </Pill>
      <Pill variant={"outline"}>
        <PillStatus>
          <CheckCircleIcon className="text-green-500" size={12} />
          Profile
        </PillStatus>
        {WSProfile?.name}
      </Pill>
    </>
  );
}
