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
import SignWithLedger from "@/components/ledger/SignWithLedger";
import { ExternalLink, CheckCircle, XCircle, RefreshCw, Bot, ArrowDownToLine, Upload, ShieldCheck, ScanLine } from "lucide-react";

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
  const { data: risk } = useGetTransactionRisk(tx?.id ?? 0);
  const updateTx = useUpdateTransaction() as any;
  const queryClient = useQueryClient();
  const [, setPayloadToken] = useState<string | null>(null);

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

  const downloadUnsignedPayload = async () => {
    try {
      const resp = await fetch(`/api/transactions/${tx.id}/payload`);
      if (!resp.ok) throw new Error(`Failed to get payload: ${resp.statusText}`);
      const data = await resp.json();
      setPayloadToken(data.payloadToken ?? null);
      const blob = new Blob([data.unsignedTransaction], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transaction-${tx.id}.unsigned.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to download unsigned payload. See console for details.");
    }
  };

  const uploadSignedFile = async (file: File | null) => {
    if (!file) return;
    try {
      const payloadResp = await fetch(`/api/transactions/${tx.id}/payload`);
      if (!payloadResp.ok) throw new Error(`Failed to get payload: ${payloadResp.statusText}`);
      const payload = await payloadResp.json();
      setPayloadToken(payload.payloadToken ?? null);

      const text = await file.text();
      const resp = await fetch(`/api/transactions/${tx.id}/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedTransaction: text.trim(), payloadToken: payload.payloadToken }),
      });
      if (!resp.ok) {
        const body = await resp.text();
        throw new Error(body || resp.statusText);
      }
      const json = await resp.json();
      alert(`Broadcast success: ${json.signature}`);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to upload signed transaction. See console for details.");
    }
  };


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl overflow-hidden border-border p-0 glass-card bg-background/95">
        <DialogHeader>
          <div className="relative border-b border-border bg-gradient-to-br from-primary/10 via-transparent to-transparent px-5 py-5 sm:px-6">
            <div className="absolute inset-0 opacity-60 pointer-events-none" aria-hidden>
              <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute left-1/3 top-8 h-24 w-24 rounded-full bg-cyan-400/10 blur-3xl" />
            </div>
            <DialogTitle className="relative flex items-center gap-2 text-lg font-semibold">
              Transaction #{tx.id}
              {tx.aiProposed && (
                <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                  <Bot className="w-3 h-3" /> AI Proposed
                </span>
              )}
            </DialogTitle>
            <p className="relative mt-1 text-sm text-muted-foreground">
              Review the transaction, sign it with Ledger, then broadcast the final payload.
            </p>
          </div>
        </DialogHeader>
        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr] text-sm">
          <div className="space-y-4 p-5 sm:p-6 lg:border-r lg:border-border">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-background/80 backdrop-blur-sm p-3 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Status</p>
                <div className="mt-2"><StatusBadge status={tx.status} /></div>
              </div>
              <div className="rounded-xl border border-border bg-background/80 backdrop-blur-sm p-3 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Risk</p>
                <div className="mt-2"><RiskBadge score={tx.riskScore} level={tx.riskLevel} /></div>
              </div>
              <div className="rounded-xl border border-border bg-background/80 backdrop-blur-sm p-3 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Network</p>
                <p className="mt-2 font-mono text-xs">{tx.network}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/80 backdrop-blur-sm p-3 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Amount</p>
                <p className="mt-2 font-bold">{tx.amount} {tx.token}</p>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Recipient</p>
                <p className="mt-1 font-mono text-xs break-all leading-5">{tx.recipient}</p>
              </div>
              {tx.fromWalletAddress && (
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">From</p>
                  <p className="mt-1 font-mono text-xs break-all leading-5">{tx.fromWalletAddress}</p>
                </div>
              )}
              {tx.signature && (
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Signature</p>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="font-mono text-xs break-all leading-5">{tx.signature.slice(0, 20)}...</p>
                    <a href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`} target="_blank" rel="noreferrer" className="shrink-0 rounded-full border border-border p-1.5 hover:bg-secondary transition-colors">
                      <ExternalLink className="w-3.5 h-3.5 text-primary" />
                    </a>
                  </div>
                </div>
              )}
              {tx.memo && (
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Memo</p>
                  <p className="mt-1 text-sm leading-6 text-foreground/90">{tx.memo}</p>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ScanLine className="w-3.5 h-3.5" />
                Created {new Date(tx.createdAt).toLocaleString()}
              </div>
            </div>

            {risk && (
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Risk Analysis</p>
                <div className="space-y-2">
                  {(((risk as any)?.reasons ?? []) as string[]).map((reason: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 rounded-lg border border-border/70 bg-background/70 px-3 py-2">
                      <span className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${((risk as any)?.level ?? "LOW") === "LOW" ? "bg-emerald-400" : ((risk as any)?.level ?? "LOW") === "MEDIUM" ? "bg-amber-400" : "bg-red-400"}`} />
                      <p className="text-xs leading-5 text-foreground/85">{reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 bg-gradient-to-b from-secondary/20 to-transparent p-5 sm:p-6">
            <div className="rounded-2xl border border-border bg-background/90 p-4 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Signing Workflow
              </div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Choose a signing route, then broadcast the signed payload. The Ledger path is optimized for WebHID and Speculos.
              </p>

              {tx.status === "pending" && (
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button size="sm" onClick={handleApprove} disabled={updateTx.isPending} className="gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleReject} disabled={updateTx.isPending} className="gap-1.5">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </Button>
                </div>
              )}

              {(tx.status === "approved" || tx.status === "pending") && (
                <div className="mt-4 space-y-3">
                  <Button size="sm" onClick={downloadUnsignedPayload} variant="outline" className="w-full justify-start gap-2 border-dashed">
                    <ArrowDownToLine className="w-3.5 h-3.5" /> Download unsigned payload
                  </Button>

                  <label className="block cursor-pointer">
                    <input type="file" accept=".txt,.base64,.b64" className="sr-only" onChange={(e) => uploadSignedFile(e.target.files?.[0] ?? null)} />
                    <div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-secondary/20 px-4 py-3 transition-colors hover:bg-secondary/40">
                      <Upload className="w-4 h-4 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">Upload signed transaction</p>
                        <p className="text-xs text-muted-foreground">Drop the signed base64 file here or click to browse.</p>
                      </div>
                    </div>
                  </label>

                  <div className="rounded-xl border border-border bg-secondary/20 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Bot className="w-4 h-4 text-primary" /> Ledger sign in browser
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Use your Ledger device or the Speculos emulator to sign directly in the browser, then broadcast in one step.
                    </p>
                    <div className="mt-3">
                      <SignWithLedger txId={tx.id} fromAddress={tx.fromWalletAddress ?? tx.network} onComplete={() => { queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() }); onClose(); }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-background/90 p-4 shadow-sm backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Broadcast Tip</p>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                Download the unsigned payload, sign it with Ledger DMK, Wallet CLI, or Speculos, then upload the signed transaction here to finalize the broadcast.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Transactions() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const [selected, setSelected] = useState<Tx | null>(null);
  const { data: txns, isLoading, refetch, isFetching } = useListTransactions() as any;
  const txList = (txns ?? []) as Tx[];
  const pendingCount = txList.filter((tx) => tx.status === "pending").length;
  const approvedCount = txList.filter((tx) => tx.status === "approved").length;
  const highRiskCount = txList.filter((tx) => (tx.riskScore ?? 0) >= 60).length;

  return (
    <div className="space-y-5">
      <section className={`relative overflow-hidden rounded-3xl border animate-fade-in-up ${isDark ? "glass-card" : "bg-white border-border shadow-sm"}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-cyan-500/5 pointer-events-none" />
        <div className="relative flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <ShieldCheck className="w-3.5 h-3.5" /> Treasury workflow
            </div>
            <h1 className={`mt-3 text-2xl font-bold tracking-tight sm:text-3xl ${isDark ? "shimmer-text" : "gradient-text-light"}`}>Transactions</h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Review approvals, sign with Ledger, and broadcast from a single command center.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:min-w-[380px]">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-border bg-background/80 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Pending</p>
                <p className="mt-1 text-2xl font-bold">{pendingCount}</p>
              </div>
              <div className="rounded-2xl border border-border bg-background/80 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Approved</p>
                <p className="mt-1 text-2xl font-bold">{approvedCount}</p>
              </div>
              <div className="rounded-2xl border border-border bg-background/80 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">High risk</p>
                <p className="mt-1 text-2xl font-bold">{highRiskCount}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-1.5 self-end rounded-full border-dashed">
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh feed
            </Button>
          </div>
        </div>
      </section>

      <div className={`border rounded-3xl overflow-hidden animate-fade-in-up ${isDark ? "glass-card" : "bg-white border-border shadow-sm"}`} style={{ animationDelay: "60ms" }}>
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
                : ((txns ?? []) as Tx[]).map((tx: Tx) => (
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
