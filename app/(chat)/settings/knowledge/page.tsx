import { auth } from "@/app/(auth)/auth";
import { redirect } from "next/navigation";
import { KnowledgeManager } from "./knowledge-manager";

export default async function KnowledgePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Knowledge Base</h1>
        <p className="text-muted-foreground">
          Create and manage knowledge bases for RAG-powered conversations.
          Add documents to provide context for AI responses.
        </p>
      </div>
      <KnowledgeManager userId={session.user.id || ""} />
    </div>
  );
}

