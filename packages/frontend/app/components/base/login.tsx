import { Button } from "../ui/button";
import { ArrowUpRight } from "lucide-react";
import { useAuth } from "./auth-provider";

export default function Login() {
  const auth = useAuth();

  if (!auth) {
    return (
      <Button size="lg" className="rounded-full text-base" disabled>
        Loading...
      </Button>
    );
  }

  const { data: session, isPending, refetch } = auth.authClient.useSession();

  const handleSignIn = () => {
    auth.signIn();
  };

  const handleSignOut = async () => {
    await auth.authClient.signOut();
    refetch();
  };

  if (isPending) {
    return (
      <Button size="lg" className="rounded-full text-base" disabled>
        Loading...
      </Button>
    );
  }

  if (session && session.user) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-semibold">
          {session.user.name || session.user.email || "User"}
        </span>
        <Button
          size="lg"
          className="rounded-full text-base"
          variant="outline"
          onClick={handleSignOut}
        >
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <Button size="lg" className="rounded-full text-base" onClick={handleSignIn}>
      Login <ArrowUpRight className="!h-5 !w-5" />
    </Button>
  );
}
