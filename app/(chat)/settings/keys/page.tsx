import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { getApiKeysByUserId } from "@/lib/db/queries/api-keys";
import { ApiKeyManager } from "./api-key-manager";

export default async function ApiKeysPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.type === "guest") {
    redirect("/login");
  }

  const apiKeys = await getApiKeysByUserId(session.user.id);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">API Keys</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your AI provider API keys. Your keys are encrypted and stored
          securely.
        </p>
      </div>

      {apiKeys.length === 0 && (
        <div className="mb-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
            No API Keys Configured
          </h3>
          <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
            You need to add at least one API key to start using the chat. Add a
            key from OpenAI, Google, Anthropic, or xAI below.
          </p>
        </div>
      )}

      <ApiKeyManager
        initialKeys={apiKeys.map((k) => ({
          id: k.id,
          provider: k.provider,
          label: k.label,
          isValid: k.isValid ?? true,
          lastValidatedAt: k.lastValidatedAt,
          createdAt: k.createdAt ?? new Date(),
        }))}
      />
    </div>
  );
}

