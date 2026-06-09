import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useWallet, useBalance, useTransfer } from "@solana/react-hooks";
import { toAddress } from "@solana/client";
import { useWalletStore } from "@/store/use-wallet-store";
import { useThemeStore } from "@/store/use-theme-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useGetMe, useSignIn, useGetNonce, useSignOut } from "@workspace/api-client-react";
import {
  LayoutDashboard, MessageSquare, ListTree, PieChart, Shield,
  ScrollText, Settings, Wallet, Link as LinkIcon, Unlink,
  Sun, Moon, Menu, X, Bot, LogOut, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import bs58 from "bs58";

const navItems = [
  { href: "/",             label: "Dashboard",   icon: LayoutDashboard },
  { href: "/ai",           label: "AI Treasury", icon: Bot },
  { href: "/transactions", label: "Transactions", icon: ListTree },
  { href: "/analytics",    label: "Analytics",   icon: PieChart },
  { href: "/policies",     label: "Policies",    icon: Shield },
  { href: "/audit",        label: "Audit Logs",  icon: ScrollText },
  { href: "/settings",     label: "Settings",    icon: Settings },
];

function SidebarContent({
  location,
  onNavClick,
}: {
  location: string;
  onNavClick?: () => void;
}) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <>
      <div className="h-16 flex items-center px-6 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-primary/20" : "bg-primary/10"}`}>
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            LedgerGuard
          </span>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item, idx) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium group relative
                animate-fade-in-up
                ${isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }
              `}
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary-foreground rounded-r-full opacity-60" />
              )}
              <item.icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${!isActive ? "group-hover:scale-110" : ""}`} />
              {item.label}
              {item.href === "/ai" && (
                <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/20">AI</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={`px-4 py-4 border-t border-border text-xs text-muted-foreground ${isDark ? "bg-background/40" : "bg-secondary/30"}`}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-ring" />
          <span>Solana Devnet</span>
          <span className="ml-auto font-mono opacity-60">v1.0</span>
        </div>
      </div>
    </>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { address: storeAddress, setAddress: setStoreAddress } = useWalletStore();
  const { theme, toggle } = useThemeStore();
  const isDark = theme === "dark";

  const { connectors, wallet, actions } = useWallet();
  const { data: balance } = useBalance(wallet?.status === 'connected' ? wallet.session.account.address : undefined);

  const { data: me, isLoading: meLoading, refetch: refetchMe } = useGetMe();
  const { mutateAsync: getNonce } = useGetNonce();
  const { mutateAsync: signIn } = useSignIn();
  const { mutateAsync: signOut } = useSignOut();

  const [isConnecting, setIsConnecting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Debug wallet provider initialization
  useEffect(() => {
    console.log("Wallet hook state:", {
      wallet: wallet ? { status: wallet.status, address: wallet.session?.account.address.toString() } : null,
      connectorsCount: connectors?.all?.length || 0,
      actionsAvailable: !!actions,
    });
  }, [wallet, connectors, actions]);

  useEffect(() => {
    if (me?.address) {
      setStoreAddress(me.address);
    } else {
      setStoreAddress(null);
    }
  }, [me, setStoreAddress]);

  const handleSignIn = async () => {
    // Log current state for debugging
    console.log("handleSignIn called with:", { 
      wallet: wallet?.status, 
      connectorsAvailable: connectors?.all?.length,
      actionsAvailable: !!actions 
    });

    // Defensive checks: connectors/actions may not be ready immediately from provider
    if (!connectors || !connectors.all || connectors.all.length === 0) {
      console.error("Wallet provider not initialized!", { 
        connectors, 
        wallet, 
        actions,
        walletStatus: wallet?.status 
      });
      toast.error("Wallet provider not initialized. Try refreshing the page or check your browser console.");
      return;
    }

    if (!actions || typeof actions.connectWallet !== "function") {
      console.error("Wallet actions unavailable", { actions });
      toast.error("Wallet actions not available. Ensure the Solana provider is loaded.");
      return;
    }

    if (wallet?.status !== 'connected') {
      const connector = connectors.all[0];
      if (!connector) {
        toast.error("No wallet connector found");
        return;
      }
      try {
        setIsConnecting(true);
        console.log(`Connecting to wallet: ${connector.id}`);
        await actions.connectWallet(connector.id);
      } catch (err) {
        console.error("connectWallet failed", err);
        toast.error(`Failed to connect wallet: ${(err as any)?.message || 'Unknown error'}`);
        setIsConnecting(false);
        return;
      }
    }

    try {
      setIsConnecting(true);
      const { nonce } = await getNonce();
      if (!nonce) throw new Error("Failed to get nonce");

      if (!wallet || wallet.status !== 'connected' || !wallet.session) {
        throw new Error("Wallet not connected after connect step");
      }

      const address = wallet.session.account.address.toString();
      const message = `Sign in to LedgerGuard\n\nNonce: ${nonce}`;
      
      // Use standard wallet-standard signing
      const messageUint8 = new TextEncoder().encode(message);
      const signer = (wallet as any).session?.wallet;
      if (!signer || typeof signer.signMessage !== 'function') {
        throw new Error("Connected wallet does not support `signMessage`");
      }

      const { signature } = await signer.signMessage({
          message: messageUint8,
          account: wallet.session.account,
      });

      await signIn({
        data: {
          message,
          signature: bs58.encode(signature),
          publicKey: address,
        }
      });

      await refetchMe();
      toast.success("Successfully signed in");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to sign in");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      await actions.disconnectWallet();
      await refetchMe();
      toast.success("Signed out");
    } catch (err) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className={`
        hidden lg:flex flex-col w-64 border-r border-border transition-all duration-300
        glass-panel
      `}>
        <SidebarContent location={location} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:hidden
        glass-panel
        ${isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
      `}>
        <SidebarContent location={location} onNavClick={() => setIsMobileMenuOpen(false)} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className={`
          h-16 flex items-center justify-between px-4 lg:px-8 border-b border-border sticky top-0 z-30 backdrop-blur-md
          bg-background/80
        `}>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-secondary transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Network Healthy
            </div>
          </div>

          <div className="flex items-center gap-2.5 lg:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              className="rounded-full hover:bg-secondary transition-all duration-300 hover:rotate-12"
            >
              {isDark ? <Sun className="w-[1.1rem] h-[1.1rem]" /> : <Moon className="w-[1.1rem] h-[1.1rem]" />}
            </Button>

            {me ? (
              <div className="flex items-center gap-2">
                <div className={`
                  hidden md:flex flex-col items-end mr-1 animate-fade-in
                `}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground opacity-70">Balance</span>
                  <span className="text-sm font-mono font-bold text-primary">
                    {balance ? (Number(balance) / 1e9).toFixed(3) : "0.000"} SOL
                  </span>
                </div>
                
                <div className={`
                  flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border animate-fade-in
                  ${isDark ? "bg-primary/10 border-primary/20" : "bg-primary/5 border-primary/10"}
                `}>
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-[10px] text-white font-bold">
                    {me.address?.slice(0, 1)}
                  </div>
                  <span className="text-xs font-mono font-medium hidden sm:inline">
                    {me.address?.slice(0, 4)}...{me.address?.slice(-4)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleSignIn}
                disabled={isConnecting}
                className="rounded-full px-5 h-9 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-300 active:scale-95"
              >
                {isConnecting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <LinkIcon className="w-4 h-4 mr-2" />
                )}
                Connect Wallet
              </Button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden relative">
          {/* Subtle background glow */}
          <div className={`fixed top-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none ${isDark ? "bg-primary/5" : "bg-primary/10"}`} />
          <div className={`fixed bottom-1/4 left-1/4 w-64 h-64 rounded-full blur-[100px] pointer-events-none ${isDark ? "bg-accent/5" : "bg-accent/10"}`} />
          
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
