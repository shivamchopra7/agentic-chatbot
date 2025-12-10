import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { Button } from "@/components/ui/button";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { isTestEnvironment } from "@/lib/constants";
import { getApiKeysByUserId } from "@/lib/db/queries/api-keys";
import { generateUUID } from "@/lib/utils";
import { auth } from "../(auth)/auth";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-dvh" />}>
      <NewChatPage />
    </Suspense>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="mb-4 text-4xl">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">AI Chat Platform</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto flex flex-col items-center justify-center gap-8 px-4 py-24 text-center md:py-32">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Your AI Chat Workspace
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
              Bring your own API keys. Chat with GPT-4, Claude, Gemini, and
              more. Collaborate with your team. All in one secure platform.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="min-w-[200px]">
                Get Started Free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="min-w-[200px]">
                Sign In
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t bg-muted/50 py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">
              Why Choose Our Platform?
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                description="Use your own API keys from OpenAI, Google, Anthropic, xAI, and more. No markup on API costs."
                icon="🔑"
                title="Bring Your Own Keys"
              />
              <FeatureCard
                description="Switch between GPT-4, Claude, Gemini, and Grok seamlessly. Compare responses side-by-side."
                icon="🤖"
                title="Multi-Model Support"
              />
              <FeatureCard
                description="Share chats and API keys with your team. Role-based permissions for secure access."
                icon="👥"
                title="Team Collaboration"
              />
              <FeatureCard
                description="Create and save custom system prompts. Use templates for coding, writing, and more."
                icon="📝"
                title="Custom System Prompts"
              />
              <FeatureCard
                description="Upload PDFs, generate images, export conversations. Full file handling capabilities."
                icon="📁"
                title="File Support"
              />
              <FeatureCard
                description="Track token usage and costs across all providers. Detailed analytics dashboard."
                icon="📊"
                title="Usage Analytics"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t bg-primary py-16 text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold">Ready to Get Started?</h2>
            <p className="mb-8 text-primary-foreground/80">
              Create your free account and start chatting in seconds.
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary">
                Create Free Account
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground md:flex-row">
          <p>© 2024 AI Chat Platform. All rights reserved.</p>
          <nav className="flex gap-4">
            <Link className="hover:underline" href="/privacy">
              Privacy Policy
            </Link>
            <Link className="hover:underline" href="/terms">
              Terms of Service
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

async function NewChatPage() {
  const session = await auth();

  // Show landing page only if not authenticated at all
  // Guest users can still use the chat interface
  if (!session) {
    return <LandingPage />;
  }

  // Check if user has any API keys configured (skip in test environment)
  if (!isTestEnvironment) {
    const apiKeys = await getApiKeysByUserId(session.user.id);
    if (apiKeys.length === 0) {
      // Redirect to settings to add API keys
      redirect("/settings/keys");
    }
  }

  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get("chat-model");

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          autoResume={false}
          id={id}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialMessages={[]}
          initialVisibilityType="private"
          isReadonly={false}
          key={id}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        autoResume={false}
        id={id}
        initialChatModel={modelIdFromCookie.value}
        initialMessages={[]}
        initialVisibilityType="private"
        isReadonly={false}
        key={id}
      />
      <DataStreamHandler />
    </>
  );
}
