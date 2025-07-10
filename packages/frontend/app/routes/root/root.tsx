import type { Route } from "../+types/home";
import ObsList from "~/components/root/obs-list";
import { Button } from "~/components/ui/button";
import { useLayoutData } from "~/utils/Context";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "streamCTRL | Dashboard" },
    { name: "description", content: "Welcome to StreamCTRL!" },
  ];
}

export default function Root() {
  const { ws, session } = useLayoutData();
  return (
    <div className="flex flex-col gap-3">
      <ObsList />
      <Button onClick={() => ws?.close()}>Close Socket</Button>
      session:{JSON.stringify(session)}
    </div>
  );
}
