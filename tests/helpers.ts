import fs from "node:fs";
import path from "node:path";
import {
  type APIRequestContext,
  type Browser,
  type BrowserContext,
  expect,
  type Page,
} from "@playwright/test";
import { generateId } from "ai";
import { getUnixTime } from "date-fns";
import { ChatPage } from "./pages/chat";

export type UserContext = {
  context: BrowserContext;
  page: Page;
  request: APIRequestContext;
};

export async function createAuthenticatedContext({
  browser,
  name,
}: {
  browser: Browser;
  name: string;
}): Promise<UserContext> {
  const directory = path.join(__dirname, "../playwright/.sessions");

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  const storageFile = path.join(directory, `${name}.json`);

  const context = await browser.newContext();
  const page = await context.newPage();

  const email = `test-${name}@playwright.com`;
  const password = generateId();

  await page.goto("http://localhost:3000/register");
  await page.getByPlaceholder("user@acme.com").click();
  await page.getByPlaceholder("user@acme.com").fill(email);
  await page.getByLabel("Password").click();
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign Up" }).click();

  await expect(page.getByTestId("toast")).toContainText(
    "Account created successfully!"
  );

  // Wait for redirect to "/" after registration
  await page.waitForURL("/", { timeout: 10000 });

  // Wait for the page to fully load (network idle)
  await page.waitForLoadState("networkidle");

  // Wait a bit for session cookie to be fully propagated
  await page.waitForTimeout(1000);

  // Wait for the session to be established - retry with reloads if needed
  const chatPage = new ChatPage(page);
  let modelSelectorVisible = false;
  let retries = 0;
  const maxRetries = 10;

  while (!modelSelectorVisible && retries < maxRetries) {
    try {
      // Check if model-selector is visible (indicates chat interface)
      await expect(page.getByTestId("model-selector")).toBeVisible({ timeout: 5000 });
      modelSelectorVisible = true;
    } catch {
      // If not visible, session might not be recognized yet - reload and try again
      retries++;
      console.log(`Retry ${retries}/${maxRetries}: model-selector not visible, reloading...`);
      await page.waitForTimeout(1000);
      await page.reload();
      await page.waitForLoadState("networkidle");
    }
  }

  // Final check with longer timeout
  await expect(page.getByTestId("model-selector")).toBeVisible({ timeout: 30000 });
  await chatPage.chooseModelFromSelector("gemini-2.5-flash");
  await expect(chatPage.getSelectedModel()).resolves.toEqual(
    "Gemini 2.5 Flash ($0.30/1M tokens)"
  );

  await page.waitForTimeout(1000);
  await context.storageState({ path: storageFile });
  await page.close();

  const newContext = await browser.newContext({ storageState: storageFile });
  const newPage = await newContext.newPage();

  return {
    context: newContext,
    page: newPage,
    request: newContext.request,
  };
}

export function generateRandomTestUser() {
  const email = `test-${getUnixTime(new Date())}@playwright.com`;
  const password = generateId();

  return {
    email,
    password,
  };
}
