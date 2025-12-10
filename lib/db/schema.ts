import type { InferSelectModel } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  integer,
  json,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { AppUsage } from "../usage";

// =====================================================
// ENUMS
// =====================================================
export const providerEnum = pgEnum("provider", [
  "openai",
  "google",
  "anthropic",
  "xai",
  "custom",
]);

export const workspaceRoleEnum = pgEnum("workspace_role", [
  "owner",
  "admin",
  "contributor",
  "viewer",
]);

export const templateCategoryEnum = pgEnum("template_category", [
  "coding",
  "writing",
  "marketing",
  "analysis",
  "general",
  "custom",
]);

// =====================================================
// USER
// =====================================================
export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
  name: varchar("name", { length: 128 }),
  image: text("image"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type User = InferSelectModel<typeof user>;

// =====================================================
// API KEYS (Encrypted storage for BYOK)
// =====================================================
export const apiKey = pgTable(
  "ApiKey",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    provider: providerEnum("provider").notNull(),
    label: varchar("label", { length: 128 }).notNull(),
    encryptedKey: text("encryptedKey").notNull(), // AES-256 encrypted
    keyHash: varchar("keyHash", { length: 64 }).notNull(), // For verification
    isValid: boolean("isValid").default(true),
    lastValidatedAt: timestamp("lastValidatedAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("apiKey_userId_idx").on(table.userId),
    providerIdx: index("apiKey_provider_idx").on(table.provider),
  })
);

export type ApiKey = InferSelectModel<typeof apiKey>;

// =====================================================
// WORKSPACES (Team collaboration)
// =====================================================
export const workspace = pgTable("Workspace", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  ownerId: uuid("ownerId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type Workspace = InferSelectModel<typeof workspace>;

export const workspaceMember = pgTable(
  "WorkspaceMember",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    workspaceId: uuid("workspaceId")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: workspaceRoleEnum("role").notNull().default("viewer"),
    joinedAt: timestamp("joinedAt").notNull().defaultNow(),
  },
  (table) => ({
    workspaceUserIdx: index("workspaceMember_workspaceUser_idx").on(
      table.workspaceId,
      table.userId
    ),
  })
);

export type WorkspaceMember = InferSelectModel<typeof workspaceMember>;

// Shared API keys within a workspace
export const workspaceApiKey = pgTable(
  "WorkspaceApiKey",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    workspaceId: uuid("workspaceId")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    apiKeyId: uuid("apiKeyId")
      .notNull()
      .references(() => apiKey.id, { onDelete: "cascade" }),
    sharedBy: uuid("sharedBy")
      .notNull()
      .references(() => user.id),
    sharedAt: timestamp("sharedAt").notNull().defaultNow(),
  },
  (table) => ({
    workspaceIdx: index("workspaceApiKey_workspace_idx").on(table.workspaceId),
  })
);

export type WorkspaceApiKey = InferSelectModel<typeof workspaceApiKey>;

// =====================================================
// SYSTEM PROMPTS
// =====================================================
export const systemPrompt = pgTable(
  "SystemPrompt",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 128 }).notNull(),
    content: text("content").notNull(),
    isDefault: boolean("isDefault").default(false),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("systemPrompt_userId_idx").on(table.userId),
  })
);

export type SystemPrompt = InferSelectModel<typeof systemPrompt>;

// =====================================================
// PROMPT TEMPLATES
// =====================================================
export const promptTemplate = pgTable(
  "PromptTemplate",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("userId").references(() => user.id, { onDelete: "cascade" }), // null = system template
    name: varchar("name", { length: 128 }).notNull(),
    description: text("description"),
    content: text("content").notNull(),
    category: templateCategoryEnum("category").notNull().default("general"),
    isPublic: boolean("isPublic").default(false),
    usageCount: integer("usageCount").default(0),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("promptTemplate_userId_idx").on(table.userId),
    categoryIdx: index("promptTemplate_category_idx").on(table.category),
  })
);

export type PromptTemplate = InferSelectModel<typeof promptTemplate>;

// =====================================================
// CHAT (Enhanced with workspace and system prompt support)
// =====================================================
export const chat = pgTable(
  "Chat",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    workspaceId: uuid("workspaceId").references(() => workspace.id, {
      onDelete: "set null",
    }),
    systemPromptId: uuid("systemPromptId").references(() => systemPrompt.id, {
      onDelete: "set null",
    }),
    visibility: varchar("visibility", { enum: ["public", "private"] })
      .notNull()
      .default("private"),
    lastContext: jsonb("lastContext").$type<AppUsage | null>(),
    isArchived: boolean("isArchived").default(false),
    webSearchEnabled: boolean("webSearchEnabled").default(false),
  },
  (table) => ({
    userIdIdx: index("chat_userId_idx").on(table.userId),
    workspaceIdIdx: index("chat_workspaceId_idx").on(table.workspaceId),
  })
);

