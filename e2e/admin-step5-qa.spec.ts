import { test, expect } from '@playwright/test';
import * as path from 'node:path';

const QA_DIR = path.resolve('docs/qa-step5');

test.describe('Admin Step 5 QA & Bug Fix Verification Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.context().clearCookies();
  });

  // =========================================================================
  // Requirement 3 & Failure C: First-load crash verification
  // =========================================================================
  test('1. Unauthenticated first load redirects cleanly to /login without crash (Issue C)', async ({
    page,
  }) => {
    // Set 1440px desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });

    // Navigate to root as fresh unauthenticated user
    await page.goto('http://127.0.0.1:5174/');

    // Assert clean redirect to login page
    await page.waitForURL((url) => url.pathname === '/login');

    // Assert NO "Admin error occurred. Reload Dashboard" crash screen appears
    await expect(page.locator('text=Admin error occurred. Reload Dashboard')).not.toBeVisible();
    await expect(page.locator('text=Naman Studio')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In to Studio")')).toBeVisible();

    await page.screenshot({ path: path.join(QA_DIR, '01-unauth-redirect-desktop.png'), fullPage: true });

    // Test on 390px mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://127.0.0.1:5174/');
    await page.waitForURL((url) => url.pathname === '/login');
    await expect(page.locator('text=Admin error occurred. Reload Dashboard')).not.toBeVisible();
    await expect(page.locator('text=Naman Studio')).toBeVisible();

    await page.screenshot({ path: path.join(QA_DIR, '01-unauth-redirect-mobile.png'), fullPage: true });
  });

  // =========================================================================
  // Requirement 5 & Failure E: Sidebar badges cleanup & Admin Overview
  // =========================================================================
  test('2. Admin logs in successfully, no dev badges in sidebar (Issue E)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://127.0.0.1:5174/login');
    await expect(page.locator('text=Naman Studio')).toBeVisible();

    await page.fill('input[type="email"], input[placeholder*="admin@"]', 'admin@abrainoconscious.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]:has-text("Sign In to Studio")');

    await page.waitForURL((url) => url.pathname === '/');
    await expect(page.locator('text=Naman Studio Overview')).toBeVisible({ timeout: 15000 });

    // Verify "Step 4" and "Step 5" dev badges are removed
    await expect(page.locator('text=Step 4')).not.toBeVisible();
    await expect(page.locator('text=Step 5')).not.toBeVisible();

    await page.screenshot({ path: path.join(QA_DIR, '02-admin-overview-desktop.png'), fullPage: true });

    // Mobile view
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('text=Naman Studio Overview')).toBeVisible();
    await page.screenshot({ path: path.join(QA_DIR, '02-admin-overview-mobile.png'), fullPage: true });
  });

  // =========================================================================
  // Requirement 2 & Failure B: Cohort Selector & "Generate Days" with title
  // =========================================================================
  test('3. Challenge auto-selected and Generate Days modal displays program name (Issue B)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://127.0.0.1:5174/login');
    await page.fill('input[type="email"], input[placeholder*="admin@"]', 'admin@abrainoconscious.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]:has-text("Sign In to Studio")');
    await page.waitForURL((url) => url.pathname === '/');

    // Navigate to /sessions
    await page.goto('http://127.0.0.1:5174/sessions');
    await expect(page.locator('h1')).toContainText('Live Sessions Controller');

    // Program selector has the challenge loaded and selected
    const select = page.locator('select').first();
    await expect(select).toBeVisible();
    await expect(select).toHaveValue(/^[0-9a-f-]+$/, { timeout: 15000 });

    // Switch to Full Schedule view
    const scheduleBtn = page.locator('button:has-text("Full Schedule")');
    await scheduleBtn.click();

    // Click "Generate Days" button
    const generateBtn = page.locator('button:has-text("Generate Days")');
    await expect(generateBtn).toBeEnabled();
    await generateBtn.click();

    // Assert modal opened
    const modal = page.locator('text=Generate Challenge Days');
    await expect(modal).toBeVisible();

    // Assert program name is NOT blank (Issue B fix)
    const modalDesc = page.locator('p:has-text("Batch create daily session placeholders")');
    await expect(modalDesc).toContainText('21-Day Mind & Emotion Mastery');

    // Set 7 days
    const daysInput = page.locator('input[type="number"]').last();
    await daysInput.fill('7');

    // Overwrite checkbox if present
    const overwriteBox = page.locator('#genOverwriteCheckbox');
    if (await overwriteBox.isVisible()) {
      await overwriteBox.check();
    }

    // Screenshot modal
    await page.screenshot({ path: path.join(QA_DIR, '03-generate-modal-desktop.png') });

    // Click Generate Days inside modal
    const submitGen = page.locator('div.fixed button:has-text("Generate Days")').last();
    await submitGen.click();

    // Assert success banner appears
    await expect(page.locator('text=Successfully generated 7 days')).toBeVisible({ timeout: 15000 });

    // Assert session table has 7 days
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('text=Day 1')).toBeVisible();
    await expect(page.locator('text=Day 7')).toBeVisible();

    await page.screenshot({ path: path.join(QA_DIR, '03-schedule-table-desktop.png'), fullPage: true });

    // Mobile view of schedule
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('text=Cohort Schedule')).toBeVisible();
    await page.screenshot({ path: path.join(QA_DIR, '03-schedule-table-mobile.png'), fullPage: true });
  });

  // =========================================================================
  // Requirement 1 & Failure A: Creating new session without 22P02
  // =========================================================================
  test('4. Creating a new session with no id saves cleanly without uuid syntax error (Issue A)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://127.0.0.1:5174/login');
    await page.fill('input[type="email"], input[placeholder*="admin@"]', 'admin@abrainoconscious.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]:has-text("Sign In to Studio")');
    await page.waitForURL((url) => url.pathname === '/');

    await page.goto('http://127.0.0.1:5174/sessions');

    // Switch to Full Schedule view
    await page.click('button:has-text("Full Schedule")');

    // Click "Add Day"
    await page.click('button:has-text("Add Day")');

    // Editor drawer/modal is visible
    await expect(page.locator('text=New Session')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Edit Details")')).toBeVisible();

    // Fill title
    const titleInput = page.locator('input[placeholder*="Day Title"], input[value*="Day "]').first();
    await titleInput.fill('Day 8: Breathwork & Emotional Release');

    // Fill task title
    const taskInput = page.locator('input[placeholder*="e.g. Journal 3 micro-moments"], input[placeholder*="Task Title"]');
    if (await taskInput.isVisible()) {
      await taskInput.fill('15-Minute Anulom Vilom Pranayama Practice');
    }

    // Click Create Session
    const saveBtn = page.locator('button:has-text("Create Session")');
    await saveBtn.click();

    // Assert NO 22P02 error alert appeared
    await expect(page.locator('text=invalid input syntax for type uuid')).not.toBeVisible();
    await expect(page.locator('text=22P02')).not.toBeVisible();

    // Assert Day 8 appears in table
    await expect(page.locator('text=Day 8: Breathwork & Emotional Release')).toBeVisible({ timeout: 15000 });

    await page.screenshot({ path: path.join(QA_DIR, '04-new-session-saved-desktop.png'), fullPage: true });
  });

  // =========================================================================
  // Today's control, Live link publish, platform detection, student preview
  // =========================================================================
  test('5. Live link publish, Zoom platform detection, and student preview modal', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://127.0.0.1:5174/login');
    await page.fill('input[type="email"], input[placeholder*="admin@"]', 'admin@abrainoconscious.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]:has-text("Sign In to Studio")');
    await page.waitForURL((url) => url.pathname === '/');

    await page.goto('http://127.0.0.1:5174/sessions');

    // Switch to Today's Control
    await page.click('button:has-text("Today\'s Control")');

    const linkInput = page.locator('input[placeholder*="https://us02web.zoom.us/j/"]');
    if (await linkInput.isVisible()) {
      await linkInput.fill('https://us02web.zoom.us/j/9876543210?pwd=secretpassword');
      // Assert Zoom detected
      await expect(page.locator('text=ZOOM')).toBeVisible();

      // Click Publish
      await page.click('button:has-text("Publish Live Link"), button:has-text("Update & Publish")');
      await page.waitForTimeout(1000);
    }

    // Click Student Preview
    const previewBtn = page.locator('button:has-text("Preview as Student")');
    if (await previewBtn.isVisible()) {
      await previewBtn.click();
      await expect(page.locator('text=STUDENT DASHBOARD PREVIEW')).toBeVisible();
      await page.screenshot({ path: path.join(QA_DIR, '05-student-preview-modal.png') });
      await page.click('button:has-text("Close Preview")');
    }

    await page.screenshot({ path: path.join(QA_DIR, '05-today-control-desktop.png'), fullPage: true });
  });

  // =========================================================================
  // Requirement 4 & Failure D: Complete Announcements Flow
  // =========================================================================
  test('6. Complete Announcements flow: draft, scheduled, urgent confirm, edit, duplicate, delete (Issue D)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://127.0.0.1:5174/login');
    await page.fill('input[type="email"], input[placeholder*="admin@"]', 'admin@abrainoconscious.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]:has-text("Sign In to Studio")');
    await page.waitForURL((url) => url.pathname === '/');

    // Navigate to /announcements
    await page.goto('http://127.0.0.1:5174/announcements');
    await expect(page.locator('h1')).toContainText('Announcements & Broadcasts');

    // Step A: Create and Save a Draft
    await page.click('button:has-text("Composer"), button:has-text("New Announcement")');

    const draftTitle = `Draft Prep Notice ${Date.now().toString().slice(-4)}`;
    await page.fill('input[placeholder*="Schedule Update"]', draftTitle);

    const editor = page.locator('.ProseMirror');
    if (await editor.isVisible()) {
      await editor.fill('Please remember to bring your journal for tomorrows evening session.');
    }

    // Verify live preview shows correct domain (no abrainoconcious.com typo)
    await expect(page.locator('text=abrainoconcious.com')).not.toBeVisible();

    await page.screenshot({ path: path.join(QA_DIR, '06-announcement-composer-desktop.png') });

    // Save as Draft
    await page.click('button:has-text("Save as Draft")');
    await expect(page.locator('text=Announcement saved as draft')).toBeVisible({ timeout: 15000 });

    // Step B: Verify Draft appears in History
    await page.click('button:has-text("History")');
    await expect(page.locator(`text=${draftTitle}`)).toBeVisible({ timeout: 10000 });

    // Step C: Publish Urgent Broadcast with Confirmation Modal
    await page.click('button:has-text("Composer"), button:has-text("New Announcement")');
    const urgentTitle = `Urgent Room Update ${Date.now().toString().slice(-4)}`;
    await page.fill('input[placeholder*="Schedule Update"]', urgentTitle);
    await page.click('button:has-text("urgent")');

    if (await editor.isVisible()) {
      await editor.fill('Meeting ID updated due to bandwidth limits. Please reconnect immediately.');
    }

    // Click Publish Broadcast Now
    await page.click('button:has-text("Publish Broadcast Now")');

    // Urgent confirmation modal should appear
    await expect(page.locator('text=Confirm Urgent Broadcast')).toBeVisible();
    await page.screenshot({ path: path.join(QA_DIR, '06-urgent-confirm-modal.png') });

    await page.click('button:has-text("Yes, Dispatch Urgent Banner")');
    await page.waitForTimeout(1000);

    // Step D: Verify in History
    await page.click('button:has-text("History")');
    await expect(page.locator(`text=${urgentTitle}`)).toBeVisible({ timeout: 10000 });

    // Step E: Duplicate the Draft
    const draftRow = page.locator('tbody tr').filter({ hasText: draftTitle });
    await expect(draftRow).toBeVisible();
    const copyBtn = draftRow.locator('button[title*="Duplicate"]');
    await copyBtn.click();
    await page.waitForTimeout(500);

    // Composer opens with (Copy)
    await expect(page.locator('input[placeholder*="Schedule Update"]')).toHaveValue(`${draftTitle} (Copy)`);
    // Save duplicate
    await page.click('button:has-text("Save as Draft")');
    await page.waitForTimeout(500);

    // Step F: Delete the duplicate
    await page.click('button:has-text("History")');
    const duplicateRow = page.locator('tbody tr').filter({ hasText: `${draftTitle} (Copy)` });
    await expect(duplicateRow).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    const deleteBtn = duplicateRow.locator('button[title*="Delete"]');
    await deleteBtn.click();
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${draftTitle} (Copy)`)).not.toBeVisible();

    await page.screenshot({ path: path.join(QA_DIR, '06-announcements-history-desktop.png'), fullPage: true });

    // Mobile view of History
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('h1')).toContainText('Announcements & Broadcasts');
    await page.screenshot({ path: path.join(QA_DIR, '06-announcements-history-mobile.png'), fullPage: true });
  });
});
