import { useState } from "react";
import { useWalletStore } from "@/store/use-wallet-store";
import { useThemeStore } from "@/store/use-theme-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Save } from "lucide-react";

export default function Settings() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const { network, setNetwork } = useWalletStore();
  const [rpcUrl, setRpcUrl] = useState(
    network === "mainnet-beta" ? "https://api.mainnet-beta.solana.com" : "https://api.devnet.solana.com"
  );
  const [ledgerMode, setLedgerMode] = useState("speculos");
  const [aiModel, setAiModel] = useState("gpt-4o-mini");
  const [saved, setSaved] = useState(false);

  const handleNetworkChange = (v: string) => {
    setNetwork(v);
    setRpcUrl(v === "mainnet-beta" ? "https://api.mainnet-beta.solana.com" : "https://api.devnet.solana.com");
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const sectionClass = `border rounded-xl p-5 space-y-4 animate-fade-in-up ${isDark ? "glass-card" : "bg-white border-border shadow-sm"}`;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="animate-fade-in-up">
        <h1 className={`text-2xl font-bold tracking-tight ${isDark ? "shimmer-text" : "gradient-text-light"}`}>Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure your LedgerGuard treasury environment</p>
      </div>

      {/* Network */}
      <section className={sectionClass} style={{ animationDelay: "60ms" }}>
        <h2 className="text-sm font-semibold flex items-center gap-2">Network Configuration</h2>
        <div className="space-y-1.5">
          <Label>Solana Network</Label>
          <Select value={network} onValueChange={handleNetworkChange}>
            <SelectTrigger className="bg-background w-64" data-testid="network-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="devnet">Devnet</SelectItem>
              <SelectItem value="testnet">Testnet</SelectItem>
              <SelectItem value="mainnet-beta">Mainnet Beta</SelectItem>
            </SelectContent>
          </Select>
          {network === "mainnet-beta" && (
            <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
              Warning: Mainnet transactions involve real SOL
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>RPC URL</Label>
          <Input value={rpcUrl} onChange={(e) => setRpcUrl(e.target.value)} className="bg-background font-mono text-xs" data-testid="rpc-url" />
          <p className="text-xs text-muted-foreground">Custom RPC endpoint for higher rate limits</p>
        </div>
      </section>

      {/* Ledger */}
      <section className={sectionClass} style={{ animationDelay: "120ms" }}>
        <h2 className="text-sm font-semibold">Ledger Configuration</h2>
        <div className="space-y-1.5">
          <Label>Ledger Mode</Label>
          <Select value={ledgerMode} onValueChange={setLedgerMode}>
            <SelectTrigger className="bg-background w-64" data-testid="ledger-mode-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="speculos">Speculos (Emulator)</SelectItem>
              <SelectItem value="hardware">Hardware Device</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${ledgerMode !== "disabled" ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground"}`} />
          <span className="text-sm text-muted-foreground">
            {ledgerMode === "speculos" ? "Speculos emulator connected" : ledgerMode === "hardware" ? "Waiting for hardware device..." : "Ledger integration disabled"}
          </span>
        </div>
      </section>

      {/* AI */}
      <section className={sectionClass} style={{ animationDelay: "180ms" }}>
        <h2 className="text-sm font-semibold">AI Configuration</h2>
        <div className="space-y-1.5">
          <Label>AI Model</Label>
          <Select value={aiModel} onValueChange={setAiModel}>
            <SelectTrigger className="bg-background w-64" data-testid="ai-model-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast)</SelectItem>
              <SelectItem value="gpt-4o">GPT-4o (Balanced)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Structured JSON outputs</p>
            <p className="text-xs text-muted-foreground">AI always returns machine-parseable action proposals</p>
          </div>
          <Switch checked={true} disabled />
        </div>
      </section>

      <Button onClick={handleSave} className="gap-2" data-testid="save-settings">
        {saved ? <><CheckCircle className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save Settings</>}
      </Button>
    </div>
  );
}
