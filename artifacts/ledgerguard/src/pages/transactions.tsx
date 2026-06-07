import { useState } from "react";
import {
  useListTransactions,
  useGetTransactionRisk,
  useUpdateTransaction,
  getListTransactionsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useThemeStore } from "@/store/use-theme-store";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, CheckCircle, XCircle, RefreshCw, Bot } from "lucide-react";

type Tx = {
  id: number; signature?: string | null; amount: number; recipient: string;
  token: string; status: string; riskScore?: number | null; riskLevel?: string | null;
  network: string; fromWalletAddress?: string | null; aiProposed: boolean;
  memo?: string | null; createdAt: string; updatedAt: string;
};

function RiskBadge({ score, level }: { score?: number | null; level?: string | null }) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  if (score == null) return <span className="text-xs text-muted-foreground">—</span>;
  const l = level ?? (score >= 80 ? "CRITICAL" : score >= 60 ? "HIGH" : score >= 35 ? "MEDIUM" : "LOW");
  const dark: Record<string, string> = {
    LOW: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    MEDIUM: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    HIGH: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    CRITICAL: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  const light: Record<string, string> = {
    LOW: "bg-emerald-50 text-emerald-700 border-emerald-200",
    MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
    HIGH: "bg-orange-50 text-orange-700 border-orange-200",
    CRITICAL: "bg-red-50 text-red-700 border-red-200",
  };
  const colors = isDark ? dark : light;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${colors[l] ?? colors.LOW}`}>
      {score} {l}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const dark: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    approved: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    confirmed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    broadcast: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    failed: "bg-red-500/15 text-red-400 border-red-500/30",
    rejected: "bg-red-500/15 text-red-400 border-red-500/30",
    signed: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  };
  const light: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-blue-50 text-blue-700 border-blue-200",
    confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    broadcast: "bg-indigo-50 text-indigo-700 border-indigo-200",
    failed: "bg-red-50 text-red-700 border-red-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
    signed: "bg-purple-50 text-purple-700 border-purple-200",
  };
  const map = isDark ? dark : light;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${map[status] ?? "bg-muted text-muted-foreground border-border"}`}>
      {status}
    </span>
  );
}

function TxDetailModal({ tx, open, onClose }: { tx: Tx | null; open: boolean; onClose: () => void }) {
  const { data: risk } = useGetTransactionRisk(tx?.id ?? 0, { query: { enabled: !!tx && open } });
  const updateTx = useUpdateTransaction();
  const queryClient = useQueryClient();

  if (!tx) return null;

  const handleApprove = () => {
    updateTx.mutate(
      { id: tx.id, data: { status: "approved" } },
      { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() }); onClose(); } }
    );
  };
  const handleReject = () => {
    updateTx.mutate(
      { id: tx.id, data: { status: "rejected" } },
      { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() }); onClose(); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            Transaction #{tx.id}
            {tx.aiProposed && (
              <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                <Bot className="w-3 h-3" /> AI Proposed
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <StatusBadge status={tx.status} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Network</p>
              <p className="font-mono text-xs">{tx.network}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Amount</p>
              <p className="font-bold">{tx.amount} {tx.token}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Risk</p>
              <RiskBadge score={tx.riskScore} level={tx.riskLevel} />
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground mb-1">Recipient</p>
              <p className="font-mono text-xs break-all">{tx.recipient}</p>
            </div>
            {tx.fromWalletAddress && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-1">From</p>
                <p className="font-mono text-xs break-all">{tx.fromWalletAddress}</p>
              </div>
            )}
            {tx.signature && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Signature</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-xs break-all">{tx.signature.slice(0, 20)}...</p>
                  <a href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`} target="_blank" rel="noreferrer">
                    <ExternalLink className="w-3.5 h-3.5 text-primary" />
                  </a>
                </div>
              </div>
            )}
            {tx.memo && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Memo</p>
                <p>{tx.memo}</p>
              </div>
            )}
          </div>

          {risk && (
            <div className="bg-secondary/50 rounded-lg p-3 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Risk Analysis</p>
              <div className="space-y-1">
                {risk.reasons.map((r, i) => (
                  <p key={i} className="text-xs flex items-start gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${risk.level === "LOW" ? "bg-emerald-400" : risk.level === "MEDIUM" ? "bg-amber-400" : "bg-red-400"}`} />
                    {r}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground">Created: {new Date(tx.createdAt).toLocaleString()}</div>

          {tx.status === "pending" && (
            <div className="flex gap-2 pt-2 border-t border-border">
              <Button size="sm" onClick={handleApprove} disabled={updateTx.isPending} className="gap-1.5 flex-1">
                <CheckCircle className="w-3.5 h-3.5" /> Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={handleReject} disabled={updateTx.isPending} className="gap-1.5 flex-1">
                <XCircle className="w-3.5 h-3.5" /> Reject
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Transactions() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const [selected, setSelected] = useState<Tx | null>(null);
  const { data: txns, isLoading, refetch, isFetching } = useListTransactions({ limit: 50 });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${isDark ? "shimmer-text" : "text-foreground"}`}>Transactions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">All treasury transactions across connected wallets</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className={`border rounded-xl overflow-hidden animate-fade-in-up ${isDark ? "glass-card" : "bg-white border-border shadow-sm"}`} style={{ animationDelay: "60ms" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b border-border ${isDark ? "bg-white/5" : "bg-secondary/40"}`}>
                {["ID", "Recipient", "Amount", "Status", "Risk", "Network", "Date"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-5 py-3"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                : txns?.map((tx) => (
                    <tr key={tx.id} onClick={() => setSelected(tx as Tx)} className={`cursor-pointer transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-secondary/50"}`}>
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                        #{tx.id}
                        {tx.aiProposed && <Bot className="w-3 h-3 text-primary inline ml-1" />}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs">{tx.recipient.slice(0, 6)}...{tx.recipient.slice(-4)}</td>
                      <td className="px-5 py-3 font-semibold">{tx.amount} {tx.token}</td>
                      <td className="px-5 py-3"><StatusBadge status={tx.status} /></td>
                      <td className="px-5 py-3"><RiskBadge score={tx.riskScore} level={tx.riskLevel} /></td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{tx.network}</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {!isLoading && txns?.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">No transactions yet</div>
        )}
      </div>

      <TxDetailModal tx={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
}
