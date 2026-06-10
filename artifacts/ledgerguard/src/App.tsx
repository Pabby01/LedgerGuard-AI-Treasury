import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SolanaProvider } from "@solana/react-hooks";
import { createClient, autoDiscover, phantom, solflare, backpack, metamask } from "@solana/client";
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
      retry: 0,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
  },
});

// Initialize wallet connectors safely with error handling
const getWalletConnectors = () => {
  const connectors = [];
  
  // Add explicit wallets with error handling
  try {
    connectors.push(...phantom());
  } catch (e) {
    console.warn("Failed to load Phantom connector", e);
  }
  
  try {
    connectors.push(...solflare());
  } catch (e) {
    console.warn("Failed to load Solflare connector", e);
  }
  
  try {
    connectors.push(...backpack());
  } catch (e) {
    console.warn("Failed to load Backpack connector", e);
  }
  
  try {
    connectors.push(...metamask());
  } catch (e) {
    console.warn("Failed to load MetaMask connector", e);
  }
  
  // Always add auto-discover as fallback
  try {
    connectors.push(...autoDiscover());
  } catch (e) {
    console.warn("Failed to load auto-discover connectors", e);
  }
  
  console.log("Initialized wallet connectors:", connectors.length, connectors.map(c => c.id || c.name || 'unknown'));
  return connectors;
};

const solanaClient = createClient({
  endpoint: "https://api.devnet.solana.com",
  walletConnectors: getWalletConnectors(),
});

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
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
      <SolanaProvider client={solanaClient}>
        <TooltipProvider>
          <ThemeProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </ThemeProvider>
        </TooltipProvider>
      </SolanaProvider>
    </QueryClientProvider>
  );
}

export default App;
