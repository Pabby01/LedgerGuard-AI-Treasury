import { useState, useRef, useEffect } from "react";
import { useListAiConversations, useSendAiMessage, useCreateTransaction, getListAiConversationsQueryKey, getListTransactionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useBalance, useWalletSession } from "@solana/react-hooks";
import { useWalletStore } from "@/store/use-wallet-store";
import { useThemeStore } from "@/store/use-theme-store";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import SignWithLedger from "@/components/ledger/SignWithLedger";
import { Send, Bot, User, Zap, CheckCircle, XCircle, ArrowDownToLine, Upload } from "lucide-react";

type MessageTxFlow = {
  txId: number;
  status: "created" | "signed" | "broadcast";
  signature?: string;
};

function TxFlowTimeline({ flow }: { flow: MessageTxFlow }) {
  const isSigned = flow.status === "signed" || flow.status === "broadcast";
  const isBroadcast = flow.status === "broadcast";

  const chipClass = (active: boolean) =>
    `rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
      active
        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
        : "border-border bg-muted/30 text-muted-foreground"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={chipClass(true)}>Created</span>
      <span className="text-muted-foreground">{"->"}</span>
      <span className={chipClass(isSigned)}>Signed</span>
      <span className="text-muted-foreground">{"->"}</span>
      <span className={chipClass(isBroadcast)}>Broadcasted</span>
    </div>
  );
}

const QUICK_PROMPTS = [
  "Transfer 2 SOL to operations wallet",
  "Show treasury health status",
  "Create payroll batch for contributors",
  "Analyze spending this month",
  "Schedule vendor payment for 0.5 SOL",
];

function ActionProposalCard({
  proposal,
  onApprove,
  onDismiss,
  isPending,
  txFlow,
  onDownloadUnsigned,
  onUploadSigned,
  onLedgerComplete,
  fromAddress,
}: {
  proposal: any;
  onApprove: () => void;
  onDismiss: () => void;
  isPending: boolean;
  txFlow?: MessageTxFlow;
  onDownloadUnsigned?: () => void;
  onUploadSigned?: (file: File | null) => void;
  onLedgerComplete?: (signature: string) => void;
  fromAddress?: string;
}) {
  if (!proposal || proposal.action === "analysis") return null;
  const actionColors: Record<string, string> = {
    transfer: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    payroll: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    batch_transfer: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  };
  const uploadInputId = txFlow ? `signed-upload-${txFlow.txId}` : undefined;

  return (
    <div className="mt-3 bg-card border border-primary/30 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" />
        <span className="text-xs font-bold uppercase tracking-wider text-primary">Action Proposal</span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Action</p>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${actionColors[proposal.action] ?? "bg-muted text-muted-foreground border-border"}`}>
            {proposal.action}
          </span>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Amount</p>
          <p className="font-bold">{proposal.amount} {proposal.token}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-muted-foreground mb-0.5">Recipient</p>
          <p className="font-mono text-xs break-all">{proposal.recipient}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-muted-foreground mb-0.5">Reason</p>
          <p className="text-xs">{proposal.reason}</p>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={onApprove} disabled={isPending || !!txFlow} className="gap-1.5 text-xs">
          <CheckCircle className="w-3.5 h-3.5" />
          {isPending ? "Creating..." : txFlow ? "Transaction Created" : "Approve & Create Transaction"}
        </Button>
        <Button size="sm" variant="outline" onClick={onDismiss} disabled={isPending} className="gap-1.5 text-xs">
          <XCircle className="w-3.5 h-3.5" />
          Dismiss
        </Button>
      </div>

      {txFlow && (
        <div className="mt-2 space-y-2 rounded-lg border border-border bg-secondary/20 p-3">
          <p className="text-xs text-muted-foreground">
            Transaction #{txFlow.txId} created. Sign and broadcast directly here.
          </p>
          <TxFlowTimeline flow={txFlow} />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={onDownloadUnsigned} className="gap-1.5 text-xs">
              <ArrowDownToLine className="w-3.5 h-3.5" />
              Download Unsigned Payload
            </Button>
            <input
              id={uploadInputId}
              type="file"
              accept=".txt,.base64,.b64"
              className="hidden"
              onChange={(event) => onUploadSigned?.(event.target.files?.[0] ?? null)}
            />
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => uploadInputId && document.getElementById(uploadInputId)?.click()}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Signed Payload
            </Button>
          </div>
          <SignWithLedger
            txId={txFlow.txId}
            fromAddress={fromAddress || "11111111111111111111111111111111"}
            onComplete={(signature) => onLedgerComplete?.(signature)}
          />
          {txFlow.status === "broadcast" && (
            <p className="text-xs text-emerald-400">
              Broadcast complete {txFlow.signature ? `(${txFlow.signature.slice(0, 14)}...)` : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AiTreasury() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{
    role: "user" | "assistant";
    content: string;
    actionProposal?: any;
    id?: number;
    dismissed?: boolean;
    txFlow?: MessageTxFlow;
  }>>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { address } = useWalletStore();
  const walletSession = useWalletSession();
  const walletBalance = useBalance(walletSession?.account.address);
  const treasuryBalance = walletBalance?.lamports == null ? undefined : Number(walletBalance.lamports) / 1e9;

  const { data: history, isLoading: histLoading } = useListAiConversations({ limit: 5 });
  const sendMsg = useSendAiMessage();
  const createTx = useCreateTransaction();

  useEffect(() => {
    if (history && messages.length === 0) {
      const histMsgs = history.flatMap((c) => [
        { role: "user" as const, content: c.prompt, id: c.id },
        {
          role: "assistant" as const,
          content: c.response,
          actionProposal: c.actionProposal ? (() => { try { return JSON.parse(c.actionProposal!); } catch { return null; } })() : null,
          id: c.id,
        },
      ]);
      setMessages(histMsgs.reverse());
    }
  }, [history]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const prompt = input.trim();
    if (!prompt || sendMsg.isPending) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: prompt }]);

    sendMsg.mutate(
      { data: { prompt, walletAddress: address ?? undefined, treasuryBalance } },
      {
        onSuccess: (res) => {
          let proposal = res.actionProposal;
          if (typeof proposal === "string") {
            try { proposal = JSON.parse(proposal); } catch { proposal = null; }
          }
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: res.response, actionProposal: proposal, id: res.id },
          ]);
          queryClient.invalidateQueries({ queryKey: getListAiConversationsQueryKey() });
        },
        onError: () => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Sorry, the AI service is unavailable. Please try again." },
          ]);
        },
      }
    );
  };

  const handleApprove = (proposal: any, msgIdx: number) => {
    if (!proposal) return;
    createTx.mutate(
      {
        data: {
          amount: proposal.amount,
          recipient: proposal.recipient,
          token: proposal.token,
          memo: proposal.reason,
          network: "devnet",
          fromWalletAddress: address ?? undefined,
          aiProposed: true,
        },
      },
      {
        onSuccess: (txn: any) => {
          queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
          setMessages((prev) =>
            prev.map((message, index) =>
              index === msgIdx
                ? {
                    ...message,
                    txFlow: { txId: txn.id, status: "created" },
                  }
                : message
            )
          );
        },
      }
    );
  };

  const handleDownloadUnsigned = async (txId: number) => {
    const response = await fetch(`/api/transactions/${txId}/payload`);
    if (!response.ok) {
      throw new Error(`Failed to get unsigned payload for transaction ${txId}`);
    }
    const payload = await response.json();
    const payloadBundle = {
      txId,
      unsignedTransaction: payload.unsignedTransaction,
      unsignedTransactionSerialized: payload.unsignedTransactionSerialized,
      requiredSigners: payload.requiredSigners,
      recentBlockhash: payload.recentBlockhash,
      payloadToken: payload.payloadToken,
      payloadExpiresAt: payload.payloadExpiresAt,
    };
    const blob = new Blob([JSON.stringify(payloadBundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transaction-${txId}.unsigned.payload.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleUploadSigned = async (txId: number, file: File | null, msgIdx: number) => {
    if (!file) return;

    setMessages((prev) =>
      prev.map((message, index) =>
        index === msgIdx
          ? {
              ...message,
              txFlow: {
                txId,
                status: "signed",
              },
            }
          : message
      )
    );

    const payloadResponse = await fetch(`/api/transactions/${txId}/payload`);
    if (!payloadResponse.ok) {
      throw new Error(`Failed to get payload token for transaction ${txId}`);
    }
    const payload = await payloadResponse.json();

    const signedTransaction = (await file.text()).trim();
    const broadcastResponse = await fetch(`/api/transactions/${txId}/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signedTransaction, payloadToken: payload.payloadToken }),
    });

    if (!broadcastResponse.ok) {
      const message = await broadcastResponse.text();
      throw new Error(message || `Failed to broadcast transaction ${txId}`);
    }

    const result = await broadcastResponse.json();
    queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
    setMessages((prev) =>
      prev.map((message, index) =>
        index === msgIdx
          ? {
              ...message,
              txFlow: {
                txId,
                status: "broadcast",
                signature: result.signature,
              },
            }
          : message
      )
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4 animate-fade-in-up">
        <h1 className={`text-2xl font-bold tracking-tight ${isDark ? "shimmer-text" : "gradient-text-light"}`}>AI Treasury Assistant</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Chat with your AI treasury advisor. AI proposes, Ledger authorizes.</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
        {histLoading && messages.length === 0 && (
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        )}

        {messages.length === 0 && !histLoading && (
          <div className="flex flex-col items-center justify-center h-64 text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Bot className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold">LedgerGuard AI</p>
              <p className="text-sm text-muted-foreground mt-1">Ask me to prepare treasury actions, analyze spending, or check health.</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {QUICK_PROMPTS.map((p) => (
                <button key={p} onClick={() => setInput(p)} className="text-xs bg-secondary hover:bg-muted border border-border text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg transition-colors">
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 ${msg.role === "user" ? "bg-primary/20" : "bg-card border border-border"}`}>
              {msg.role === "user" ? <User className="w-3.5 h-3.5 text-primary" /> : <Bot className="w-3.5 h-3.5 text-muted-foreground" />}
            </div>
            <div className={`max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
              <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground"}`}>
                {msg.content
                  .replace(/ACTION_PROPOSAL:\s*\{[\s\S]*?\}/m, "")
                  .replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/g, "")
                  .trim()}
              </div>
              {msg.role === "assistant" && msg.actionProposal && !msg.dismissed && (
                <ActionProposalCard
                  proposal={msg.actionProposal}
                  onApprove={() => handleApprove(msg.actionProposal, idx)}
                  onDismiss={() => setMessages((prev) => prev.map((m, i) => i === idx ? { ...m, dismissed: true } : m))}
                  isPending={createTx.isPending}
                  txFlow={msg.txFlow}
                  fromAddress={address ?? undefined}
                  onDownloadUnsigned={() => {
                    if (!msg.txFlow) return;
                    handleDownloadUnsigned(msg.txFlow.txId).catch(() => {
                      setMessages((prev) => [
                        ...prev,
                        { role: "assistant", content: "I could not download the unsigned payload. Please try again." },
                      ]);
                    });
                  }}
                  onUploadSigned={(file) => {
                    if (!msg.txFlow) return;
                    handleUploadSigned(msg.txFlow.txId, file, idx).catch((error) => {
                      setMessages((prev) => [
                        ...prev,
                        { role: "assistant", content: `I could not broadcast that signed payload: ${error.message}` },
                      ]);
                    });
                  }}
                  onLedgerComplete={(signature) => {
                    setMessages((prev) =>
                      prev.map((message, index) =>
                        index === idx
                          ? {
                              ...message,
                              txFlow: message.txFlow
                                ? { ...message.txFlow, status: "broadcast", signature }
                                : undefined,
                            }
                          : message
                      )
                    );
                    queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
                  }}
                />
              )}
              {msg.role === "assistant" && msg.actionProposal && msg.dismissed && !msg.txFlow && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-400" /> Action dismissed</p>
              )}
            </div>
          </div>
        ))}

        {sendMsg.isPending && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="w-3.5 h-3.5 text-muted-foreground animate-pulse" />
            </div>
            <div className="bg-card border border-border rounded-xl px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="bg-card border border-border rounded-xl p-3 flex gap-2 items-end mt-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Ask the AI to prepare a treasury action..."
          className="min-h-[2.5rem] max-h-32 resize-none bg-transparent border-0 focus-visible:ring-0 p-0 text-sm"
        />
        <Button size="sm" onClick={handleSend} disabled={!input.trim() || sendMsg.isPending} className="flex-shrink-0 gap-1.5">
          <Send className="w-3.5 h-3.5" />
          Send
        </Button>
      </div>
    </div>
  );
}
