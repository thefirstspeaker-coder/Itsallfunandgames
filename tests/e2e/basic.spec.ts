// tests/e2e/basic.spec.ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Base path needs to be included for local testing if running a static server
  await page.goto('http://localhost:3000/Itsallfunandgames/');
});

test('has title', async ({ page }) => {
  await expect(page).toHaveTitle(/itsallfunandgames/);
});

test('loads and displays games', async ({ page }) => {
  // Wait for the client component to render
  await expect(page.getByText('Tag')).toBeVisible();
  await expect(page.getByText('Hide-and-Seek')).toBeVisible();
});

test('search filters games', async ({ page }) => {
    await page.getByPlaceholder('Search by name...').fill('hide');
    await expect(page.getByText('Hide-and-Seek')).toBeVisible();
    await expect(page.getByText('Tag')).not.toBeVisible();
});

test('diagnostics page shows bad record', async ({ page }) => {
    await page.goto('http://localhost:3000/Itsallfunandgames/data/quality');
    await expect(page.getByText('bad-record')).toBeVisible();
    await expect(page.getByText('Name is required')).toBeVisible();
});