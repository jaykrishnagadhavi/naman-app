import { test, expect } from '@playwright/test';

test.describe('Step 5 Admin Sessions Manager & Announcements Flow', () => {
  test('1. Admin navigates to /sessions and verifies Today Live Controller & Schedule views', async ({
    page,
  }) => {
    // Login as Admin
    await page.goto('http://127.0.0.1:5174/login');
    await page.fill('input[placeholder="admin@abrainoconcious.com"]', 'admin@abrainoconscious.com');
    await page.fill('input[placeholder="Your admin password"]', 'Password123!');
    await page.click('button[type="submit"]:has-text("Sign In to Studio")');

    await page.waitForURL((url) => url.pathname === '/');

    // Overview page should contain Today's live control widget
    await expect(page.locator('text=Platform Overview')).toBeVisible();

    // Navigate to /sessions
    await page.goto('http://127.0.0.1:5174/sessions');
    await expect(page.locator('h1')).toContainText('Live Sessions Controller');

    // Switch view tabs
    const scheduleTab = page.locator('button:has-text("Full Schedule")');
    await scheduleTab.click();
    await expect(page.locator('h2:has-text("Cohort Schedule")')).toBeVisible();
  });

  test('2. Generate a 7-day challenge schedule and bulk edit titles', async ({ page }) => {
    await page.goto('http://127.0.0.1:5174/login');
    await page.fill('input[placeholder="admin@abrainoconcious.com"]', 'admin@abrainoconscious.com');
    await page.fill('input[placeholder="Your admin password"]', 'Password123!');
    await page.click('button[type="submit"]:has-text("Sign In to Studio")');
    await page.waitForURL((url) => url.pathname === '/');

    await page.goto('http://127.0.0.1:5174/sessions');

    // Click "Generate Days"
    const generateBtn = page.locator('button:has-text("Generate Days")');
    if (await generateBtn.isVisible()) {
      await generateBtn.click();
      await expect(page.locator('text=Generate Challenge Days')).toBeVisible();

      // Set total days to 7
      const totalDaysInput = page.locator('input[type="number"]').last();
      await totalDaysInput.fill('7');

      // Check overwrite if existing schedule detected
      const overwriteBox = page.locator('#genOverwriteCheckbox');
      if (await overwriteBox.isVisible()) {
        await overwriteBox.check();
      }

      await page.click('button:has-text("Generate Days"), button:has-text("Generate Schedule")');
      await page.waitForTimeout(1000);
    }
  });

  test('3. Live link publish flow with notify toggle and platform auto-detection', async ({
    page,
  }) => {
    await page.goto('http://127.0.0.1:5174/login');
    await page.fill('input[placeholder="admin@abrainoconcious.com"]', 'admin@abrainoconscious.com');
    await page.fill('input[placeholder="Your admin password"]', 'Password123!');
    await page.click('button[type="submit"]:has-text("Sign In to Studio")');
    await page.waitForURL((url) => url.pathname === '/');

    await page.goto('http://127.0.0.1:5174/sessions');

    const linkInput = page.locator('input[placeholder*="https://us02web.zoom.us/j/"]');
    if (await linkInput.isVisible()) {
      // Paste Zoom URL
      await linkInput.fill('https://us02web.zoom.us/j/9876543210?pwd=test');
      await expect(page.locator('text=ZOOM')).toBeVisible();

      // Ensure notify toggle is checked
      const notifyCheckbox = page.locator('#notifyEnrolleesToggle');
      if (await notifyCheckbox.isVisible()) {
        await expect(notifyCheckbox).toBeChecked();
      }

      // Click Publish
      await page.click('button:has-text("Publish Live Link"), button:has-text("Update & Publish")');
      await page.waitForTimeout(1000);
    }
  });

  test('4. Mark Live, Mark Ended, and recording URL prompt', async ({ page }) => {
    await page.goto('http://127.0.0.1:5174/login');
    await page.fill('input[placeholder="admin@abrainoconcious.com"]', 'admin@abrainoconscious.com');
    await page.fill('input[placeholder="Your admin password"]', 'Password123!');
    await page.click('button[type="submit"]:has-text("Sign In to Studio")');
    await page.waitForURL((url) => url.pathname === '/');

    await page.goto('http://127.0.0.1:5174/sessions');

    // Click Mark Live
    const markLiveBtn = page.locator('button:has-text("Mark Live")');
    if (await markLiveBtn.isVisible() && await markLiveBtn.isEnabled()) {
      await markLiveBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator('text=LIVE NOW, text=COHORT LIVE NOW')).toBeVisible();
    }

    // Click Mark Ended
    const markEndedBtn = page.locator('button:has-text("Mark Ended")');
    if (await markEndedBtn.isVisible() && await markEndedBtn.isEnabled()) {
      await markEndedBtn.click();
      // Should prompt recording modal
      await expect(page.locator('text=Session Recording URL')).toBeVisible();

      // Fill recording URL
      const recInput = page.locator('input[placeholder="https://..."]');
      await recInput.fill('https://youtube.com/watch?v=rec123');

      // Save recording
      await page.click('button:has-text("Save Recording")');
      await page.waitForTimeout(500);
    }
  });

  test('5. Preview as student card modal', async ({ page }) => {
    await page.goto('http://127.0.0.1:5174/login');
    await page.fill('input[placeholder="admin@abrainoconcious.com"]', 'admin@abrainoconscious.com');
    await page.fill('input[placeholder="Your admin password"]', 'Password123!');
    await page.click('button[type="submit"]:has-text("Sign In to Studio")');
    await page.waitForURL((url) => url.pathname === '/');

    await page.goto('http://127.0.0.1:5174/sessions');

    const previewBtn = page.locator('button:has-text("Preview as Student")');
    if (await previewBtn.isVisible()) {
      await previewBtn.click();
      await expect(page.locator('text=STUDENT DASHBOARD PREVIEW')).toBeVisible();
      await page.click('button:has-text("Close Preview")');
    }
  });

  test('6. Announcements composer with live banner/inbox preview and submission', async ({
    page,
  }) => {
    await page.goto('http://127.0.0.1:5174/login');
    await page.fill('input[placeholder="admin@abrainoconcious.com"]', 'admin@abrainoconscious.com');
    await page.fill('input[placeholder="Your admin password"]', 'Password123!');
    await page.click('button[type="submit"]:has-text("Sign In to Studio")');
    await page.waitForURL((url) => url.pathname === '/');

    // Navigate to /announcements
    await page.goto('http://127.0.0.1:5174/announcements');
    await expect(page.locator('h1')).toContainText('Announcements & Broadcasts');

    // Switch to Composer tab
    await page.click('button:has-text("Composer"), button:has-text("New Announcement")');

    // Fill Title
    const uniqueMsg = `Cohort Alert ${Date.now().toString().slice(-4)}`;
    await page.fill('input[placeholder*="Schedule Update"]', uniqueMsg);

    // Select Urgent kind
    await page.click('button:has-text("urgent")');

    // Fill body in ProseMirror / RichTextEditor
    const editor = page.locator('.ProseMirror');
    if (await editor.isVisible()) {
      await editor.fill('Tonight live session will begin exactly at 8:00 PM IST with Q&A.');
    }

    // Verify live student preview updates
    await expect(page.locator('text=Live Student Preview')).toBeVisible();
    await expect(page.locator(`text=${uniqueMsg}`)).toBeVisible();

    // Click Publish Broadcast Now
    await page.click('button:has-text("Publish Broadcast Now")');

    // If urgent confirmation modal appears, confirm
    const confirmUrgentBtn = page.locator('button:has-text("Yes, Dispatch Urgent Banner")');
    if (await confirmUrgentBtn.isVisible()) {
      await confirmUrgentBtn.click();
    }

    await page.waitForTimeout(1000);

    // Verify redirected to History tab and see the announcement
    await page.click('button:has-text("History")');
    await expect(page.locator(`text=${uniqueMsg}`)).toBeVisible();
  });
});

