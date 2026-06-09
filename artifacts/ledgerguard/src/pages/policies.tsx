import { useState } from "react";
import {
  useListPolicies,
  useCreatePolicy,
  useUpdatePolicy,
  useDeletePolicy,
  getListPoliciesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useThemeStore } from "@/store/use-theme-store";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Shield, AlertTriangle } from "lucide-react";

const POLICY_TYPES = [
  { value: "max_transaction_amount", label: "Max Transaction Amount" },
  { value: "require_approval_above", label: "Require Approval Above" },
  { value: "business_hours", label: "Business Hours (e.g. 9-18)" },
  { value: "allowed_recipients", label: "Allowed Recipients (comma-separated)" },
  { value: "blocked_recipients", label: "Blocked Recipients (comma-separated)" },
];

export default function Policies() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const queryClient = useQueryClient();
  const { data: policies, isLoading } = useListPolicies();
  const createPolicy = useCreatePolicy();
  const updatePolicy = useUpdatePolicy();
  const deletePolicy = useDeletePolicy();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ type: "max_transaction_amount", name: "", value: "", description: "" });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListPoliciesQueryKey() });

  const handleToggle = (id: number, enabled: boolean) => {
    updatePolicy.mutate({ id, data: { enabled } }, { onSuccess: invalidate });
  };

  const handleDelete = (id: number) => {
    deletePolicy.mutate({ id }, { onSuccess: invalidate });
  };

  const handleCreate = () => {
    if (!form.name || !form.value) return;
    createPolicy.mutate(
      { data: { type: form.type, name: form.name, value: form.value, description: form.description, enabled: true } },
      {
        onSuccess: () => {
          invalidate();
          setShowCreate(false);
          setForm({ type: "max_transaction_amount", name: "", value: "", description: "" });
        },
      }
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${isDark ? "shimmer-text" : "gradient-text-light"}`}>Treasury Policies</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Guardrails that every transaction must pass before execution</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> New Policy
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
          : policies?.map((p, i) => (
              <div
                key={p.id}
                className={`border rounded-xl px-5 py-4 flex items-center gap-4 transition-all duration-200 animate-fade-in-up glow-hover ${isDark ? "glass-card" : "bg-white border-border shadow-sm"}`}
                style={{ animationDelay: `${i * 50 + 60}ms` }}
              >
                {p.type.includes("block") || p.type.includes("max") ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                ) : (
                  <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{p.name}</p>
                    {!p.enabled && (
                      <span className="text-xs text-muted-foreground bg-secondary border border-border px-2 py-0.5 rounded">Disabled</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.description ?? POLICY_TYPES.find((t) => t.value === p.type)?.label}
                  </p>
                  <p className="text-xs font-mono text-primary mt-1">Value: {p.value}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Switch checked={p.enabled} onCheckedChange={(v) => handleToggle(p.id, v)} />
                  <button onClick={() => handleDelete(p.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
        {!isLoading && policies?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No policies yet. Add one to protect your treasury.</div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Create Policy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POLICY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                placeholder="e.g. Max Single Transfer"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Value</Label>
              <Input
                placeholder={form.type === "business_hours" ? "e.g. 9-18" : "e.g. 50"}
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                className="bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="bg-background"
              />
            </div>
            <Button
              onClick={handleCreate}
              disabled={createPolicy.isPending || !form.name || !form.value}
              className="w-full"
            >
              {createPolicy.isPending ? "Creating..." : "Create Policy"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
