import { useGetDashboardStats, useGetRecentActivity, useListTransactions, useListWallets } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, TrendingDown, TrendingUp, Wallet, AlertTriangle, Clock, Activity } from "lucide-react";

function RiskBadge({ score, level }: { score: number; level?: string | null }) {
  const l = level ?? (score >= 80 ? "CRITICAL" : score >= 60 ? "HIGH" : score >= 35 ? "MEDIUM" : "LOW");
  const colors: Record<string, string> = {
    LOW: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    MEDIUM: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    HIGH: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    CRITICAL: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${colors[l] ?? colors.LOW}`}>
      {score} {l}
    </span>
  );
}

function StatCard({ label, value, sub, icon: Icon }: { label: string; value: string; sub?: string; icon: any }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: actLoading } = useGetRecentActivity({ limit: 8 });
  const { data: txns, isLoading: txnsLoading } = useListTransactions({ status: "pending", limit: 5 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Treasury Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Real-time overview of your on-chain assets and operations</p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Network: {statsLoading ? "..." : stats?.network ?? "devnet"}
        </div>
        <div className="flex items-center gap-2 text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Ledger: Speculos Connected
        </div>
        <div className="flex items-center gap-2 text-xs font-medium bg-secondary text-muted-foreground border border-border px-3 py-1.5 rounded-full">
          <Wallet className="w-3 h-3" />
          {statsLoading ? "..." : stats?.connectedWallets ?? 0} Wallets Connected
        </div>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="col-span-2">
            <StatCard label="Treasury Balance" value={`${stats?.treasuryBalance?.toFixed(2) ?? "0"} SOL`} sub="Live Devnet balance" icon={Wallet} />
          </div>
          <StatCard label="Monthly Outflow" value={`${stats?.monthlyOutflow?.toFixed(2) ?? "0"} SOL`} sub="This month" icon={TrendingDown} />
          <StatCard label="Monthly Inflow" value={`${stats?.monthlyInflow?.toFixed(2) ?? "0"} SOL`} sub="This month" icon={TrendingUp} />
          <StatCard label="Risk Score" value={`${stats?.riskScore ?? 0}`} sub={stats && stats.riskScore < 35 ? "LOW risk" : stats && stats.riskScore < 60 ? "MEDIUM risk" : "HIGH risk"} icon={AlertTriangle} />
          <StatCard label="Health Score" value={`${stats?.healthScore ?? 0}/100`} sub={stats && stats.healthScore >= 80 ? "Excellent" : stats && stats.healthScore >= 60 ? "Good" : "Needs attention"} icon={Shield} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold">Pending Approvals</h2>
              {!txnsLoading && txns && txns.length > 0 && (
                <span className="bg-amber-500/15 text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-500/30">{txns.length}</span>
              )}
            </div>
          </div>
          {txnsLoading ? (
            <div className="p-5 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : txns?.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No pending approvals</div>
          ) : (
            <div className="divide-y divide-border">
              {txns?.map((t) => (
                <div key={t.id} className="px-5 py-3 flex items-center justify-between hover:bg-secondary/40 transition-colors">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium font-mono">{t.recipient.slice(0, 6)}...{t.recipient.slice(-4)}</span>
                    <span className="text-xs text-muted-foreground">{t.memo ?? "No memo"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold">{t.amount} {t.token}</span>
                    {t.riskScore != null && <RiskBadge score={t.riskScore} level={t.riskLevel} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <Activity className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Recent Activity</h2>
          </div>
          {actLoading ? (
            <div className="p-5 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : (
            <div className="divide-y divide-border">
              {activity?.map((item) => (
                <div key={item.id} className="px-5 py-3 flex items-start gap-3 hover:bg-secondary/40 transition-colors">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                    item.type.includes("FAIL") ? "bg-red-400" :
                    item.type.includes("PASS") || item.type.includes("CONFIRM") ? "bg-emerald-400" :
                    "bg-primary"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-snug truncate">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(item.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
