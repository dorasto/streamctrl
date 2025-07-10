import { CheckCircleIcon } from "lucide-react";
import { Pill, PillStatus } from "~/components/ui/pill";

export default function PillBar() {
  return (
    <>
      <Pill variant={"outline"} className="">
        <PillStatus>
          <CheckCircleIcon className="text-green-500" size={12} />
          Websocket
        </PillStatus>
        Connected
      </Pill>
      <Pill variant={"outline"}>
        <PillStatus>
          <CheckCircleIcon className="text-green-500" size={12} />
          Profile
        </PillStatus>
        ...
      </Pill>
    </>
  );
}
