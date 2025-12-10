Build a complete web application that replicates ChatGPT with the following features, modules, behaviors, and technical requirements.
This platform functions as a multi-model AI chat workspace where users can bring their own API keys, configure system prompts, generate images/PDFs, and collaborate.

1. A landing page and authentication system

Landing Page Requirements
	•	Create a clean, modern landing page with:
	•	A prominent Login / Sign Up button.
	•	Brief explanation of platform purpose.
	•	No chat access without authentication.

Authentication Requirements
	•	Support user login using:
	•	Email & password
	•	Optional OAuth providers (Google, GitHub, etc.)
	•	Securely manage user sessions using:
	•	JWT tokens, or
	•	Session-based authentication.
	•	After login, redirect users to the Dashboard/Chat Workspace.



2. User API Key Management (Bring Your Own LLM Key)

Supported Providers

Allow users to add API keys for:
	•	OpenAI (GPT)
	•	Google Gemini
	•	xAI Grok
	•	Anthropic Claude
	•	Any future custom provider (system must be extensible)

Key Management Features
	•	No default model is provided — platform is unusable until user adds at least one key.
	•	Let users:
	•	Add multiple API keys.
	•	Update, rename, or delete keys.
	•	Label keys by provider.
	•	Automatically detect key provider if possible.
	•	Validate API key with a test request before saving.

Security Requirements
	•	Never store raw API keys.
	•	Encrypt keys in the database using:
	•	AES-256 or equivalent encryption.
	•	Hash for verification if needed.
	•	Decrypt keys only at runtime when making API calls.
	•	Protect encryption keys using environment-level secure variables.



3. Model Selection & Chat Interface

Model Behavior
	•	After keys are added, show a Model Selection Dropdown.
	•	Route conversation requests to the selected model dynamically.
	•	No hardcoded model; the model must fully depend on user-provided API keys.

Chat Interface Features
	•	Modern chat UI similar to ChatGPT, including:
	•	Streaming responses.
	•	Editable user messages.
	•	Message history.
	•	Ability to reply to a specific message (threaded replies).
	•	There are buttons to regenerate a response and to continue the previous response.
	•	Scroll to the latest message.
	•	Chat title auto-generation (optional).

Chat Management
	•	Store chats, messages, and replies in database.
	•	Allow users to:
	•	Create multiple chat sessions.
	•	Rename or delete chats.
	•	Duplicate chats.



4. Custom System Prompt Configuration

System Prompt Requirements
	•	Allow users to:
	•	Create their own system prompt.
	•	Modify prompts dynamically before each conversation.
	•	Save multiple system prompt presets.
	•	Switch presets during a chat session.

Storage Requirements
	•	System prompts can be stored in plaintext but must be user-restricted.
	•	Provide UI for:
	•	Adding new prompts.
	•	Editing existing prompts.
	•	Setting a default prompt.



5. File Generation & Input Tools

a. Image Generation
	•	Allow users to generate images based on:
	•	Text prompts
	•	Model capabilities (DALL·E, Gemini Vision, etc.)
	•	Show images inside chat as bubbles.
	•	Allow download, rename, and regenerate options.

b. PDF Input
	•	Allow users to upload PDFs.
	•	Parse PDF text and feed into the conversation context.
	•	Show file preview & extracted text.
	•	Option to summarize, convert to formats, answer questions from PDF.

c. PDF Output
	•	Enable AI to generate PDFs (reports, summaries, and formatted content).
	•	Provide a UI button to download the generated PDF.



6. Chat-Level Features
	•	Reply to a specific message.
	•	Regenerate a model response.
	•	Insert an image or file into a chat.
	•	Export entire conversation as:
	•	PDF
	•	Markdown
	•	JSON
	•	Export single messages.
	•	Search inside chat history.
	•	Delete or archive chats.



7. Additional High-Value Features (Mandatory Add-ons)

Team Workspaces
	•	Allow multiple users to collaborate.
	•	Shared chat threads.
	•	Shared API keys (admin-controlled).
	•	Role-based permissions:
	•	Admin
	•	Contributor
	•	Viewer

Prompt Templates
	•	Provide predefined templates for:
	•	Coding
	•	Writing
	•	Marketing
	•	Analysis
	•	Allow users to create and save custom templates.

Multi-Model Comparison Mode
	•	Let users select multiple models at once.
	•	Send the same prompt to all selected models.
	•	Display responses side-by-side.

Usage Analytics
	•	Track:
	•	Number of requests
	•	Token usage estimate
	•	Cost estimation per model
	•	Graphical dashboard for analytics over time.

Web Search Integration
	•	Integrate optional real-time web search features for models needing external data.
	•	Allow switching web search on/off per chat.

RAG (Retrieval-Augmented Generation) Support
	•	Allow document uploads (PDF, text, docx).
	•	Generate embeddings (locally or via user’s model key).
	•	Store embeddings per user.
	•	Provide contextual chat based on the uploaded knowledge base.



8. Backend Architecture Requirements

Organize the system into clear modules:

1. Authentication Module
	•	Login
	•	Sign up
	•	Sessions / tokens
	•	Account deletion

2. API Key Module
	•	Add/update/delete keys
	•	Encryption/hashing
	•	Validation engine

3. Provider Integration Layer
	•	Abstracted interface for all AI providers
	•	Standard request format:
	•	model
	•	messages
	•	system prompt
	•	file inputs
	•	generation options

4. Chat Engine
	•	Message handling
	•	Threading
	•	Model routing
	•	System prompt logic
	•	Session history

5. File Engine
	•	Image generation
	•	PDF parsing
	•	PDF exporting
	•	Image/PDF preview handling

6. Database Models
	•	Users
	•	API keys
	•	Chats
	•	Messages
	•	System prompts
	•	Workspaces
	•	Templates
	•	Analytics logs

7. Frontend
	•	Landing page
	•	Dashboard
	•	Chat UI
	•	Settings
	•	Workspace panel
	•	Prompt template manager
	•	Analytics dashboard



9. Error Handling & Stability Requirements
	•	Clear error messages for:
	•	Invalid API keys
	•	Expired keys
	•	Model provider failure
	•	Rate limits
	•	Network timeouts
	•	Automatic retry logic for long responses.
	•	Protect against:
	•	Infinite loops
	•	Duplicate messages
	•	Overlapping requests
	•	UI-level fallback messages when providers fail.



10. Performance & Scalability Expectations
	•	Support vertical and horizontal scaling.
	•	Use WebSockets or SSE for streaming.
	•	Cache recent chats for fast retrieval.
	•	Use job queue for heavy tasks (PDF generation, embeddings).

11. Extensibility Requirements

The system must:
	•	Support easy addition of new model providers.
	•	Allow UI extension without breaking previous workflows.
	•	Support plug-in architecture for:
	•	Tools
	•	Agents
	•	RAG pipelines
	•	Analytics extensions


12. Deliverables Expected

The system should deliver:
	•	Fully functional web app
	•	Clean frontend UI/UX
	•	Secure backend with all defined modules
	•	Database schema and migrations
	•	Provider SDK integrations
	•	Deployment-ready configuration (Docker optional)
	•	Documentation for developers & users
	•	Admin panel (optional but recommended)
