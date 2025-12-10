"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/toast";

type TemplateCategory = "coding" | "writing" | "marketing" | "analysis" | "general" | "custom";

interface TemplateItem {
  id: string;
  name: string;
  description: string | null;
  content: string;
  category: TemplateCategory;
  isPublic: boolean;
  createdAt: Date;
}

interface TemplateManagerProps {
  initialTemplates: TemplateItem[];
}

const CATEGORIES: { value: TemplateCategory; label: string; icon: string }[] = [
  { value: "coding", label: "Coding", icon: "💻" },
  { value: "writing", label: "Writing", icon: "✍️" },
  { value: "analysis", label: "Analysis", icon: "📊" },
  { value: "marketing", label: "Marketing", icon: "📣" },
  { value: "general", label: "General", icon: "📝" },
  { value: "custom", label: "Custom", icon: "⚙️" },
];

export function TemplateManager({ initialTemplates }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<TemplateItem[]>(initialTemplates);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<TemplateCategory>("general");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddTemplate = async () => {
    if (!newName || !newContent) {
      toast({ type: "error", description: "Please fill in required fields" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          description: newDescription || undefined,
          content: newContent,
          category: newCategory,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({ type: "error", description: data.error || "Failed to create template" });
        return;
      }

      setTemplates([...templates, data.template]);
      setNewName("");
      setNewDescription("");
      setNewContent("");
      setNewCategory("general");
      setIsAdding(false);
      toast({ type: "success", description: "Template created" });
    } catch (error) {
      toast({ type: "error", description: "Failed to create template" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const response = await fetch("/api/templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        toast({ type: "error", description: "Failed to delete template" });
        return;
      }

      setTemplates(templates.filter((t) => t.id !== id));
      toast({ type: "success", description: "Template deleted" });
    } catch (error) {
      toast({ type: "error", description: "Failed to delete template" });
    }
  };

  const groupedTemplates = CATEGORIES.map((cat) => ({
    ...cat,
    templates: templates.filter((t) => t.category === cat.value),
  })).filter((cat) => cat.templates.length > 0);

  return (
    <div className="space-y-6">
      {/* Grouped Templates */}
      {groupedTemplates.map((group) => (
        <div key={group.value} className="space-y-4">
          <h3 className="flex items-center gap-2 font-semibold">
            <span>{group.icon}</span>
            <span>{group.label}</span>
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {group.templates.map((template) => (
              <div key={template.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{template.name}</h4>
                    {template.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(template.id)}>
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {templates.length === 0 && !isAdding && (
        <p className="text-center text-muted-foreground">No templates yet. Create your first one!</p>
      )}

      {/* Add New Template */}
      {isAdding ? (
        <div className="rounded-lg border p-4">
          <h3 className="mb-4 font-semibold">Create New Template</h3>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input id="name" placeholder="e.g., Code Review" value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={newCategory} onValueChange={(v) => setNewCategory(v as TemplateCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" placeholder="Brief description..." value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="content">Template Content *</Label>
              <Textarea id="content" placeholder="Use {{variable}} for dynamic values..." rows={6} value={newContent} onChange={(e) => setNewContent(e.target.value)} />
              <p className="mt-1 text-xs text-muted-foreground">Use {"{{variable}}"} syntax for dynamic values</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddTemplate} disabled={isLoading}>{isLoading ? "Creating..." : "Create Template"}</Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      ) : (
        <Button onClick={() => setIsAdding(true)}>+ Create Template</Button>
      )}
    </div>
  );
}