export type Chat = InferSelectModel<typeof chat>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const messageDeprecated = pgTable("Message", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  content: json("content").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>;

export const message = pgTable("Message_v2", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  parts: json("parts").notNull(),
  attachments: json("attachments").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const voteDeprecated = pgTable(
  "Vote",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => messageDeprecated.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  }
);

export type VoteDeprecated = InferSelectModel<typeof voteDeprecated>;

export const vote = pgTable(
  "Vote_v2",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  }
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  "Document",
  {
    id: uuid("id").notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    kind: varchar("text", { enum: ["text", "code", "image", "sheet"] })
      .notNull()
      .default("text"),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  }
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  "Suggestion",
  {
    id: uuid("id").notNull().defaultRandom(),
    documentId: uuid("documentId").notNull(),
    documentCreatedAt: timestamp("documentCreatedAt").notNull(),
    originalText: text("originalText").notNull(),
    suggestedText: text("suggestedText").notNull(),
    description: text("description"),
    isResolved: boolean("isResolved").notNull().default(false),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  })
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  "Stream",
  {
    id: uuid("id").notNull().defaultRandom(),
    chatId: uuid("chatId").notNull(),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  })
);

export type Stream = InferSelectModel<typeof stream>;

// =====================================================
// USAGE ANALYTICS
// =====================================================
export const usageLog = pgTable(
  "UsageLog",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    chatId: uuid("chatId").references(() => chat.id, { onDelete: "set null" }),
    provider: providerEnum("provider").notNull(),
    model: varchar("model", { length: 128 }).notNull(),
    inputTokens: integer("inputTokens").notNull().default(0),
    outputTokens: integer("outputTokens").notNull().default(0),
    totalTokens: integer("totalTokens").notNull().default(0),
    estimatedCost: numeric("estimatedCost", { precision: 10, scale: 6 }),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("usageLog_userId_idx").on(table.userId),
    createdAtIdx: index("usageLog_createdAt_idx").on(table.createdAt),
    providerIdx: index("usageLog_provider_idx").on(table.provider),
  })
);

export type UsageLog = InferSelectModel<typeof usageLog>;

// =====================================================
// FILE UPLOADS (for PDF, images, documents)
// =====================================================
export const fileUpload = pgTable(
  "FileUpload",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    chatId: uuid("chatId").references(() => chat.id, { onDelete: "set null" }),
    filename: varchar("filename", { length: 256 }).notNull(),
    mimeType: varchar("mimeType", { length: 128 }).notNull(),
    size: integer("size").notNull(), // bytes
    storageKey: text("storageKey").notNull(), // blob storage reference
    extractedText: text("extractedText"), // parsed content from PDFs
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("fileUpload_userId_idx").on(table.userId),
    chatIdIdx: index("fileUpload_chatId_idx").on(table.chatId),
  })
);

export type FileUpload = InferSelectModel<typeof fileUpload>;

// =====================================================
// GENERATED FILES (PDFs, images created by AI)
// =====================================================
export const generatedFile = pgTable(
  "GeneratedFile",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    chatId: uuid("chatId").references(() => chat.id, { onDelete: "set null" }),
    messageId: uuid("messageId").references(() => message.id, {
      onDelete: "set null",
    }),
    type: varchar("type", { enum: ["image", "pdf", "document"] }).notNull(),
    filename: varchar("filename", { length: 256 }).notNull(),
    storageKey: text("storageKey").notNull(),
    prompt: text("prompt"), // original generation prompt
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("generatedFile_userId_idx").on(table.userId),
    chatIdIdx: index("generatedFile_chatId_idx").on(table.chatId),
  })
);

export type GeneratedFile = InferSelectModel<typeof generatedFile>;

// =====================================================
// RAG KNOWLEDGE BASE
// =====================================================
export const knowledgeBase = pgTable(
  "KnowledgeBase",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspaceId").references(() => workspace.id, {
      onDelete: "cascade",
    }),
    name: varchar("name", { length: 128 }).notNull(),
    description: text("description"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("knowledgeBase_userId_idx").on(table.userId),
    workspaceIdIdx: index("knowledgeBase_workspaceId_idx").on(
      table.workspaceId
    ),
  })
);

export type KnowledgeBase = InferSelectModel<typeof knowledgeBase>;

export const knowledgeDocument = pgTable(
  "KnowledgeDocument",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    knowledgeBaseId: uuid("knowledgeBaseId")
      .notNull()
      .references(() => knowledgeBase.id, { onDelete: "cascade" }),
    fileUploadId: uuid("fileUploadId").references(() => fileUpload.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 256 }).notNull(),
    content: text("content"), // raw text content
    chunkCount: integer("chunkCount").default(0),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => ({
    knowledgeBaseIdIdx: index("knowledgeDocument_knowledgeBaseId_idx").on(
      table.knowledgeBaseId
    ),
  })
);

export type KnowledgeDocument = InferSelectModel<typeof knowledgeDocument>;

// Vector embeddings stored separately (for pgvector or external vector store)
export const documentEmbedding = pgTable(
  "DocumentEmbedding",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    documentId: uuid("documentId")
      .notNull()
      .references(() => knowledgeDocument.id, { onDelete: "cascade" }),
    chunkIndex: integer("chunkIndex").notNull(),
    chunkText: text("chunkText").notNull(),
    embedding: jsonb("embedding").$type<number[]>(), // vector as JSON array (can migrate to pgvector later)
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => ({
    documentIdIdx: index("documentEmbedding_documentId_idx").on(
      table.documentId
    ),
  })
);

export type DocumentEmbedding = InferSelectModel<typeof documentEmbedding>;

// =====================================================
// CHAT EXPORTS
// =====================================================
export const chatExport = pgTable("ChatExport", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id, { onDelete: "cascade" }),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  format: varchar("format", { enum: ["pdf", "markdown", "json"] }).notNull(),
  storageKey: text("storageKey").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type ChatExport = InferSelectModel<typeof chatExport>;
