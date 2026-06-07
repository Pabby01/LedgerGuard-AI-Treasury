import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useWalletStore } from "@/store/use-wallet-store";
import { useThemeStore } from "@/store/use-theme-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LayoutDashboard, MessageSquare, ListTree, PieChart, Shield,
  ScrollText, Settings, Wallet, Link as LinkIcon, Unlink,
  Sun, Moon, Menu, X, Bot,
} from "lucide-react";

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
  const { address, setAddress } = useWalletStore();
  const { theme, toggle } = useThemeStore();
  const isDark = theme === "dark";

  const [walletInput, setWalletInput] = useState("");
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleConnect = () => {
    if (walletInput.trim()) {
      setAddress(walletInput.trim());
      setIsWalletModalOpen(false);
    }
  };

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  return (
    <div className={`flex min-h-screen w-full bg-background text-foreground ${isDark ? "web3-bg" : ""}`}>

      {/* ── Animated glow orbs (dark mode only) ── */}
      {isDark && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
          <div
            className="absolute w-[600px] h-[600px] rounded-full opacity-20 animate-glow-drift"
            style={{
              background: "radial-gradient(circle, rgba(109,40,255,0.6) 0%, transparent 70%)",
              top: "-15%",
              right: "5%",
            }}
          />
          <div
            className="absolute w-[500px] h-[500px] rounded-full opacity-15 animate-glow-drift-2"
            style={{
              background: "radial-gradient(circle, rgba(20,241,149,0.5) 0%, transparent 70%)",
              bottom: "5%",
              left: "10%",
            }}
          />
        </div>
      )}

      {/* ── Mobile sidebar overlay ── */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar (desktop: always visible / mobile: slide-in drawer) ── */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50 md:z-auto
          w-64 h-screen md:h-screen flex-shrink-0
          flex flex-col border-r border-border
          ${isDark ? "bg-sidebar" : "bg-sidebar shadow-xl md:shadow-none"}
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? "translate-x-0 animate-slide-in-left" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Close button (mobile only) */}
        <button
          className="absolute top-4 right-4 md:hidden p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <X className="w-4 h-4" />
        </button>

        <SidebarContent location={location} onNavClick={() => setIsMobileMenuOpen(false)} />
      </aside>

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">

        {/* ── Topbar ── */}
        <header className={`
          sticky top-0 z-30 h-16 border-b border-border
          flex items-center justify-between px-4 md:px-8
          ${isDark ? "bg-background/80 backdrop-blur-xl" : "bg-background/95 backdrop-blur-sm shadow-sm"}
        `}>

          {/* Left: hamburger (mobile) + status */}
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Ledger status pill */}
            <div className={`
              hidden sm:flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border
              ${isDark
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"}
            `}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Ledger: Speculos Connected
            </div>
          </div>

          {/* Right: theme toggle + wallet */}
          <div className="flex items-center gap-2 md:gap-3">

            {/* Theme toggle */}
            <button
              onClick={toggle}
              className={`
                p-2 rounded-lg border transition-all duration-300
                ${isDark
                  ? "bg-secondary/60 border-border text-amber-400 hover:bg-secondary hover:border-amber-500/30 hover:shadow-[0_0_12px_rgba(251,191,36,0.2)]"
                  : "bg-secondary border-border text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200"}
              `}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark
                ? <Sun className="w-4 h-4" />
                : <Moon className="w-4 h-4" />
              }
            </button>

            {/* Wallet */}
            {address ? (
              <div className={`
                flex items-center gap-2 rounded-lg p-1 pr-3 border
                ${isDark ? "bg-secondary border-border" : "bg-white border-border shadow-sm"}
              `}>
                <div className={`rounded-md p-1.5 border ${isDark ? "bg-background border-border" : "bg-secondary border-border"}`}>
                  <Wallet className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
                  {address.slice(0, 4)}...{address.slice(-4)}
                </span>
                <button
                  onClick={() => setAddress(null)}
                  className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                  title="Disconnect wallet"
                >
                  <Unlink className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Dialog open={isWalletModalOpen} onOpenChange={setIsWalletModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className={`
                      gap-1.5 font-medium transition-all duration-200
                      ${isDark
                        ? "border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 hover:shadow-[0_0_16px_rgba(109,40,255,0.3)]"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"}
                    `}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Connect Wallet</span>
                    <span className="sm:hidden">Connect</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-primary" />
                      Connect Wallet
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                        Solana Wallet Address
                      </Label>
                      <Input
                        id="address"
                        placeholder="Paste your Solana address..."
                        value={walletInput}
                        onChange={(e) => setWalletInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                        className="bg-background border-border font-mono text-sm"
                      />
                    </div>
                    <Button onClick={handleConnect} className="w-full">
                      Connect
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-auto p-4 md:p-8 pb-20 md:pb-8">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom navigation ── */}
      <nav className={`
        fixed bottom-0 left-0 right-0 z-30 md:hidden
        border-t border-border
        ${isDark
          ? "bg-background/90 backdrop-blur-xl"
          : "bg-white/95 backdrop-blur-sm shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"}
      `}>
        <div className="flex items-center justify-around px-1 py-2 safe-area-pb">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-[52px]
                  ${isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"}
                `}
              >
                <span className={`
                  relative p-1.5 rounded-lg transition-all duration-200
                  ${isActive
                    ? isDark ? "bg-primary/15 shadow-[0_0_10px_rgba(109,40,255,0.3)]" : "bg-primary/10"
                    : ""}
                `}>
                  <item.icon className="w-4.5 h-4.5" style={{ width: "18px", height: "18px" }} />
                  {isActive && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-primary rounded-full" />
                  )}
                </span>
                <span className={`text-[10px] font-medium leading-none ${isActive ? "text-primary" : ""}`}>
                  {item.label.split(" ")[0]}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
