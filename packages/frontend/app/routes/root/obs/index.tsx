import type { Route } from "./+types";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { useParams } from "react-router";
import {
  useStateManagement,
  useStateManagementFetch,
} from "~/hooks/useStateManagement";
import { useEffect } from "react";
import { Button } from "~/components/ui/button";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "streamCTRL | Dashboard" },
    { name: "description", content: "Welcome to StreamCTRL!" },
  ];
}
export default function ObsPage() {
  const { groupId } = useParams();
  const { value: WSProfiles } = useStateManagement<any[]>("ws-profiles", []);
  const {
    value: { data: Actions, fetchStatus: fetchStatus, refetch: refetchActions },
    mutate,
  } = useStateManagementFetch<any[]>({
    key: ["actions"],
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
  const profile = WSProfiles.find((e) => e.id === groupId);
  useEffect(() => {
    const fetchActions = async () => {};
    fetchActions();
  }, []); // The empty dependency array ensures this runs only once on mount
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
      {fetchStatus !== "fetching" && JSON.stringify(Actions)}
    </div>
  );
}
