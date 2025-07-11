import type { Route } from "./+types";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { useParams } from "react-router";
import {
  useStateManagement,
  useStateManagementFetch,
} from "~/hooks/useStateManagement";
import { Button } from "~/components/ui/button";
import { Loader2 } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "streamCTRL | Dashboard" },
    { name: "description", content: "Welcome to StreamCTRL!" },
  ];
}
export default function ObsPage() {
  const { groupId } = useParams();
  const { value: WSProfiles } = useStateManagement<any[]>("ws-profiles", []);
  const profile = WSProfiles.find((e) => e.id === groupId);
  const {
    value: { data: Actions, refetch: refetchActions },
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
      url: import.meta.env.VITE_API_URL + "scenes",
      custom: async (url, newTodoData) => {
        const res = await fetch(url, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Failed to add todo");
        return res.json();
      },
    },
    refetchOnWindowFocus: true,
  });
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
      <Button
        onClick={() => {
          mutate?.(["test", ""]);
        }}
      >
        Test
      </Button>
      {Actions?.sort((a, b) => a.sort - b.sort)?.map((action, index) => (
        <div key={index}>
          {action.name} | {action.active ? "ON" : "OFF"}
        </div>
      ))}
    </div>
  );
}
