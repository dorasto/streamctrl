import { useDynamicSidebar } from "@/hooks/use-dynamic-sidebar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "./sidebar";
import { useIsMobile } from "~/hooks/use-mobile";

import { useLocation, matchPath, Link, redirect } from "react-router";
import { cn } from "~/lib/utils";

import { Button } from "../ui/button";
import { Home, Menu, SidebarClose, Users } from "lucide-react";
import { useAuth } from "./auth-provider";
import type { ISession } from "~/lib/auth.client";

export default function AppSidebar() {
  const { isOpen: sidebarIsOpen, toggleSidebar: toggleRootSidebar } =
    useDynamicSidebar(["root-sidebar-state"]);
  const auth = useAuth();
  const { data: session } = auth.authClient.useSession() as {
    data: ISession | null;
  };
  return (
    <Sidebar
      collapsible="offcanvas"
      variant="sidebar"
      side="left"
      className="w-full !max-h-[calc(100svh-var(--header-height))]"
      dataSidebarClassName="!border-transparent !shadow-none"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size={"lg"}
              isActive={matchPath("/admin", useLocation().pathname) !== null}
            >
              <Link to={"/admin"}>
                <Home />
                Home
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size={"lg"}
                  asChild
                  //   isActive={
                  //     matchPath(`/${item.name}`, useLocation().pathname) !==
                  //     null
                  //   }
                >
                  <Link to={``}>
                    {/* <Icon /> */}
                    test
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {session?.user.role === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    size={"lg"}
                    asChild
                    isActive={
                      matchPath("/admin/users", useLocation().pathname) !== null
                    }
                  >
                    <Link to={`/admin/users`}>
                      <Users />
                      Users
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="bg-card rounded-b-md border-t">
        <SidebarMenu></SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => toggleRootSidebar()}
              className="bg-[#cd514b] hover:bg-[#cd514b]/70"
            >
              <img
                src="https://cdn.doras.to/doras/icon-white.svg"
                className="h-4 w-4"
                alt="Doras Logo"
              />
              Doras
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => toggleRootSidebar()}>
              <SidebarClose
                className={cn("transition-all", !sidebarIsOpen && "rotate-180")}
              />
              {sidebarIsOpen ? "Collapse" : "Expand"}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppSidebarProvider() {
  const isMobile = useIsMobile();
  return (
    <SidebarProvider
      style={{
        // @ts-ignore
        "--sidebar-width": "20rem",
      }}
      className="h-fit !max-h-[calc(100svh-var(--header-height))] w-fit"
      name="root-sidebar"
      defaultOpen={!isMobile}
    >
      <AppSidebar />
    </SidebarProvider>
  );
}

export function RootSidebarToggle({
  children,
  sidebar = false,
}: {
  children?: React.ReactNode;
  sidebar?: boolean;
}) {
  const useMobile = useIsMobile();
  const { isOpen: sidebarIsOpen, toggleSidebar: toggleSettingsSidebar } =
    useDynamicSidebar(["root-sidebar-state"]);
  if (sidebarIsOpen)
    return (
      <Link to={"/admin"}>
        <Button
          variant={"outline"}
          className="flex h-auto items-center gap-2 font-bold group"
        >
          <p className="md:leading-[1.2] font-bold">
            stream
            <kbd className="bg-muted text-secondary pointer-events-none inline-flex items-center rounded-md border px-3 font-mono select-none group-hover:text-foreground transition-all">
              Ctrl
            </kbd>
          </p>
        </Button>
      </Link>
    );
  return (
    <Button
      variant={"outline"}
      className={cn("")}
      size={"icon"}
      onClick={() => toggleSettingsSidebar()}
    >
      <span className="text-xs font-semibold">
        <Menu />
      </span>
    </Button>
  );
}
