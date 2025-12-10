"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/toast";
import { chatModels } from "@/lib/ai/models";
import { Loader2Icon, SendIcon } from "lucide-react";

interface ComparisonResult {
  modelId: string;
  modelName: string;
  response: string;
  loading: boolean;
  error?: string;
  duration?: number;
}

export function ModelComparison() {
  const [prompt, setPrompt] = useState("");
  const [selectedModels, setSelectedModels] = useState<string[]>([
    "gemini-2.5-pro",
    "gemini-2.5-flash",
  ]);
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  const toggleModel = (modelId: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : [...prev, modelId]
    );
  };

  const handleCompare = async () => {
    if (!prompt.trim()) {
      toast({ type: "error", description: "Please enter a prompt" });
      return;
    }

    if (selectedModels.length < 2) {
      toast({ type: "error", description: "Select at least 2 models to compare" });
      return;
    }

    setIsComparing(true);
    setResults(
      selectedModels.map((modelId) => ({
        modelId,
        modelName: chatModels.find((m) => m.id === modelId)?.name || modelId,
        response: "",
        loading: true,
      }))
    );

    // Run all model requests in parallel
    const promises = selectedModels.map(async (modelId) => {
      const startTime = Date.now();
      try {
        const response = await fetch("/api/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, modelId }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Request failed");
        }

        const data = await response.json();
        const duration = Date.now() - startTime;

        return {
          modelId,
          modelName: chatModels.find((m) => m.id === modelId)?.name || modelId,
          response: data.response,
          loading: false,
          duration,
        };
      } catch (error) {
        return {
          modelId,
          modelName: chatModels.find((m) => m.id === modelId)?.name || modelId,
          response: "",
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    const completedResults = await Promise.all(promises);
    setResults(completedResults);
    setIsComparing(false);
  };

  return (
    <div className="space-y-6">
      {/* Model Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Models</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {chatModels.map((model) => (
              <div key={model.id} className="flex items-start space-x-3">
                <Checkbox
                  id={model.id}
                  checked={selectedModels.includes(model.id)}
                  onCheckedChange={() => toggleModel(model.id)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor={model.id} className="cursor-pointer font-medium">
                    {model.name.split(" (")[0]}
                  </Label>
                  <p className="text-xs text-muted-foreground">{model.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Prompt Input */}
      <Card>
        <CardHeader>
          <CardTitle>Enter Prompt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter your prompt to compare model responses..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <Button
            onClick={handleCompare}
            disabled={isComparing || selectedModels.length < 2}
            className="w-full"
          >
            {isComparing ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Comparing...
              </>
            ) : (
              <>
                <SendIcon className="mr-2 h-4 w-4" />
                Compare Models ({selectedModels.length} selected)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {results.map((result) => (
            <Card key={result.modelId}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>{result.modelName.split(" (")[0]}</span>
                  {result.duration && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {(result.duration / 1000).toFixed(2)}s
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : result.error ? (
                  <div className="rounded-md bg-destructive/10 p-4 text-destructive">
                    {result.error}
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">{result.response}</pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

