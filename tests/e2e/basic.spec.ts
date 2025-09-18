// tests/e2e/basic.spec.ts
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Base path needs to be included for local testing if running a static server
  await page.goto("http://localhost:3000/Itsallfunandgames/");
});

test("has title", async ({ page }) => {
  await expect(page).toHaveTitle(/itsallfunandgames/i);
});

test("loads and displays games", async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: "Find Your Next Favourite Game" })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Clear Filter" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Balance & Patience" })
  ).toBeVisible();
});

test("search filters games", async ({ page }) => {
  const search = page.getByPlaceholder("Search");
  await search.fill("patience");
  await expect(
    page.getByRole("link", { name: "Balance & Patience" })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Blind Man’s Buff" })
  ).toHaveCount(0);
});

test("updates the URL only when filters change", async ({ page }) => {
  await expect(page).toHaveURL("http://localhost:3000/Itsallfunandgames/");

  const search = page.getByPlaceholder("Search");
  await search.fill("balance");
  await expect(page).toHaveURL(/\?q=balance/);

  await page.getByRole("button", { name: "Clear Filter" }).click();
  await expect(page).toHaveURL("http://localhost:3000/Itsallfunandgames/");
  await expect(search).toHaveValue("");
});

test("diagnostics page shows construction message", async ({ page }) => {
  await page.goto("http://localhost:3000/Itsallfunandgames/data/quality");
  await expect(
    page.getByRole("heading", { name: "Under Construction" })
  ).toBeVisible();
  await expect(
    page.getByText("We're currently working on our Data Quality Diagnostics page.")
  ).toBeVisible();
});
