import { test, expect } from '@playwright/test';

test.describe('ABrainoConscious Authentication Suite', () => {
  test('1. Signup form validation displays friendly errors and enforces terms acceptance', async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/signup');

    // Page title and form render
    await expect(page.locator('h1')).toContainText('Begin Your Growth Journey');
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();

    // Fill invalid data: 1 char name, weak password, no terms
    await page.fill('input[placeholder="e.g. Priya Sharma"]', 'A');
    await page.fill('input[placeholder="you@domain.com"]', 'invalid-email');
    await page.fill('input[placeholder="At least 8 characters"]', 'short');

    // Submit
    await page.click('button[type="submit"]:has-text("Create Account")');

    // Friendly error should be displayed
    const errorNotice = page.locator('.text-red-300');
    await expect(errorNotice).toBeVisible();
  });

  test('2. Unauthenticated users are redirected from /my-programs to /login?next=...', async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/my-programs');

    // Should automatically redirect to /login with encoded next parameter
    await page.waitForURL((url) => url.pathname === '/login' && url.searchParams.get('next') === '/my-programs');
    expect(page.url()).toContain('/login?next=%2Fmy-programs');
  });

  test('3. Email login with seeded student succeeds and navigates into app', async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/login');

    await page.fill('input[placeholder="you@domain.com"]', 'arjun.enrolled@example.com');
    await page.fill('input[placeholder="Your account password"]', 'Password123!');
    await page.click('button[type="submit"]:has-text("Sign In")');

    // Should log in and redirect to home or my-programs
    await page.waitForURL((url) => url.pathname === '/' || url.pathname === '/my-programs');
    expect(['/', '/my-programs']).toContain(new URL(page.url()).pathname);
  });

  test('4. ?program= query parameter survives login and lands on program page', async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/login?program=21-day-mindset');

    await page.fill('input[placeholder="you@domain.com"]', 'arjun.enrolled@example.com');
    await page.fill('input[placeholder="Your account password"]', 'Password123!');
    await page.click('button[type="submit"]:has-text("Sign In")');

    // Should navigate directly to /programs/21-day-mindset
    await page.waitForURL((url) => url.pathname === '/programs/21-day-mindset');
    expect(page.url()).toContain('/programs/21-day-mindset');
  });

  test('5. Student account is denied entry on the admin app with clear Access Denied notice', async ({ page }) => {
    await page.goto('http://127.0.0.1:5174/login');

    await page.fill('input[placeholder="admin@abrainoconcious.com"]', 'arjun.enrolled@example.com');
    await page.fill('input[placeholder="Your admin password"]', 'Password123!');
    await page.click('button[type="submit"]:has-text("Sign In to Studio")');

    // Must show Access Denied screen and NOT render admin navigation
    await expect(page.locator('h2:has-text("Access Denied")')).toBeVisible();
    await expect(page.locator('text=restricted exclusively to ABrainoConscious administrators')).toBeVisible();
  });

  test('6. Seeded admin account can enter the admin app', async ({ page }) => {
    await page.goto('http://127.0.0.1:5174/login');

    await page.fill('input[placeholder="admin@abrainoconcious.com"]', 'admin@abrainoconcious.com');
    await page.fill('input[placeholder="Your admin password"]', 'Password123!');
    await page.click('button[type="submit"]:has-text("Sign In to Studio")');

    // Must render admin dashboard with management header
    await page.waitForURL((url) => url.pathname === '/');
    await expect(page.locator('text=Platform Overview')).toBeVisible();
  });
});
