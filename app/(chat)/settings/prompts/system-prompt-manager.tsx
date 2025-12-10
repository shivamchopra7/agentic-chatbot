"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/toast";

interface SystemPromptItem {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
  createdAt: Date;
}

interface SystemPromptManagerProps {
  initialPrompts: SystemPromptItem[];
}

export function SystemPromptManager({ initialPrompts }: SystemPromptManagerProps) {
  const [prompts, setPrompts] = useState<SystemPromptItem[]>(initialPrompts);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddPrompt = async () => {
    if (!newName || !newContent) {
      toast({ type: "error", description: "Please fill in all fields" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, content: newContent }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({ type: "error", description: data.error || "Failed to add prompt" });
        return;
      }

      setPrompts([...prompts, data.prompt]);
      setNewName("");
      setNewContent("");
      setIsAdding(false);
      toast({ type: "success", description: "System prompt created" });
    } catch (error) {
      toast({ type: "error", description: "Failed to create prompt" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch("/api/prompts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isDefault: true }),
      });

      if (!response.ok) {
        toast({ type: "error", description: "Failed to set default" });
        return;
      }

      setPrompts(prompts.map((p) => ({ ...p, isDefault: p.id === id })));
      toast({ type: "success", description: "Default prompt updated" });
    } catch (error) {
      toast({ type: "error", description: "Failed to set default" });
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (!confirm("Are you sure you want to delete this prompt?")) return;

    try {
      const response = await fetch("/api/prompts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        toast({ type: "error", description: "Failed to delete prompt" });
        return;
      }

      setPrompts(prompts.filter((p) => p.id !== id));
      toast({ type: "success", description: "Prompt deleted" });
    } catch (error) {
      toast({ type: "error", description: "Failed to delete prompt" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Existing Prompts */}
      <div className="space-y-4">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{prompt.name}</h3>
                  {prompt.isDefault && (
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      Default
                    </span>
                  )}
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                  {prompt.content}
                </p>
              </div>
              <div className="flex gap-2">
                {!prompt.isDefault && (
                  <Button variant="outline" size="sm" onClick={() => handleSetDefault(prompt.id)}>
                    Set Default
                  </Button>
                )}
                <Button variant="destructive" size="sm" onClick={() => handleDeletePrompt(prompt.id)}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Prompt */}
      {isAdding ? (
        <div className="rounded-lg border p-4">
          <h3 className="mb-4 font-semibold">Create New System Prompt</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="e.g., Coding Assistant" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="content">System Prompt</Label>
              <Textarea id="content" placeholder="You are a helpful coding assistant..." rows={6} value={newContent} onChange={(e) => setNewContent(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddPrompt} disabled={isLoading}>{isLoading ? "Creating..." : "Create Prompt"}</Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      ) : (
        <Button onClick={() => setIsAdding(true)}>+ Create System Prompt</Button>
      )}
    </div>
  );
}

