import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { ArrowUpRight, Notebook } from "lucide-react";

export default function Welcome() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-2xl">
        <Badge className="bg-muted rounded-md border border-secondary text-muted-foreground p-3">
          Coming soon...
        </Badge>
        <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl md:leading-[1.2] font-bold">
          stream
          <kbd className="bg-muted text-secondary pointer-events-none inline-flex items-center rounded-md border px-3 font-mono select-none">
            Ctrl
          </kbd>
        </h1>
        <p className="mt-6 md:text-lg">
          Your ultimate streaming companion app, deployed on your own computer.
        </p>
        <div className="mt-12 flex items-center justify-center gap-4">
          <Button size="lg" className="rounded-full text-base">
            Login <ArrowUpRight className="!h-5 !w-5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="rounded-full text-base shadow-none"
          >
            <Notebook className="!h-5 !w-5" /> Docs
          </Button>
        </div>
      </div>
    </div>
  );
}
