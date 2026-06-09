import { useState } from "react";
import { useGetSpendingAnalytics, useGetTreasuryHealth, useGetTopRecipients } from "@workspace/api-client-react";
import { useThemeStore } from "@/store/use-theme-store";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, Cell } from "recharts";

const PERIODS = ["weekly", "monthly", "quarterly"] as const;

function HealthGauge({ score }: { score: number }) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : score >= 40 ? "#f97316" : "#ef4444";
  const data = [
    { name: "health", value: score, fill: color },
    { name: "gap", value: 100 - score, fill: "transparent" },
  ];
  return (
    <div className="relative flex flex-col items-center">
      <RadialBarChart width={180} height={180} cx={90} cy={90} innerRadius={55} outerRadius={80} startAngle={180} endAngle={0} data={data}>
        <RadialBar dataKey="value" cornerRadius={4} background={{ fill: isDark ? "hsl(222 18% 14%)" : "hsl(220 14% 92%)" }}>
          <Cell fill={color} />
          <Cell fill="transparent" />
        </RadialBar>
      </RadialBarChart>
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ top: 20 }}>
        <span className="text-3xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

export default function Analytics() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const [period, setPeriod] = useState<"weekly" | "monthly" | "quarterly">("monthly");
  const { data: spending, isLoading: spendLoading } = useGetSpendingAnalytics({ period });
  const { data: health, isLoading: healthLoading } = useGetTreasuryHealth();
  const { data: topRecipients, isLoading: recLoading } = useGetTopRecipients({ limit: 5 });

  const tooltipStyle = {
    backgroundColor: isDark ? "hsl(222 18% 11%)" : "hsl(0 0% 100%)",
    border: `1px solid ${isDark ? "hsl(220 15% 18%)" : "hsl(220 14% 88%)"}`,
    borderRadius: 8,
    color: isDark ? "hsl(210 20% 92%)" : "hsl(224 30% 10%)",
    fontSize: 12,
    boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.4)" : "0 4px 16px rgba(0,0,0,0.1)",
  };

  const gridStroke = isDark ? "hsl(220 15% 16%)" : "hsl(220 14% 90%)";
  const axisColor = isDark ? "hsl(215 14% 50%)" : "hsl(220 10% 55%)";

  const cardClass = `border rounded-xl p-5 animate-fade-in-up ${isDark ? "glass-card" : "bg-white border-border shadow-sm"}`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="animate-fade-in-up">
        <h1 className={`text-2xl font-bold tracking-tight ${isDark ? "shimmer-text" : "gradient-text-light"}`}>
          Treasury Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Spending patterns, runway, and treasury health metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className={`${cardClass} flex flex-col items-center gap-2`} style={{ animationDelay: "60ms" }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Health Score</p>
          {healthLoading ? <Skeleton className="w-40 h-40 rounded-full" /> : <HealthGauge score={health?.healthScore ?? 0} />}
          {health && (
            <span className={`text-sm font-bold ${health.healthScore >= 80 ? "text-emerald-400" : health.healthScore >= 60 ? "text-amber-400" : "text-red-400"}`}>
              {health.status}
            </span>
          )}
        </div>

        <div className={`${cardClass} space-y-3`} style={{ animationDelay: "120ms" }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Runway</p>
          {healthLoading ? <Skeleton className="h-20" /> : (
            <>
              <div className={`text-3xl font-bold ${isDark ? "gradient-text" : "gradient-text-light"}`}>
                {health?.runwayMonths?.toFixed(1) ?? "—"} <span className="text-base font-normal text-muted-foreground">months</span>
              </div>
              <div className="text-sm text-muted-foreground">At burn rate of {health?.burnRate?.toFixed(2) ?? "0"} SOL/mo</div>
              <div className="text-sm">Treasury: <span className="font-bold">{health?.runway?.toFixed(2) ?? "0"} SOL</span></div>
            </>
          )}
        </div>

        <div className={`${cardClass} space-y-3 sm:col-span-2 md:col-span-1`} style={{ animationDelay: "180ms" }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Spending Summary</p>
          {spendLoading ? <Skeleton className="h-20" /> : (
            <>
              <div className="text-3xl font-bold">{spending?.totalSpent?.toFixed(2) ?? "0"} <span className="text-base font-normal text-muted-foreground">SOL</span></div>
              <div className="text-sm text-muted-foreground">{spending?.transactionCount ?? 0} transactions</div>
              <div className="text-sm">Avg: <span className="font-bold">{spending?.avgTransactionSize?.toFixed(2) ?? "0"} SOL</span></div>
            </>
          )}
        </div>
      </div>

      <div className={cardClass} style={{ animationDelay: "240ms" }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-sm font-semibold">Spending Over Time</h2>
          <div className={`flex rounded-lg p-0.5 gap-0.5 ${isDark ? "bg-secondary" : "bg-secondary border border-border"}`}>
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 capitalize ${
                  period === p
                    ? isDark
                      ? "bg-card text-foreground shadow"
                      : "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        {spendLoading ? <Skeleton className="h-48" /> : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={spending?.data ?? []}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(250 84% 60%)" stopOpacity={isDark ? 0.3 : 0.15} />
                  <stop offset="95%" stopColor="hsl(250 84% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} SOL`, "Spent"]} />
              <Area type="monotone" dataKey="amount" stroke="hsl(250 84% 60%)" strokeWidth={2} fill="url(#spendGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className={cardClass} style={{ animationDelay: "300ms" }}>
        <h2 className="text-sm font-semibold mb-4">Top Recipients</h2>
        {recLoading ? <Skeleton className="h-40" /> : topRecipients && topRecipients.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topRecipients.map((r) => ({
              name: `${r.address.slice(0, 6)}…${r.address.slice(-4)}`,
              amount: r.totalAmount,
              txns: r.transactionCount,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} SOL`, "Total"]} />
              <Bar dataKey="amount" fill="hsl(172 72% 38%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">No confirmed transactions yet</div>
        )}
      </div>
    </div>
  );
}
