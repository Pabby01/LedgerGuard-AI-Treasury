import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <Card className="w-full max-w-xl border-border glass-card">
        <CardContent className="p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
            <AlertCircle className="h-7 w-7 text-primary" />
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Routing error</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight gradient-text-light dark:shimmer-text">404 Page Not Found</h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            The route you asked for does not exist in the current build.
          </p>

          <div className="mt-6 flex justify-center">
            <Button asChild>
              <Link href="/">Return to dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
