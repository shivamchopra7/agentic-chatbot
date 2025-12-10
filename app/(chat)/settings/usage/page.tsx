import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { getUsageSummary, getDailyUsage } from "@/lib/db/queries/usage";
import { UsageDashboard } from "./usage-dashboard";

export default async function UsagePage() {
  const session = await auth();

  if (!session?.user?.id || session.user.type === "guest") {
    redirect("/login");
  }

  const [summary, daily] = await Promise.all([
    getUsageSummary(session.user.id),
    getDailyUsage(session.user.id, 30),
  ]);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Usage Analytics</h1>
        <p className="mt-2 text-muted-foreground">
          Track your token usage and estimated costs across all providers.
        </p>
      </div>

      <UsageDashboard summary={summary} dailyUsage={daily} />
    </div>
  );
}

