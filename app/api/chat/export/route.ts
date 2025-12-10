import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { getChatById, getMessagesByChatId } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

const exportSchema = z.object({
  chatId: z.string().uuid(),
  format: z.enum(["json", "markdown", "txt"]).default("markdown"),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const body = await request.json();
    const parsed = exportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { chatId, format } = parsed.data;

    // Get the chat
    const chat = await getChatById({ id: chatId });
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Check ownership
    if (chat.userId !== session.user.id) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    // Get messages
    const messages = await getMessagesByChatId({ id: chatId });

    // Format output based on requested format
    let content: string;
    let contentType: string;
    let filename: string;

    const chatTitle = chat.title || "Untitled Chat";
    const exportDate = new Date().toISOString();

    switch (format) {
      case "json":
        content = JSON.stringify(
          {
            title: chatTitle,
            exportedAt: exportDate,
            messages: messages.map((m) => ({
              role: m.role,
              content: m.parts,
              createdAt: m.createdAt,
            })),
          },
          null,
          2
        );
        contentType = "application/json";
        filename = `${chatTitle.replace(/[^a-z0-9]/gi, "_")}.json`;
        break;

      case "txt":
        content = `${chatTitle}\nExported: ${exportDate}\n\n`;
        content += messages
          .map((m) => {
            const role = m.role === "user" ? "You" : "Assistant";
            const parts = Array.isArray(m.parts) ? m.parts : [];
            const text = parts
              .filter((p: { type: string; text?: string }) => p.type === "text")
              .map((p: { type: string; text?: string }) => p.text)
              .join("\n");
            return `[${role}]\n${text}\n`;
          })
          .join("\n---\n\n");
        contentType = "text/plain";
        filename = `${chatTitle.replace(/[^a-z0-9]/gi, "_")}.txt`;
        break;

      case "markdown":
      default:
        content = `# ${chatTitle}\n\n_Exported: ${exportDate}_\n\n---\n\n`;
        content += messages
          .map((m) => {
            const role = m.role === "user" ? "**You**" : "**Assistant**";
            const parts = Array.isArray(m.parts) ? m.parts : [];
            const text = parts
              .filter((p: { type: string; text?: string }) => p.type === "text")
              .map((p: { type: string; text?: string }) => p.text)
              .join("\n");
            return `${role}\n\n${text}`;
          })
          .join("\n\n---\n\n");
        contentType = "text/markdown";
        filename = `${chatTitle.replace(/[^a-z0-9]/gi, "_")}.md`;
        break;
    }

    return new NextResponse(content, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return NextResponse.json(
      { error: "Failed to export chat" },
      { status: 500 }
    );
  }
}

