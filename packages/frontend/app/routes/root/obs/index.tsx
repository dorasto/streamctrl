import type { Route } from "./+types";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { useParams } from "react-router";
import {
  useStateManagement,
  useStateManagementFetch,
} from "~/hooks/useStateManagement";
import { Loader2 } from "lucide-react";
import SortActions from "~/components/actions/sort";
import { useLayoutData } from "~/utils/Context";
import { useEffect } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { Label } from "~/components/ui/label";

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
      className="rounded-md h-full max-h-full overflow-hidden border"
    >
      <ResizablePanel defaultSize={20}>
        <div className="flex flex-col w-full h-full min-w-full bg-card px-3">
          <div className="border-b p-3 flex items-center gap-2 w-full">
            <Label variant={"heading"}>Actions</Label>
          </div>
          <div className="flex-1 overflow-y-auto py-3">
            <SortActions _actions={actions || []} mutate={mutate} />
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50}>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={25}>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">Two</span>
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={75}>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">Three</span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
