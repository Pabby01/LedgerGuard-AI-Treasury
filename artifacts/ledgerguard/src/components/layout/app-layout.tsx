import React from "react";
import { Link, useLocation } from "wouter";
import { useWalletStore } from "@/store/use-wallet-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LayoutDashboard, MessageSquare, ListTree, PieChart, Shield, ScrollText, Settings, Wallet, Link as LinkIcon, Unlink } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { address, setAddress } = useWalletStore();
  const [walletInput, setWalletInput] = React.useState("");
  const [isWalletModalOpen, setIsWalletModalOpen] = React.useState(false);

  const handleConnect = () => {
    if (walletInput.trim()) {
      setAddress(walletInput.trim());
      setIsWalletModalOpen(false);
    }
  };

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/ai", label: "AI Treasury", icon: MessageSquare },
    { href: "/transactions", label: "Transactions", icon: ListTree },
    { href: "/analytics", label: "Analytics", icon: PieChart },
    { href: "/policies", label: "Policies", icon: Shield },
    { href: "/audit", label: "Audit Logs", icon: ScrollText },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground dark">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2 text-primary">
            <Shield className="w-6 h-6" />
            <span className="font-bold text-lg tracking-tight">LedgerGuard</span>
          </div>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-background flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            {/* Ledger Status */}
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full border border-border">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Ledger: Speculos Connected
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {address ? (
              <div className="flex items-center gap-2 bg-secondary rounded-lg p-1 pr-3 border border-border shadow-sm">
                <div className="bg-background rounded-md p-1.5 border border-border">
                  <Wallet className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-mono text-muted-foreground">
                  {address.slice(0, 4)}...{address.slice(-4)}
                </span>
                <button 
                  onClick={() => setAddress(null)}
                  className="ml-2 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Unlink className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Dialog open={isWalletModalOpen} onOpenChange={setIsWalletModalOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 shadow-sm font-medium border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20">
                    <LinkIcon className="w-4 h-4" />
                    Connect Wallet
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Connect Wallet</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-muted-foreground">Solana Wallet Address</Label>
                      <Input
                        id="address"
                        placeholder="Paste address here..."
                        value={walletInput}
                        onChange={(e) => setWalletInput(e.target.value)}
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

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
