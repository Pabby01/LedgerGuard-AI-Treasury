import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/app-layout";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AiTreasury from "@/pages/ai-treasury";
import Transactions from "@/pages/transactions";
import Analytics from "@/pages/analytics";
import Policies from "@/pages/policies";
import AuditLogs from "@/pages/audit";
import Settings from "@/pages/settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

// Enforce dark mode globally
if (typeof document !== "undefined") {
  document.documentElement.classList.add("dark");
}

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/ai" component={AiTreasury} />
        <Route path="/transactions" component={Transactions} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/policies" component={Policies} />
        <Route path="/audit" component={AuditLogs} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
