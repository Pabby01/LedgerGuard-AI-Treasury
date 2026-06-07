import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/app-layout";
import { useThemeStore } from "@/store/use-theme-store";
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

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  return <>{children}</>;
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
        <ThemeProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
