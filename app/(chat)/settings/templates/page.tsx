import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { getTemplatesByUserId } from "@/lib/db/queries/templates";
import { TemplateManager } from "./template-manager";

export default async function TemplatesPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.type === "guest") {
    redirect("/login");
  }

  const templates = await getTemplatesByUserId(session.user.id);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Prompt Templates</h1>
        <p className="mt-2 text-muted-foreground">
          Create reusable prompt templates for common tasks.
        </p>
      </div>

      <TemplateManager
        initialTemplates={templates.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          content: t.content,
          category: t.category,
          isPublic: t.isPublic ?? false,
          createdAt: t.createdAt ?? new Date(),
        }))}
      />
    </div>
  );
}

