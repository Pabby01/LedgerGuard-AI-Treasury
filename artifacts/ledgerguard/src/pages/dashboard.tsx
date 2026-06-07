import { useGetDashboardStats, useGetRecentActivity, useListTransactions } from "@workspace/api-client-react";
import { useThemeStore } from "@/store/use-theme-store";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, TrendingDown, TrendingUp, Wallet, AlertTriangle, Clock, Activity } from "lucide-react";

function RiskBadge({ score, level }: { score: number; level?: string | null }) {
  const l = level ?? (score >= 80 ? "CRITICAL" : score >= 60 ? "HIGH" : score >= 35 ? "MEDIUM" : "LOW");
  const colors: Record<string, string> = {
    LOW:      "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    MEDIUM:   "bg-amber-500/15 text-amber-400 border-amber-500/30",
    HIGH:     "bg-orange-500/15 text-orange-400 border-orange-500/30",
    CRITICAL: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  const lightColors: Record<string, string> = {
    LOW:      "bg-emerald-50 text-emerald-700 border-emerald-200",
    MEDIUM:   "bg-amber-50 text-amber-700 border-amber-200",
    HIGH:     "bg-orange-50 text-orange-700 border-orange-200",
    CRITICAL: "bg-red-50 text-red-700 border-red-200",
  };
  const { theme } = useThemeStore();
  const cls = theme === "dark" ? colors[l] : lightColors[l];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${cls ?? (theme === "dark" ? colors.LOW : lightColors.LOW)}`}>
      {score} {l}
    </span>
  );
}

function StatCard({
  label, value, sub, icon: Icon, delay = 0, accent = false,
}: {
  label: string; value: string; sub?: string; icon: React.ElementType; delay?: number; accent?: boolean;
}) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <div
      className={`
        rounded-xl p-5 flex flex-col gap-3 border animate-fade-in-up glow-hover transition-all duration-300
        ${isDark
          ? "glass-card"
          : "bg-white border-border shadow-sm hover:shadow-md"}
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-primary/15" : "bg-primary/8"}`}
          style={{ background: isDark ? "rgba(109,40,255,0.15)" : "rgba(109,40,255,0.08)" }}>
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <div className={`text-2xl font-bold tracking-tight ${accent ? (isDark ? "gradient-text" : "gradient-text-light") : ""}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: actLoading } = useGetRecentActivity({ limit: 8 });
  const { data: txns, isLoading: txnsLoading } = useListTransactions({ status: "pending", limit: 5 });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className={`text-2xl font-bold tracking-tight ${isDark ? "shimmer-text" : "text-foreground"}`}>
          Treasury Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Real-time overview of your on-chain assets and operations</p>
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-2 flex-wrap animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border
          ${isDark
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Network: {statsLoading ? "…" : stats?.network ?? "devnet"}
        </div>
        <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border
          ${isDark
            ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
            : "bg-indigo-50 text-indigo-700 border-indigo-200"}`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
          </span>
          Ledger: Speculos Connected
        </div>
        <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border
          ${isDark ? "bg-secondary text-muted-foreground border-border" : "bg-secondary text-muted-foreground border-border"}`}>
          <Wallet className="w-3 h-3" />
          {statsLoading ? "…" : stats?.connectedWallets ?? 0} Wallets Connected
        </div>
      </div>

      {/* Stat cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="col-span-2">
            <StatCard
              label="Treasury Balance"
              value={`${stats?.treasuryBalance?.toFixed(2) ?? "0"} SOL`}
              sub="Live Devnet balance"
              icon={Wallet}
              delay={80}
              accent
            />
          </div>
          <StatCard
            label="Monthly Outflow"
            value={`${stats?.monthlyOutflow?.toFixed(2) ?? "0"} SOL`}
            sub="This month"
            icon={TrendingDown}
            delay={140}
          />
          <StatCard
            label="Monthly Inflow"
            value={`${stats?.monthlyInflow?.toFixed(2) ?? "0"} SOL`}
            sub="This month"
            icon={TrendingUp}
            delay={200}
          />
          <StatCard
            label="Risk Score"
            value={`${stats?.riskScore ?? 0}`}
            sub={stats && stats.riskScore < 35 ? "LOW risk" : stats && stats.riskScore < 60 ? "MEDIUM risk" : "HIGH risk"}
            icon={AlertTriangle}
            delay={260}
          />
          <StatCard
            label="Health Score"
            value={`${stats?.healthScore ?? 0}/100`}
            sub={stats && stats.healthScore >= 80 ? "Excellent" : stats && stats.healthScore >= 60 ? "Good" : "Needs attention"}
            icon={Shield}
            delay={320}
          />
        </div>
      )}

      {/* Two-column panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pending approvals */}
        <div
          className={`rounded-xl overflow-hidden border animate-fade-in-up ${isDark ? "glass-card" : "bg-white border-border shadow-sm"}`}
          style={{ animationDelay: "380ms" }}
        >
          <div className={`flex items-center justify-between px-5 py-4 border-b border-border ${isDark ? "" : "bg-secondary/20"}`}>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold">Pending Approvals</h2>
              {!txnsLoading && txns && txns.length > 0 && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border
                  ${isDark
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                  {txns.length}
                </span>
              )}
            </div>
          </div>
          {txnsLoading ? (
            <div className="p-5 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : txns?.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No pending approvals</div>
          ) : (
            <div className="divide-y divide-border">
              {txns?.map((t, i) => (
                <div
                  key={t.id}
                  className={`px-5 py-3 flex items-center justify-between transition-colors animate-fade-in-up
                    ${isDark ? "hover:bg-white/5" : "hover:bg-secondary/50"}`}
                  style={{ animationDelay: `${(i + 5) * 50}ms` }}
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium font-mono truncate">{t.recipient.slice(0, 6)}…{t.recipient.slice(-4)}</span>
                    <span className="text-xs text-muted-foreground truncate">{t.memo ?? "No memo"}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <span className="text-sm font-bold">{t.amount} {t.token}</span>
                    {t.riskScore != null && <RiskBadge score={t.riskScore} level={t.riskLevel} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div
          className={`rounded-xl overflow-hidden border animate-fade-in-up ${isDark ? "glass-card" : "bg-white border-border shadow-sm"}`}
          style={{ animationDelay: "440ms" }}
        >
          <div className={`flex items-center gap-2 px-5 py-4 border-b border-border ${isDark ? "" : "bg-secondary/20"}`}>
            <Activity className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Recent Activity</h2>
          </div>
          {actLoading ? (
            <div className="p-5 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : (
            <div className="divide-y divide-border">
              {activity?.map((item, i) => (
                <div
                  key={item.id}
                  className={`px-5 py-3 flex items-start gap-3 transition-colors animate-fade-in-up
                    ${isDark ? "hover:bg-white/5" : "hover:bg-secondary/50"}`}
                  style={{ animationDelay: `${(i + 5) * 40}ms` }}
                >
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
