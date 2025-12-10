"use client";

interface UsageSummary {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  byProvider: Record<string, { tokens: number; cost: number }>;
  byModel: Record<string, { tokens: number; cost: number }>;
}

interface DailyUsage {
  date: string;
  tokens: number;
  cost: number;
}

interface UsageDashboardProps {
  summary: UsageSummary;
  dailyUsage: DailyUsage[];
}

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  google: "Google",
  anthropic: "Anthropic",
  xai: "xAI",
};

export function UsageDashboard({ summary, dailyUsage }: UsageDashboardProps) {
  const formatNumber = (n: number) => n.toLocaleString();
  const formatCost = (n: number) => `$${n.toFixed(4)}`;

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Tokens (30 days)</p>
          <p className="mt-2 text-3xl font-bold">
            {formatNumber(summary.totalInputTokens + summary.totalOutputTokens)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatNumber(summary.totalInputTokens)} input /{" "}
            {formatNumber(summary.totalOutputTokens)} output
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Estimated Cost (30 days)</p>
          <p className="mt-2 text-3xl font-bold">{formatCost(summary.totalCost)}</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Active Providers</p>
          <p className="mt-2 text-3xl font-bold">
            {Object.keys(summary.byProvider).length}
          </p>
        </div>
      </div>

      {/* Usage by Provider */}
      <div className="rounded-lg border p-6">
        <h3 className="mb-4 font-semibold">Usage by Provider</h3>
        {Object.keys(summary.byProvider).length === 0 ? (
          <p className="text-muted-foreground">No usage data yet</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(summary.byProvider).map(([provider, data]) => (
              <div key={provider} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {PROVIDER_LABELS[provider] || provider}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatNumber(data.tokens)} tokens
                  </p>
                </div>
                <p className="font-semibold">{formatCost(data.cost)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage by Model */}
      <div className="rounded-lg border p-6">
        <h3 className="mb-4 font-semibold">Usage by Model</h3>
        {Object.keys(summary.byModel).length === 0 ? (
          <p className="text-muted-foreground">No usage data yet</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(summary.byModel)
              .sort((a, b) => b[1].tokens - a[1].tokens)
              .map(([model, data]) => (
                <div key={model} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{model}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatNumber(data.tokens)} tokens
                    </p>
                  </div>
                  <p className="font-semibold">{formatCost(data.cost)}</p>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Daily Usage Chart (Simple) */}
      <div className="rounded-lg border p-6">
        <h3 className="mb-4 font-semibold">Daily Usage (Last 30 Days)</h3>
        {dailyUsage.length === 0 ? (
          <p className="text-muted-foreground">No usage data yet</p>
        ) : (
          <div className="space-y-2">
            {dailyUsage.slice(-7).map((day) => (
              <div key={day.date} className="flex items-center gap-4">
                <span className="w-24 text-sm text-muted-foreground">
                  {new Date(day.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <div className="flex-1">
                  <div
                    className="h-4 rounded bg-primary"
                    style={{
                      width: `${Math.min(100, (day.tokens / Math.max(...dailyUsage.map((d) => d.tokens))) * 100)}%`,
                    }}
                  />
                </div>
                <span className="w-24 text-right text-sm">
                  {formatNumber(day.tokens)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

