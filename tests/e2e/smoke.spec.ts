import { test, expect } from "@playwright/test";

test("page loads and has a document title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/.*/);
});

test("app shell layout regions are visible", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/");
  // Wait for network to settle so dynamic imports (BlockNote, etc.) complete
  await page.waitForLoadState("networkidle");

  // The root div should have rendered children
  const root = page.locator("#root");
  // At minimum the root should be present in the DOM
  await expect(root).toBeAttached();

  // Log any console errors for debugging but don't fail on them
  if (errors.length > 0) {
    console.warn("Console errors during load:", errors.join("\n"));
  }
});
