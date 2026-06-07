import { useState } from "react";
import { useGetSpendingAnalytics, useGetTreasuryHealth, useGetTopRecipients } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, Cell } from "recharts";

const PERIODS = ["weekly", "monthly", "quarterly"] as const;

function HealthGauge({ score }: { score: number }) {
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : score >= 40 ? "#f97316" : "#ef4444";
  const data = [
    { name: "health", value: score, fill: color },
    { name: "gap", value: 100 - score, fill: "transparent" },
  ];
  return (
    <div className="relative flex flex-col items-center">
      <RadialBarChart width={180} height={180} cx={90} cy={90} innerRadius={55} outerRadius={80} startAngle={180} endAngle={0} data={data}>
        <RadialBar dataKey="value" cornerRadius={4} background={{ fill: "hsl(222 18% 14%)" }}>
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

const tooltipStyle = {
  backgroundColor: "hsl(222 18% 11%)",
  border: "1px solid hsl(220 15% 18%)",
  borderRadius: 8,
  color: "hsl(210 20% 92%)",
  fontSize: 12,
};

export default function Analytics() {
  const [period, setPeriod] = useState<"weekly" | "monthly" | "quarterly">("monthly");
  const { data: spending, isLoading: spendLoading } = useGetSpendingAnalytics({ period });
  const { data: health, isLoading: healthLoading } = useGetTreasuryHealth();
  const { data: topRecipients, isLoading: recLoading } = useGetTopRecipients({ limit: 5 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Treasury Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Spending patterns, runway, and treasury health metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Health Score</p>
          {healthLoading ? <Skeleton className="w-40 h-40 rounded-full" /> : <HealthGauge score={health?.healthScore ?? 0} />}
          {health && (
            <span className={`text-sm font-bold ${health.healthScore >= 80 ? "text-emerald-400" : health.healthScore >= 60 ? "text-amber-400" : "text-red-400"}`}>
              {health.status}
            </span>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Runway</p>
          {healthLoading ? <Skeleton className="h-20" /> : (
            <>
              <div className="text-3xl font-bold">{health?.runwayMonths?.toFixed(1) ?? "—"} <span className="text-base font-normal text-muted-foreground">months</span></div>
              <div className="text-sm text-muted-foreground">At burn rate of {health?.burnRate?.toFixed(2) ?? "0"} SOL/mo</div>
              <div className="text-sm">Treasury: <span className="font-bold">{health?.runway?.toFixed(2) ?? "0"} SOL</span></div>
            </>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
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

      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Spending Over Time</h2>
          <div className="flex bg-secondary rounded-lg p-0.5 gap-0.5">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize ${period === p ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
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
                  <stop offset="5%" stopColor="hsl(250 84% 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(250 84% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 16%)" />
              <XAxis dataKey="label" tick={{ fill: "hsl(215 14% 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215 14% 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} SOL`, "Spent"]} />
              <Area type="monotone" dataKey="amount" stroke="hsl(250 84% 60%)" strokeWidth={2} fill="url(#spendGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-4">Top Recipients</h2>
        {recLoading ? <Skeleton className="h-40" /> : topRecipients && topRecipients.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topRecipients.map((r) => ({
              name: `${r.address.slice(0, 6)}...${r.address.slice(-4)}`,
              amount: r.totalAmount,
              txns: r.transactionCount,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 16%)" />
              <XAxis dataKey="name" tick={{ fill: "hsl(215 14% 50%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215 14% 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
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
