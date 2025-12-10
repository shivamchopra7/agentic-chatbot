import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { ModelComparison } from "./model-comparison";

export default async function ComparePage() {
  const session = await auth();

  if (!session?.user?.id || session.user.type === "guest") {
    redirect("/login");
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Model Comparison</h1>
        <p className="mt-2 text-muted-foreground">
          Compare responses from different AI models side-by-side.
        </p>
      </div>

      <ModelComparison />
    </div>
  );
}

