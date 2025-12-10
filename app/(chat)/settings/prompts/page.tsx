import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { getSystemPromptsByUserId } from "@/lib/db/queries/system-prompts";
import { SystemPromptManager } from "./system-prompt-manager";

export default async function SystemPromptsPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.type === "guest") {
    redirect("/login");
  }

  const prompts = await getSystemPromptsByUserId(session.user.id);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">System Prompts</h1>
        <p className="mt-2 text-muted-foreground">
          Create and manage custom system prompts to customize AI behavior.
        </p>
      </div>

      <SystemPromptManager
        initialPrompts={prompts.map((p) => ({
          id: p.id,
          name: p.name,
          content: p.content,
          isDefault: p.isDefault ?? false,
          createdAt: p.createdAt ?? new Date(),
        }))}
      />
    </div>
  );
}

