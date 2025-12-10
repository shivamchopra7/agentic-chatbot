"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/toast";
import { Loader2Icon, PlusIcon, UsersIcon, TrashIcon } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  role: "owner" | "admin" | "contributor" | "viewer";
  createdAt: string;
}

export function WorkspaceManager({ userId }: { userId: string }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch("/api/workspaces");
      if (response.ok) {
        const data = await response.json();
        setWorkspaces(data.workspaces);
      }
    } catch {
      toast({ type: "error", description: "Failed to load workspaces" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast({ type: "error", description: "Name is required" });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          description: newDescription || undefined,
        }),
      });

      if (response.ok) {
        toast({ type: "success", description: "Workspace created!" });
        setNewName("");
        setNewDescription("");
        setShowForm(false);
        fetchWorkspaces();
      } else {
        toast({ type: "error", description: "Failed to create workspace" });
      }
    } catch {
      toast({ type: "error", description: "Failed to create workspace" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workspace?")) return;

    try {
      const response = await fetch(`/api/workspaces/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({ type: "success", description: "Workspace deleted" });
        fetchWorkspaces();
      } else {
        const data = await response.json();
        toast({ type: "error", description: data.error || "Failed to delete" });
      }
    } catch {
      toast({ type: "error", description: "Failed to delete workspace" });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "admin": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "contributor": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create New Workspace */}
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <PlusIcon className="h-4 w-4" />
          Create Workspace
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>New Workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="My Team Workspace"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="A workspace for team collaboration..."
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? <Loader2Icon className="h-4 w-4 animate-spin" /> : "Create"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workspaces List */}
      {workspaces.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <UsersIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>No workspaces yet. Create one to start collaborating!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {workspaces.map((workspace) => (
            <Card key={workspace.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{workspace.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${getRoleBadgeColor(workspace.role)}`}>
                      {workspace.role}
                    </span>
                    {workspace.role === "owner" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(workspace.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                {workspace.description && (
                  <CardDescription>{workspace.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Created {new Date(workspace.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

