import { Loader2 } from "lucide-react";
import { Outlet, useNavigate } from "react-router";
import { useAuth } from "~/components/base/auth-provider";

function AuthContent() {
  const auth = useAuth();
  const navigate = useNavigate();

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
        <button onClick={() => navigate("/")}>Go to Homepage</button>
      </div>
    );
  }

  return <Outlet />;
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
