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
    <div className="flex flex-col gap-3">
      <Card>
        <CardHeader>
          <CardTitle>{profile?.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={"secondary"}>
            {profile?.active ? "Connected" : "Disconnected"}
          </Badge>
        </CardContent>
      </Card>
      <SortActions _actions={actions || []} mutate={mutate} />
    </div>
  );
}
