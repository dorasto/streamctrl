import { CheckCircleIcon, Loader2 } from "lucide-react";
import { matchPath, Outlet, useLocation, useNavigate } from "react-router";
import {
  AppSidebarProvider,
  RootSidebarToggle,
} from "~/components/base/app-sidebar";
import { useAuth } from "~/components/base/auth-provider";
import PillBar from "~/components/base/pill-status";
import UserDropdown from "~/components/base/user-dropdown";
import useWebSocket from "~/utils/ws";
import { RootProvider } from "~/utils/Context";

function AuthContent() {
  const auth = useAuth();
  const navigate = useNavigate();
  const ws = useWebSocket();
  // useAuth() will initially return null, so we must handle that case.
  // Now that we know auth is available, we can safely use the session.
  const { data: session, isPending } = auth.authClient.useSession();

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div>
        <h1>Unauthorized</h1>
        <p>You must be logged in to view this page.</p>
        <button onClick={() => navigate("/login")}>Go to Login</button>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-1 flex-col overflow-hidden">
      <div className="bg-sidebar border-b z-50 flex h-(--header-height) items-center gap-2 p-2">
        <RootSidebarToggle />
        <div className="flex items-center gap-2">
          <PillBar />
        </div>
        <div className="ml-auto">
          <UserDropdown />
        </div>
      </div>
      <section className="bg-background flex !h-[calc(100dvh-var(--header-height))] flex-1">
        <div className="flex h-full w-fit max-w-fit transition-all">
          <AppSidebarProvider />
        </div>
        <div className="flex h-full w-full flex-col overflow-y-scroll p-3 transition-all">
          <RootProvider ws={ws} session={session}>
            <Outlet />
          </RootProvider>
        </div>
      </section>
    </div>
  );
}

export default function AdminLayout() {
  const auth = useAuth();
  // The AuthContent component is only rendered when auth is available,
  // ensuring that the hooks inside it are not called conditionally.
  return auth ? (
    <AuthContent />
  ) : (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="animate-spin" />
    </div>
  );
}
