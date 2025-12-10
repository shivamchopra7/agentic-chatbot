"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/toast";
import { Loader2Icon, PlusIcon, BookOpenIcon, TrashIcon, FileTextIcon } from "lucide-react";

interface KnowledgeBase {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

interface Document {
  id: string;
  title: string;
  content: string | null;
  createdAt: string;
}

export function KnowledgeManager({ userId }: { userId: string }) {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKB, setSelectedKB] = useState<KnowledgeBase | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showKBForm, setShowKBForm] = useState(false);
  const [showDocForm, setShowDocForm] = useState(false);
  const [newKBName, setNewKBName] = useState("");
  const [newKBDesc, setNewKBDesc] = useState("");
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocContent, setNewDocContent] = useState("");

  useEffect(() => {
    fetchKnowledgeBases();
  }, []);

  useEffect(() => {
    if (selectedKB) {
      fetchDocuments(selectedKB.id);
    }
  }, [selectedKB]);

  const fetchKnowledgeBases = async () => {
    try {
      const response = await fetch("/api/knowledge");
      if (response.ok) {
        const data = await response.json();
        setKnowledgeBases(data.knowledgeBases);
      }
    } catch {
      toast({ type: "error", description: "Failed to load knowledge bases" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDocuments = async (kbId: string) => {
    try {
      const response = await fetch(`/api/knowledge/${kbId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents);
      }
    } catch {
      toast({ type: "error", description: "Failed to load documents" });
    }
  };

  const handleCreateKB = async () => {
    if (!newKBName.trim()) return;
    setIsCreating(true);
    try {
      const response = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKBName, description: newKBDesc || undefined }),
      });
      if (response.ok) {
        toast({ type: "success", description: "Knowledge base created!" });
        setNewKBName("");
        setNewKBDesc("");
        setShowKBForm(false);
        fetchKnowledgeBases();
      }
    } catch {
      toast({ type: "error", description: "Failed to create knowledge base" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddDocument = async () => {
    if (!selectedKB || !newDocTitle.trim() || !newDocContent.trim()) return;
    setIsCreating(true);
    try {
      const response = await fetch(`/api/knowledge/${selectedKB.id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newDocTitle, content: newDocContent }),
      });
      if (response.ok) {
        toast({ type: "success", description: "Document added!" });
        setNewDocTitle("");
        setNewDocContent("");
        setShowDocForm(false);
        fetchDocuments(selectedKB.id);
      }
    } catch {
      toast({ type: "error", description: "Failed to add document" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteKB = async (id: string) => {
    if (!confirm("Delete this knowledge base and all its documents?")) return;
    try {
      const response = await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast({ type: "success", description: "Knowledge base deleted" });
        if (selectedKB?.id === id) {
          setSelectedKB(null);
          setDocuments([]);
        }
        fetchKnowledgeBases();
      }
    } catch {
      toast({ type: "error", description: "Failed to delete" });
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
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Knowledge Bases List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Knowledge Bases</h2>
          <Button size="sm" onClick={() => setShowKBForm(true)} className="gap-1">
            <PlusIcon className="h-4 w-4" /> New
          </Button>
        </div>

        {showKBForm && (
          <Card>
            <CardContent className="space-y-3 pt-4">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={newKBName} onChange={(e) => setNewKBName(e.target.value)} placeholder="My Knowledge Base" />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Input value={newKBDesc} onChange={(e) => setNewKBDesc(e.target.value)} placeholder="Optional description" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateKB} disabled={isCreating}>
                  {isCreating ? <Loader2Icon className="h-4 w-4 animate-spin" /> : "Create"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowKBForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {knowledgeBases.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">
            <BookOpenIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>No knowledge bases yet.</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-2">
            {knowledgeBases.map((kb) => (
              <Card
                key={kb.id}
                className={`cursor-pointer transition-colors ${selectedKB?.id === kb.id ? "ring-2 ring-primary" : "hover:bg-muted/50"}`}
                onClick={() => setSelectedKB(kb)}
              >
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{kb.name}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteKB(kb.id); }}>
                      <TrashIcon className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  {kb.description && <CardDescription className="text-sm">{kb.description}</CardDescription>}
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Documents {selectedKB && `- ${selectedKB.name}`}</h2>
          {selectedKB && (
            <Button size="sm" onClick={() => setShowDocForm(true)} className="gap-1">
              <PlusIcon className="h-4 w-4" /> Add
            </Button>
          )}
        </div>

        {!selectedKB ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">
            Select a knowledge base to view documents
          </CardContent></Card>
        ) : (
          <>
            {showDocForm && (
              <Card>
                <CardContent className="space-y-3 pt-4">
                  <div className="space-y-1">
                    <Label>Title</Label>
                    <Input value={newDocTitle} onChange={(e) => setNewDocTitle(e.target.value)} placeholder="Document title" />
                  </div>
                  <div className="space-y-1">
                    <Label>Content</Label>
                    <Textarea value={newDocContent} onChange={(e) => setNewDocContent(e.target.value)} placeholder="Paste document content..." rows={4} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddDocument} disabled={isCreating}>
                      {isCreating ? <Loader2Icon className="h-4 w-4 animate-spin" /> : "Add"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowDocForm(false)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {documents.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">
                <FileTextIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>No documents yet. Add some!</p>
              </CardContent></Card>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <Card key={doc.id}>
                    <CardHeader className="py-3">
                      <CardTitle className="text-base">{doc.title}</CardTitle>
                      <CardDescription className="line-clamp-2 text-sm">
                        {doc.content?.substring(0, 150)}...
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

