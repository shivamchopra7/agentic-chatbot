import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";

const settingsNav = [
  { href: "/settings/keys", label: "API Keys", icon: "🔑" },
  { href: "/settings/prompts", label: "System Prompts", icon: "📝" },
  { href: "/settings/templates", label: "Templates", icon: "📋" },
  { href: "/settings/workspaces", label: "Team Workspaces", icon: "👥" },
  { href: "/settings/knowledge", label: "Knowledge Base", icon: "📚" },
  { href: "/settings/usage", label: "Usage Analytics", icon: "📊" },
];

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id || session.user.type === "guest") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/30">
        <div className="p-6">
          <Link href="/chat" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to Chat
          </Link>
          <h2 className="mt-4 text-lg font-semibold">Settings</h2>
        </div>
        <nav className="px-4">
          {settingsNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

