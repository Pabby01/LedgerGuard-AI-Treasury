import { useListAuditLogs } from "@workspace/api-client-react";
import { useThemeStore } from "@/store/use-theme-store";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollText, Wifi, Bot, Shield, ShieldAlert, Send, Check, X, AlertTriangle, Key } from "lucide-react";

const EVENT_META: Record<string, { icon: any; color: string; label: string }> = {
  WALLET_CONNECTED: { icon: Wifi, color: "text-emerald-400", label: "Wallet Connected" },
  WALLET_DISCONNECTED: { icon: Wifi, color: "text-muted-foreground", label: "Wallet Disconnected" },
  AI_PROPOSAL_GENERATED: { icon: Bot, color: "text-primary", label: "AI Proposal Generated" },
  POLICY_CHECK_PASSED: { icon: Shield, color: "text-emerald-400", label: "Policy Check Passed" },
  POLICY_CHECK_FAILED: { icon: ShieldAlert, color: "text-red-400", label: "Policy Check Failed" },
  POLICY_CREATED: { icon: Shield, color: "text-indigo-400", label: "Policy Created" },
  POLICY_UPDATED: { icon: Shield, color: "text-indigo-400", label: "Policy Updated" },
  POLICY_DELETED: { icon: Shield, color: "text-muted-foreground", label: "Policy Deleted" },
  TRANSACTION_CREATED: { icon: Send, color: "text-indigo-400", label: "Transaction Created" },
  TRANSACTION_BROADCAST: { icon: Send, color: "text-primary", label: "Transaction Broadcast" },
  TRANSACTION_CONFIRMED: { icon: Check, color: "text-emerald-400", label: "Transaction Confirmed" },
  TRANSACTION_FAILED: { icon: X, color: "text-red-400", label: "Transaction Failed" },
  TRANSACTION_REJECTED: { icon: X, color: "text-red-400", label: "Transaction Rejected" },
  TRANSACTION_APPROVED: { icon: Check, color: "text-emerald-400", label: "Transaction Approved" },
  TRANSACTION_SIMULATED: { icon: AlertTriangle, color: "text-amber-400", label: "Transaction Simulated" },
  LEDGER_APPROVAL_REQUESTED: { icon: Key, color: "text-purple-400", label: "Ledger Approval Requested" },
  LEDGER_APPROVAL_GRANTED: { icon: Key, color: "text-emerald-400", label: "Ledger Approval Granted" },
};

function getEventMeta(event: string) {
  return EVENT_META[event] ?? { icon: ScrollText, color: "text-muted-foreground", label: event.replace(/_/g, " ") };
}

export default function AuditLogs() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const { data: logs, isLoading } = useListAuditLogs({ limit: 100 });

  return (
    <div className="space-y-5">
      <div className="animate-fade-in-up">
        <h1 className={`text-2xl font-bold tracking-tight ${isDark ? "shimmer-text" : "text-foreground"}`}>Audit Logs</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Complete immutable record of all treasury operations</p>
      </div>

      <div className={`border rounded-xl overflow-hidden animate-fade-in-up ${isDark ? "glass-card" : "bg-white border-border shadow-sm"}`} style={{ animationDelay: "60ms" }}>
        {isLoading ? (
          <div className="p-5 space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : logs?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No audit events yet</div>
        ) : (
          <div className="divide-y divide-border">
            {logs?.map((log) => {
              const meta = getEventMeta(log.event);
              const Icon = meta.icon;
              let parsedMeta: Record<string, any> = {};
              try { parsedMeta = JSON.parse(log.metadata ?? "{}"); } catch {}

              return (
                <div key={log.id} className={`px-5 py-3.5 flex items-start gap-4 transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-secondary/40"}`}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-secondary/50 mt-0.5">
                    <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{meta.label}</span>
                      {log.walletAddress && (
                        <span className="text-xs font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                          {log.walletAddress.slice(0, 6)}...{log.walletAddress.slice(-4)}
                        </span>
                      )}
                    </div>
                    {Object.keys(parsedMeta).length > 0 && (
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                        {Object.entries(parsedMeta).slice(0, 4).map(([k, v]) => (
                          <span key={k} className="text-xs text-muted-foreground">
                            <span className="text-muted-foreground/60">{k}:</span>{" "}
                            {Array.isArray(v) ? v.join(", ") : String(v).slice(0, 40)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
