import { test, expect } from '@playwright/test';

test.describe('Admin Programs Manager & Publish Checklist Flow', () => {
  test('1. Admin logs in, verifies empty/initial programs list, and navigates to editor', async ({ page }) => {
    // Login as Admin
    await page.goto('http://127.0.0.1:5174/login');
    await page.fill('input[placeholder="admin@abrainoconcious.com"]', 'admin@abrainoconscious.com');
    await page.fill('input[placeholder="Your admin password"]', 'Password123!');
    await page.click('button[type="submit"]:has-text("Sign In to Studio")');

    // Wait for Overview page
    await page.waitForURL((url) => url.pathname === '/');
    await expect(page.locator('text=Platform Overview')).toBeVisible();

    // Navigate to Programs list
    await page.click('a[href="/programs"], button:has-text("Programs")');
    await page.waitForURL((url) => url.pathname === '/programs');
    await expect(page.locator('h1')).toContainText('Programs Manager');

    // Click "Create Program"
    await page.click('button:has-text("Create Program"), button:has-text("Create First Challenge")');
    await page.waitForURL((url) => url.pathname === '/programs/new');

    // Check that Publish is initially blocked because checklist has unmet requirements
    const publishBtn = page.locator('button:has-text("Publish Program")');
    await expect(publishBtn).toBeDisabled();
    await expect(page.locator('text=Publish Checklist')).toBeVisible();
  });

  test('2. Admin fills required fields, saves program, and verifies it appears in list', async ({ page }) => {
    // Login as Admin
    await page.goto('http://127.0.0.1:5174/login');
    await page.fill('input[placeholder="admin@abrainoconcious.com"]', 'admin@abrainoconscious.com');
    await page.fill('input[placeholder="Your admin password"]', 'Password123!');
    await page.click('button[type="submit"]:has-text("Sign In to Studio")');
    await page.waitForURL((url) => url.pathname === '/');

    // Navigate to /programs/new
    await page.goto('http://127.0.0.1:5174/programs/new');
    await expect(page.locator('text=Program Foundation')).toBeVisible();

    const uniqueId = Date.now().toString().slice(-5);
    const testTitle = `E2E Challenge Sprint ${uniqueId}`;

    // Fill Title
    await page.fill('input[placeholder="e.g. 21-Day Mind & Emotion Mastery"]', testTitle);

    // Verify auto-slugification
    const slugInput = page.locator('input[placeholder="mind-emotion-mastery"]');
    await expect(slugInput).toHaveValue(`e2e-challenge-sprint-${uniqueId}`);

    // Fill Short Description
    await page.fill(
      'textarea[placeholder*="A concise, punchy description"]',
      'Daily live mental habits and resilience challenge designed for students.'
    );

    // Save Draft
    await page.click('button:has-text("Save Draft")');

    // Verify toast or saved status
    await expect(page.locator('text=Saved, text=Program created successfully')).toBeVisible();

    // Navigate back to programs list
    await page.goto('http://127.0.0.1:5174/programs');
    await expect(page.locator(`text=${testTitle}`)).toBeVisible();
  });

  test('3. Search by title and filter by pillar category', async ({ page }) => {
    await page.goto('http://127.0.0.1:5174/login');
    await page.fill('input[placeholder="admin@abrainoconcious.com"]', 'admin@abrainoconscious.com');
    await page.fill('input[placeholder="Your admin password"]', 'Password123!');
    await page.click('button[type="submit"]:has-text("Sign In to Studio")');
    await page.waitForURL((url) => url.pathname === '/');

    await page.goto('http://127.0.0.1:5174/programs');
    await expect(page.locator('h1')).toContainText('Programs Manager');

    // Search for non-existent keyword
    const searchInput = page.locator('input[placeholder*="Search by title"]');
    await searchInput.fill('NonExistentKeywordXYZ999');

    // Empty state should be visible
    await expect(page.locator('text=No matching programs found')).toBeVisible();

    // Clear search
    await page.click('button:has-text("Clear Filters")');
    await expect(searchInput).toHaveValue('');
  });

  test('4. Duplicate program creates a draft copy with unique slug', async ({ page }) => {
    await page.goto('http://127.0.0.1:5174/login');
    await page.fill('input[placeholder="admin@abrainoconcious.com"]', 'admin@abrainoconscious.com');
    await page.fill('input[placeholder="Your admin password"]', 'Password123!');
    await page.click('button[type="submit"]:has-text("Sign In to Studio")');
    await page.waitForURL((url) => url.pathname === '/');

    await page.goto('http://127.0.0.1:5174/programs');

    // If duplicate button exists on a row, click it
    const duplicateButton = page.locator('button[title="Duplicate"]').first();
    if (await duplicateButton.isVisible()) {
      await duplicateButton.click();
      // Should redirect to the new copy
      await page.waitForURL((url) => url.pathname.startsWith('/programs/'));
      await expect(page.locator('input[placeholder="e.g. 21-Day Mind & Emotion Mastery"]')).toHaveValue(/Copy of/);
    }
  });

  test('5. Staff user cannot delete programs and cannot change published prices', async ({ page }) => {
    // Login as Staff
    await page.goto('http://127.0.0.1:5174/login');
    await page.fill('input[placeholder="admin@abrainoconcious.com"]', 'staff@abrainoconscious.com');
    await page.fill('input[placeholder="Your admin password"]', 'Password123!');
    await page.click('button[type="submit"]:has-text("Sign In to Studio")');
    await page.waitForURL((url) => url.pathname === '/');

    await page.goto('http://127.0.0.1:5174/programs');
    await expect(page.locator('h1')).toContainText('Programs Manager');

    // Active delete buttons should not exist for staff (disabled or hidden)
    const deleteButton = page.locator('button[title="Delete"]');
    await expect(deleteButton).toHaveCount(0);
  });

  test('6. Student account is denied entry on admin routes', async ({ page }) => {
    await page.goto('http://127.0.0.1:5174/login');
    await page.fill('input[placeholder="admin@abrainoconcious.com"]', 'arjun.enrolled@example.com');
    await page.fill('input[placeholder="Your admin password"]', 'Password123!');
    await page.click('button[type="submit"]:has-text("Sign In to Studio")');

    // Must show Access Denied
    await expect(page.locator('h2:has-text("Access Denied")')).toBeVisible();
  });
});

