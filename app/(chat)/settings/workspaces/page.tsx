import { auth } from "@/app/(auth)/auth";
import { redirect } from "next/navigation";
import { WorkspaceManager } from "./workspace-manager";

export default async function WorkspacesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Team Workspaces</h1>
        <p className="text-muted-foreground">
          Create and manage team workspaces to collaborate on chats with others.
        </p>
      </div>
      <WorkspaceManager userId={session.user.id || ""} />
    </div>
  );
}

