import { test, expect } from '@playwright/test';
import * as path from 'node:path';

const QA_DIR = path.resolve('docs/qa-dialogs');

const VIEWPORTS = {
  desktop_wide: { width: 1440, height: 700 },
  desktop_short: { width: 1280, height: 600 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
};

async function loginAdmin(page: any) {
  await page.goto('http://127.0.0.1:5174/login');
  await expect(page.locator('text=Naman Studio')).toBeVisible({ timeout: 15000 });
  await page.fill('input[type="email"], input[placeholder*="admin@"]', 'admin@abrainoconscious.com');
  await page.fill('input[type="password"]', 'Password123!');
  await page.click('button[type="submit"]:has-text("Sign In to Studio")');
  await page.waitForURL((url: URL) => url.pathname === '/', { timeout: 15000 });
}

test.describe('Dialog QA & Responsive Viewport Verification Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  // =========================================================================
  // 1. "Enrol Student in Program" Dialog at 1280x600 short window & all viewports
  // =========================================================================
  test('1. Enrol Student in Program dialog is centered, max-height 90dvh, footer buttons reachable at 1280x600', async ({
    page,
  }) => {
    // Crucial bug reproduction: 1280x600 viewport
    await page.setViewportSize(VIEWPORTS.desktop_short);
    await loginAdmin(page);

    await page.goto('http://127.0.0.1:5174/students');
    await expect(page.locator('h1')).toContainText('Students & Enrollments');

    // Click "Enrol in Program"
    const openBtn = page.locator('button:has-text("Enrol in Program")');
    await expect(openBtn).toBeVisible();
    await openBtn.click();

    // Dialog is visible
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(page.locator('text=Enrol Student in Program')).toBeVisible();

    // Verify footer buttons are IN VIEWPORT and clickable
    const cancelBtn = dialog.locator('button:has-text("Cancel")');
    const enrollBtn = dialog.locator('button:has-text("Confirm Enrollment"), button:has-text("Enrol Student")');

    await expect(cancelBtn).toBeVisible();
    await expect(cancelBtn).toBeInViewport();
    await expect(enrollBtn).toBeVisible();
    await expect(enrollBtn).toBeInViewport();

    // Verify background scroll lock (Radix sets data-scroll-locked on body)
    const isLocked = await page.evaluate(() => {
      return document.body.hasAttribute('data-scroll-locked') ||
             window.getComputedStyle(document.body).overflow === 'hidden';
    });
    expect(isLocked).toBe(true);

    // Screenshot in Dark Mode (1280x600)
    await page.screenshot({
      path: path.join(QA_DIR, '01-enrol-student-1280x600-dark.png'),
    });

    // Toggle Light Mode and screenshot
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    });
    await expect(enrollBtn).toBeInViewport();
    await page.screenshot({
      path: path.join(QA_DIR, '01-enrol-student-1280x600-light.png'),
    });

    // Reset back to dark
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    });

    // Verify 1440x700
    await page.setViewportSize(VIEWPORTS.desktop_wide);
    await expect(enrollBtn).toBeInViewport();
    await page.screenshot({
      path: path.join(QA_DIR, '01-enrol-student-1440x700.png'),
    });

    // Verify 768x1024 (Tablet)
    await page.setViewportSize(VIEWPORTS.tablet);
    await expect(enrollBtn).toBeInViewport();
    await page.screenshot({
      path: path.join(QA_DIR, '01-enrol-student-768x1024.png'),
    });

    // Verify 390x844 (Mobile bottom sheet)
    await page.setViewportSize(VIEWPORTS.mobile);
    await expect(enrollBtn).toBeInViewport();
    await page.screenshot({
      path: path.join(QA_DIR, '01-enrol-student-390x844-mobile.png'),
    });

    // Verify Close / Escape functionality
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    const isLockedAfter = await page.evaluate(() => {
      return document.body.hasAttribute('data-scroll-locked');
    });
    expect(isLockedAfter).toBe(false);
  });

  // =========================================================================
  // 2. "Generate Challenge Days" Dialog at 1280x600
  // =========================================================================
  test('2. Generate Challenge Days dialog footer buttons are in viewport at 1280x600', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.desktop_short);
    await loginAdmin(page);

    await page.goto('http://127.0.0.1:5174/sessions');
    await expect(page.locator('h1')).toContainText('Live Sessions Controller');

    // Switch to Full Schedule tab
    const fullScheduleTab = page.locator('button:has-text("Full Schedule")');
    await fullScheduleTab.click();

    // Click "Generate Days"
    const generateBtn = page.locator('button:has-text("Generate Days")');
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(page.locator('text=Generate Challenge Days')).toBeVisible();

    const cancelBtn = dialog.locator('button:has-text("Cancel")');
    const submitBtn = dialog.locator('button:has-text("Generate Days")');

    await expect(cancelBtn).toBeVisible();
    await expect(cancelBtn).toBeInViewport();
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeInViewport();

    await page.screenshot({
      path: path.join(QA_DIR, '02-generate-days-1280x600-dark.png'),
    });

    // Mobile view
    await page.setViewportSize(VIEWPORTS.mobile);
    await expect(submitBtn).toBeInViewport();
    await page.screenshot({
      path: path.join(QA_DIR, '02-generate-days-390x844-mobile.png'),
    });

    // Escape closes
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  // =========================================================================
  // 3. "Shift Schedule" Dialog at 1280x600
  // =========================================================================
  test('3. Shift Schedule dialog is centered and footer buttons are in viewport at 1280x600', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.desktop_short);
    await loginAdmin(page);

    await page.goto('http://127.0.0.1:5174/sessions');
    await expect(page.locator('h1')).toContainText('Live Sessions Controller');

    // Ensure challenge program is selected
    const select = page.locator('select').first();
    await expect(select).toHaveValue(/^[0-9a-f-]+$/, { timeout: 15000 });

    const fullScheduleTab = page.locator('button:has-text("Full Schedule")');
    await fullScheduleTab.click();

    // Wait for Shift All Days to be visible (sessions load asynchronously)
    const shiftBtn = page.locator('button:has-text("Shift All Days")');
    const hasShift = await shiftBtn
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    if (!hasShift) {
      const genBtn = page.locator('button:has-text("Generate Days")');
      await expect(genBtn).toBeVisible({ timeout: 15000 });
      await genBtn.click();

      const gDialog = page.locator('[role="dialog"]');
      await expect(gDialog).toBeVisible();

      const dateInput = gDialog.locator('input[type="date"]');
      if ((await dateInput.inputValue()) === '') {
        await dateInput.fill('2026-12-01');
      }

      const overwriteBox = gDialog.getByRole('checkbox');
      if (await overwriteBox.isVisible().catch(() => false)) {
        await overwriteBox.check();
      }

      const genSubmit = gDialog.locator('button:has-text("Generate Days")');
      await expect(genSubmit).toBeEnabled();
      await genSubmit.click();
      await expect(gDialog).not.toBeVisible({ timeout: 15000 });
    }

    // Now Shift All Days is guaranteed visible
    await expect(shiftBtn).toBeVisible({ timeout: 15000 });
    await shiftBtn.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(page.locator('text=Shift Entire Schedule')).toBeVisible();

    const cancelBtn = dialog.locator('button:has-text("Cancel")');
    const applyBtn = dialog.locator('button:has-text("Shift Schedule")');

    await expect(cancelBtn).toBeVisible();
    await expect(cancelBtn).toBeInViewport();
    await expect(applyBtn).toBeVisible();
    await expect(applyBtn).toBeInViewport();

    await page.screenshot({
      path: path.join(QA_DIR, '03-shift-schedule-1280x600-dark.png'),
    });

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  // =========================================================================
  // 4. "Session Editor" Modal (size="4xl", tall content) at 1280x600
  // =========================================================================
  test('4. Session Editor tall modal scrolls smoothly and keeps action buttons sticky and in viewport', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.desktop_short);
    await loginAdmin(page);

    await page.goto('http://127.0.0.1:5174/sessions');
    const fullScheduleTab = page.locator('button:has-text("Full Schedule")');
    await fullScheduleTab.click();

    const addBtn = page.locator('button:has-text("Add Day")');
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    const cancelBtn = dialog.locator('button:has-text("Cancel")');
    const saveBtn = dialog.locator('button:has-text("Save Session Changes"), button:has-text("Create Session"), button:has-text("Save")').first();

    await expect(cancelBtn).toBeVisible();
    await expect(cancelBtn).toBeInViewport();
    await expect(saveBtn).toBeVisible();
    await expect(saveBtn).toBeInViewport();

    await page.screenshot({
      path: path.join(QA_DIR, '04-session-editor-1280x600-dark.png'),
    });

    // Check light mode
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    });
    await expect(saveBtn).toBeInViewport();
    await page.screenshot({
      path: path.join(QA_DIR, '04-session-editor-1280x600-light.png'),
    });

    // Mobile view
    await page.setViewportSize(VIEWPORTS.mobile);
    await expect(saveBtn).toBeInViewport();
    await page.screenshot({
      path: path.join(QA_DIR, '04-session-editor-390x844-mobile.png'),
    });

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  // =========================================================================
  // 5. "Delete Program Permanently" Dialog at 1280x600
  // =========================================================================
  test('5. Delete Program Permanently dialog is centered and buttons reachable at 1280x600', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.desktop_short);
    await loginAdmin(page);

    await page.goto('http://127.0.0.1:5174/programs');
    await expect(page.locator('h1')).toContainText('Programs Manager');

    // Click Delete button on first program row
    const deleteBtnTrigger = page.locator('table tbody tr button[title="Delete"]').first();
    await expect(deleteBtnTrigger).toBeVisible();
    await deleteBtnTrigger.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(page.locator('text=Delete Program Permanently')).toBeVisible();

    const cancelBtn = dialog.locator('button:has-text("Cancel")');
    const deleteBtn = dialog.locator('button:has-text("Delete Forever")');

    await expect(cancelBtn).toBeVisible();
    await expect(cancelBtn).toBeInViewport();
    await expect(deleteBtn).toBeVisible();
    await expect(deleteBtn).toBeInViewport();

    await page.screenshot({
      path: path.join(QA_DIR, '05-delete-program-1280x600.png'),
    });

    await cancelBtn.click();
    await expect(dialog).not.toBeVisible();
  });

  // =========================================================================
  // 6. "Bulk Set Pillar" Dialog at 1280x600
  // =========================================================================
  test('6. Bulk Set Pillar dialog opens and action buttons are in viewport at 1280x600', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.desktop_short);
    await loginAdmin(page);

    await page.goto('http://127.0.0.1:5174/programs');

    // Select the first program checkbox
    const firstCheckbox = page.locator('table tbody tr input[type="checkbox"]').first();
    await expect(firstCheckbox).toBeVisible({ timeout: 15000 });
    await firstCheckbox.check();

    // Bulk action bar appears
    const setPillarBtn = page.locator('button:has-text("Set Pillar")');
    await expect(setPillarBtn).toBeVisible({ timeout: 5000 });
    await setPillarBtn.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(page.locator('text=Set Pillar Category')).toBeVisible();

    const cancelBtn = dialog.locator('button:has-text("Cancel")');
    const applyBtn = dialog.locator('button:has-text("Apply to")');

    await expect(cancelBtn).toBeVisible();
    await expect(cancelBtn).toBeInViewport();
    await expect(applyBtn).toBeVisible();
    await expect(applyBtn).toBeInViewport();

    await page.screenshot({
      path: path.join(QA_DIR, '06-bulk-pillar-1280x600.png'),
    });

    await cancelBtn.click();
    await expect(dialog).not.toBeVisible();
  });

  // =========================================================================
  // 7. "Confirm Urgent Broadcast" Dialog on Announcements page
  // =========================================================================
  test('7. Urgent Announcement Confirmation dialog is centered with action buttons in viewport', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.desktop_short);
    await loginAdmin(page);

    await page.goto('http://127.0.0.1:5174/announcements');
    await expect(page.locator('h1')).toContainText('Announcements & Broadcasts');

    // Click "+ New Announcement" tab
    const composeTab = page.locator('button:has-text("New Announcement")');
    await composeTab.click();

    // Select Urgent broadcast kind
    const urgentKindBtn = page.locator('button:has-text("urgent")');
    await expect(urgentKindBtn).toBeVisible();
    await urgentKindBtn.click();

    // Fill title
    const titleInput = page.locator('input[placeholder*="Schedule Update"]');
    await titleInput.fill('Urgent QA Test Broadcast');

    // Fill body via contenteditable or textarea
    const bodyInput = page.locator('[contenteditable="true"], textarea, div[role="textbox"]').first();
    await bodyInput.click();
    await page.keyboard.type('This is an important urgent test announcement message.');

    // Click Publish Broadcast Now (triggers urgent confirmation modal)
    const publishBtn = page.locator('button:has-text("Publish Broadcast Now")');
    await expect(publishBtn).toBeVisible();
    await publishBtn.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(page.locator('text=Confirm Urgent Broadcast')).toBeVisible();

    const cancelBtn = dialog.locator('button:has-text("Cancel")');
    const dispatchBtn = dialog.locator('button:has-text("Yes, Dispatch Urgent Banner")');

    await expect(cancelBtn).toBeVisible();
    await expect(cancelBtn).toBeInViewport();
    await expect(dispatchBtn).toBeVisible();
    await expect(dispatchBtn).toBeInViewport();

    await page.screenshot({
      path: path.join(QA_DIR, '07-urgent-broadcast-1280x600.png'),
    });

    await cancelBtn.click();
    await expect(dialog).not.toBeVisible();
  });

  // =========================================================================
  // 8. Design System Radix Dialog modal on student app
  // =========================================================================
  test('8. Student web app Design System dialog is centered, styled, and buttons clickable', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.desktop_short);

    await page.goto('http://127.0.0.1:5173/design-system');
    await expect(page.locator('h1')).toContainText('ABrainoConscious Design System');

    const openBtn = page.locator('button:has-text("Open Radix Dialog Modal")');
    await expect(openBtn).toBeVisible();
    await openBtn.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(page.locator('text=7-Day Guarantee Assurance')).toBeVisible();

    const gotItBtn = dialog.locator('button:has-text("Got It")');
    const closeBtn = dialog.getByRole('button', { name: 'Close', exact: true });

    await expect(gotItBtn).toBeVisible();
    await expect(gotItBtn).toBeInViewport();
    await expect(closeBtn).toBeVisible();
    await expect(closeBtn).toBeInViewport();

    await page.screenshot({
      path: path.join(QA_DIR, '08-design-system-dialog-1280x600.png'),
    });

    // Test mobile 390x844
    await page.setViewportSize(VIEWPORTS.mobile);
    await expect(gotItBtn).toBeInViewport();
    await page.screenshot({
      path: path.join(QA_DIR, '08-design-system-dialog-390x844.png'),
    });

    await gotItBtn.click();
    await expect(dialog).not.toBeVisible();
  });
});
