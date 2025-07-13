import type { Route } from "./+types";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { useParams } from "react-router";
import {
  useStateManagement,
  useStateManagementFetch,
} from "~/hooks/useStateManagement";
import { Loader2, Plus } from "lucide-react";
import SortActions from "~/components/actions/sort";
import { useLayoutData } from "~/utils/Context";
import { useEffect } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "streamCTRL | Dashboard" },
    { name: "description", content: "Welcome to StreamCTRL!" },
  ];
}
export default function ObsPage() {
  const { ws } = useLayoutData();
  const { groupId } = useParams();
  const { value: WSClientId } = useStateManagement<string>("ws-client-id", "");
  const { value: WSProfiles } = useStateManagement<any[]>("ws-profiles", []);
  const profile = WSProfiles.find((e) => e.id === groupId);
  const {
    value: { data: actions, refetch: refetchActions },
    mutate,
  } = useStateManagementFetch<any[]>({
    key: ["actions-" + profile?.id],
    initialData: [],
    fetch: {
      url: import.meta.env.VITE_API_URL + "actions",
      async custom(url) {
        try {
          if (profile?.id) {
            const response = await fetch(url, {
              method: "POST",
              credentials: "include",
              body: JSON.stringify({
                profile_id: profile?.id,
              }),
            });
            if (!response.ok) {
              // Handle HTTP errors (e.g., 404, 500)
              return [];
            }
            const data = await response.json();
            return data;
          } else {
            setTimeout(() => {
              refetchActions();
            }, 500);
          }
        } catch (error) {
          console.error("Error fetching actions:", error);
          return [];
        }
      },
    },
    mutate: {
      url: import.meta.env.VITE_API_URL + "actions",
      custom: async (url, actions) => {
        const res = await fetch(url, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: WSClientId, data: actions }),
        });
        if (!res.ok) throw new Error("Failed to add todo");
        return res.json();
      },
    },
    refetchOnWindowFocus: true,
  });
  useEffect(() => {
    const abortController = new AbortController();

    // Make sure 'ws' is not null or undefined before adding the event listener
    if (ws) {
      ws.addEventListener(
        "message",
        (e) => {
          let wsMessage;
          try {
            wsMessage = JSON.parse(e.data);
          } catch (e) {
            console.error("Failed to parse WebSocket message:", e);
            return;
          }
          if (wsMessage.type === "relay_connection_update_actions") {
            refetchActions();
          }
        },
        { signal: abortController.signal }
      );
    }
    // Return a cleanup function that calls abortController.abort()
    return () => {
      // This function will be called when the component unmounts
      // or when 'ws' or 'refetchActions' dependencies change.
      console.log("Aborting WebSocket event listener...");
      abortController.abort();
    };
  }, [ws, refetchActions]); // Dependencies
  if (profile?.id === undefined) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="rounded-md h-full max-h-full overflow-hidden gap-3"
    >
      <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="">
        <div className="flex flex-col w-full h-full min-w-full bg-card rounded-md border px-3">
          <div className="border-b p-3 flex items-center gap-2 w-full">
            <Label variant={"heading"}>Actions</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"default"}
                  size="icon"
                  className="ml-auto data-[state=open]:bg-secondary/70"
                >
                  <Plus />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                side="right"
                className="p-0 flex flex-col gap-3"
              >
                <div className="border-b p-3">
                  <Label variant={"subtext"}>New action</Label>
                </div>
                <div className="px-3 pb-3 flex flex-col gap-3">
                  <div className="group relative">
                    <label
                      htmlFor={"action-name"}
                      className="bg-popover text-muted-foreground/70 absolute start-1 top-0 z-10 block -translate-y-1/2 px-2 text-xs font-medium group-has-disabled:opacity-50"
                    >
                      Name
                    </label>
                    <Input
                      id={"action-name"}
                      className="h-12 !bg-popover placeholder:text-muted-foreground/70"
                      placeholder="My Action"
                    />
                  </div>
                  <Button>Create</Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex-1 overflow-y-auto py-3">
            <SortActions _actions={actions || []} mutate={mutate} />
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle className="bg-border/0" />
      <ResizablePanel defaultSize={80}>
        <ResizablePanelGroup direction="vertical" className="gap-3">
          <ResizablePanel defaultSize={25} minSize={10} maxSize={30}>
            <div className="flex flex-col w-full h-full min-w-full bg-card rounded-md border px-3">
              <div className="border-b p-3 flex items-center gap-2 w-full">
                <Label variant={"heading"}>Triggers</Label>
              </div>
              <div className="flex-1 overflow-y-auto py-3">
                {/* <SortActions _actions={actions || []} mutate={mutate} /> */}
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle className="bg-border/0" />
          <ResizablePanel defaultSize={75}>
            <div className="flex flex-col w-full h-full min-w-full bg-card rounded-md border px-3">
              <div className="border-b p-3 flex items-center gap-2 w-full">
                <Label variant={"heading"}>Events</Label>
              </div>
              <div className="flex-1 overflow-y-auto py-3">
                {/* <SortActions _actions={actions || []} mutate={mutate} /> */}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
