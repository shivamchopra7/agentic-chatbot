"use client";

import { useState } from "react";
import type { Provider } from "@/lib/api-keys/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/toast";

interface ApiKeyItem {
  id: string;
  provider: Provider;
  label: string;
  isValid: boolean;
  lastValidatedAt: Date | null;
  createdAt: Date;
}

interface ApiKeyManagerProps {
  initialKeys: ApiKeyItem[];
}

const PROVIDERS: { value: Provider; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "google", label: "Google (Gemini)" },
  { value: "anthropic", label: "Anthropic (Claude)" },
  { value: "xai", label: "xAI (Grok)" },
  { value: "custom", label: "Custom Provider" },
];

export function ApiKeyManager({ initialKeys }: ApiKeyManagerProps) {
  const [keys, setKeys] = useState<ApiKeyItem[]>(initialKeys);
  const [isAdding, setIsAdding] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newProvider, setNewProvider] = useState<Provider | "">("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddKey = async () => {
    if (!newKey || !newLabel) {
      toast({ type: "error", description: "Please fill in all fields" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: newKey,
          label: newLabel,
          provider: newProvider || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({ type: "error", description: data.error || "Failed to add key" });
        return;
      }

      setKeys([...keys, data.key]);
      setNewKey("");
      setNewLabel("");
      setNewProvider("");
      setIsAdding(false);
      toast({ type: "success", description: "API key added successfully" });
    } catch (error) {
      toast({ type: "error", description: "Failed to add API key" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;

    try {
      const response = await fetch("/api/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        toast({ type: "error", description: "Failed to delete key" });
        return;
      }

      setKeys(keys.filter((k) => k.id !== id));
      toast({ type: "success", description: "API key deleted" });
    } catch (error) {
      toast({ type: "error", description: "Failed to delete key" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Existing Keys */}
      <div className="space-y-4">
        {keys.map((key) => (
          <div key={key.id} className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                <ProviderIcon provider={key.provider} />
              </div>
              <div>
                <p className="font-medium">{key.label}</p>
                <p className="text-sm text-muted-foreground">
                  {PROVIDERS.find((p) => p.value === key.provider)?.label}
                  {key.isValid ? (
                    <span className="ml-2 text-green-600">● Valid</span>
                  ) : (
                    <span className="ml-2 text-red-600">● Invalid</span>
                  )}
                </p>
              </div>
            </div>
            <Button variant="destructive" size="sm" onClick={() => handleDeleteKey(key.id)}>
              Delete
            </Button>
          </div>
        ))}
      </div>

      {/* Add New Key */}
      {isAdding ? (
        <div className="rounded-lg border p-4">
          <h3 className="mb-4 font-semibold">Add New API Key</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="provider">Provider (optional - auto-detected)</Label>
              <Select value={newProvider} onValueChange={(v) => setNewProvider(v as Provider)}>
                <SelectTrigger><SelectValue placeholder="Auto-detect" /></SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="label">Label</Label>
              <Input id="label" placeholder="e.g., Personal OpenAI Key" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <Input id="apiKey" type="password" placeholder="sk-..." value={newKey} onChange={(e) => setNewKey(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddKey} disabled={isLoading}>{isLoading ? "Validating..." : "Add Key"}</Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      ) : (
        <Button onClick={() => setIsAdding(true)}>+ Add API Key</Button>
      )}
    </div>
  );
}

function ProviderIcon({ provider }: { provider: Provider }) {
  const icons: Record<Provider, string> = {
    openai: "🟢",
    google: "🔵",
    anthropic: "🟠",
    xai: "⚫",
    custom: "⚙️",
  };
  return <span className="text-lg">{icons[provider]}</span>;
}

