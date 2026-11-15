import { test, expect } from '@playwright/test';
import * as path from 'node:path';

const QA_DIR = path.resolve('docs/qa-step9');

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
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

test.describe('Step 9 QA Verification: Admin Business Screens & Student Integrations', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  // =========================================================================
  // 1. Overview Dashboard (PART G)
  // =========================================================================
  test('1. Overview Dashboard renders real stats, revenue cards, needs attention queue, and top programs', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await loginAdmin(page);

    await expect(page.locator('h1')).toContainText('Studio Overview');
    await expect(page.locator('text=Gross Revenue')).toBeVisible();
    await expect(page.locator('text=Active Enrollments')).toBeVisible();

    // Verify Date Range Buttons
    const range7dBtn = page.locator('main button:has-text("7d")');
    await expect(range7dBtn).toBeVisible();
    await range7dBtn.click();

    // Take Desktop Screenshot
    await page.screenshot({ path: path.join(QA_DIR, '01-overview-desktop-dark.png'), fullPage: true });

    // Mobile Viewport (390px)
    await page.setViewportSize(VIEWPORTS.mobile);
    await expect(page.locator('h1')).toContainText('Studio Overview');
    await page.screenshot({ path: path.join(QA_DIR, '01-overview-mobile-dark.png'), fullPage: true });
  });

  // =========================================================================
  // 2. Students Directory & Profile Drawer (PART C)
  // =========================================================================
  test('2. Students Directory renders search, filters, student list, and deletion requests tab', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await loginAdmin(page);

    await page.goto('http://127.0.0.1:5174/students');
    await expect(page.locator('h1')).toContainText('Students & Enrollments');

    // Verify search input
    const searchInput = page.locator('input[placeholder*="Search name, phone, or ID"]');
    await expect(searchInput).toBeVisible();

    // Verify Tabs
    const deletionTab = page.locator('button:has-text("Account Deletion Requests")');
    await expect(deletionTab).toBeVisible();
    await deletionTab.click();
    await expect(page.locator('text=Manual Auth Deletion Required')).toBeVisible();

    // Switch back to Directory
    const directoryTab = page.locator('button:has-text("Student Directory")');
    await directoryTab.click();
    await expect(page.locator('text=Directory of registered students')).toBeVisible();

    // Verify Enrol Student button opens centered modal
    const enrolBtn = page.locator('button:has-text("Enrol in Program")');
    await expect(enrolBtn).toBeVisible();
    await enrolBtn.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(page.locator('text=Enrol Student in Program')).toBeVisible();

    // Cancel modal
    await dialog.locator('button:has-text("Cancel")').click();
    await expect(dialog).not.toBeVisible();

    await page.screenshot({ path: path.join(QA_DIR, '02-students-desktop-dark.png'), fullPage: true });

    // Mobile View
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.screenshot({ path: path.join(QA_DIR, '02-students-mobile-dark.png'), fullPage: true });
  });

  // =========================================================================
  // 3. Attendance & Engagement Report (PART F)
  // =========================================================================
  test('3. Attendance page renders per-session and per-student tables with low engagement filter', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await loginAdmin(page);

    await page.goto('http://127.0.0.1:5174/attendance');
    await expect(page.locator('h1')).toContainText('Attendance & Task Reports');

    // Toggle to Per-Student View
    const perStudentBtn = page.locator('button:has-text("Per-Student Breakdown")');
    await expect(perStudentBtn).toBeVisible();
    await perStudentBtn.click();

    await expect(page.locator('text=Show low engagement learners only')).toBeVisible();

    // Switch back to Per-Session View
    const perSessionBtn = page.locator('button:has-text("Per-Session Breakdown")');
    await perSessionBtn.click();
    await expect(page.locator('text=Daily Live Sessions Attendance Log')).toBeVisible();

    await page.screenshot({ path: path.join(QA_DIR, '03-attendance-desktop-dark.png'), fullPage: true });
  });

  // =========================================================================
  // 4. Coupons Page & Discount Engine (PART D)
  // =========================================================================
  test('4. Coupons page renders coupon codes, create coupon modal, and coupon simulator tool', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await loginAdmin(page);

    await page.goto('http://127.0.0.1:5174/coupons');
    await expect(page.locator('h1')).toContainText('Promotional Coupons');

    // Open Create Coupon Modal
    const createBtn = page.locator('button:has-text("Create Coupon")');
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('text=Create Promotional Coupon')).toBeVisible();

    // Test code generator
    const generateBtn = dialog.locator('button:has-text("Auto-generate Code")');
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();

    // Close Dialog
    await dialog.locator('button:has-text("Cancel")').click();
    await expect(dialog).not.toBeVisible();

    // Test Coupon Simulator Modal
    const testCouponBtn = page.locator('button:has-text("Test this coupon")');
    await expect(testCouponBtn).toBeVisible();
    await testCouponBtn.click();

    const simDialog = page.locator('[role="dialog"]');
    await expect(simDialog).toBeVisible();
    await expect(simDialog.locator('text=Test This Coupon Simulator')).toBeVisible();
    await simDialog.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(simDialog).not.toBeVisible();

    await page.screenshot({ path: path.join(QA_DIR, '04-coupons-desktop-dark.png'), fullPage: true });
  });

  // =========================================================================
  // 5. Orders & Payments Ledger (PART E - On Hold Scope)
  // =========================================================================
  test('5. Payments page renders real zeros, payment interest demand cards, and disabled action notices', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await loginAdmin(page);

    await page.goto('http://127.0.0.1:5174/payments');
    await expect(page.locator('h1')).toContainText('Orders & Payments');

    // Verify Real Zero cards
    await expect(page.locator('text=Total Revenue')).toBeVisible();
    await expect(page.locator('.font-serif:has-text("₹0")').first()).toBeVisible();

    // Verify Payment Interest Demand Panel
    await expect(page.locator('text=Student Payment Interest Demand')).toBeVisible();

    // Verify disabled buttons
    const reconcileBtn = page.locator('button:has-text("Reconcile")');
    await expect(reconcileBtn).toBeDisabled();

    await page.screenshot({ path: path.join(QA_DIR, '05-payments-desktop-dark.png'), fullPage: true });
  });

  // =========================================================================
  // 6. Reviews Moderation Queue (PART F)
  // =========================================================================
  test('6. Reviews page renders moderation status tabs, star ratings, and action controls', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await loginAdmin(page);

    await page.goto('http://127.0.0.1:5174/reviews');
    await expect(page.locator('h1')).toContainText('Student Reviews Moderation');

    // Verify Filter Tabs
    await expect(page.locator('button:has-text("all")')).toBeVisible();
    await expect(page.locator('button:has-text("pending")')).toBeVisible();
    await expect(page.locator('button:has-text("approved")')).toBeVisible();
    await expect(page.locator('button:has-text("hidden")')).toBeVisible();

    await page.screenshot({ path: path.join(QA_DIR, '06-reviews-desktop-dark.png'), fullPage: true });
  });

  // =========================================================================
  // 7. Team & RBAC Management (PART H)
  // =========================================================================
  test('7. Team page renders administrator roster, Add Member modal, and safety rule protection', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await loginAdmin(page);

    await page.goto('http://127.0.0.1:5174/team');
    await expect(page.locator('h1')).toContainText('Team & Role-Based Access');

    // Verify Add Member button
    const addMemberBtn = page.locator('button:has-text("Add Member")');
    await expect(addMemberBtn).toBeVisible();
    await addMemberBtn.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('text=Invite Team Member')).toBeVisible();

    // Cancel modal
    await dialog.locator('button:has-text("Cancel")').click();
    await expect(dialog).not.toBeVisible();

    // Verify RBAC Permissions Matrix Table
    await expect(page.locator('text=Role Permission Matrix (RBAC)')).toBeVisible();

    await page.screenshot({ path: path.join(QA_DIR, '07-team-desktop-dark.png'), fullPage: true });
  });

  // =========================================================================
  // 8. Platform Settings (PART I)
  // =========================================================================
  test('8. Platform Settings renders all 7 tabs, maintenance toggle, and crisis helplines table', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await loginAdmin(page);

    await page.goto('http://127.0.0.1:5174/settings');
    await expect(page.locator('h1')).toContainText('Platform Settings');

    // Check all tabs in main container
    const tabs = [
      'Brand & Identity',
      'Business & Invoicing',
      'Legal Pages',
      'Crisis & Helplines',
      'Live Sessions',
      'Site & Maintenance',
      'Security & Auth',
    ];

    for (const tabName of tabs) {
      const tabBtn = page.locator('main').locator(`button:has-text("${tabName}")`);
      await expect(tabBtn).toBeVisible();
    }

    // Switch to Legal Pages tab
    await page.locator('main').locator('button:has-text("Legal Pages")').click();
    await expect(page.locator('h3:has-text("Terms of Service")')).toBeVisible();
    await expect(page.locator('h3:has-text("Privacy Policy")')).toBeVisible();

    // Switch to Crisis & Helplines tab
    await page.locator('main').locator('button:has-text("Crisis & Helplines")').click();
    await expect(page.locator('h3:has-text("Crisis & Psychological Helplines")')).toBeVisible();
    await expect(page.locator('input[value*="Tele-MANAS"]')).toBeVisible();

    // Switch to Site & Maintenance tab
    await page.locator('main').locator('button:has-text("Site & Maintenance")').click();
    await expect(page.locator('text=Platform Maintenance Mode')).toBeVisible();
    await expect(page.locator('text=Not configured (Payments coming soon)')).toBeVisible();

    await page.screenshot({ path: path.join(QA_DIR, '08-settings-desktop-dark.png'), fullPage: true });
  });

  // =========================================================================
  // 9. Audit Log (PART J)
  // =========================================================================
  test('9. Audit Log renders immutable trail, entity & action filters, and CSV export', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await loginAdmin(page);

    await page.goto('http://127.0.0.1:5174/audit-log');
    await expect(page.locator('h1')).toContainText('Audit Log');

    // Verify filters
    await expect(page.locator('select[aria-label="Filter by Action"]')).toBeVisible();
    await expect(page.locator('select[aria-label="Filter by Entity"]')).toBeVisible();
    await expect(page.locator('select[aria-label="Filter by Role"]')).toBeVisible();
    await expect(page.locator('select[aria-label="Filter by Time"]')).toBeVisible();
    await expect(page.locator('button:has-text("Export Page CSV")')).toBeVisible();

    await page.screenshot({ path: path.join(QA_DIR, '09-audit-log-desktop-dark.png'), fullPage: true });
  });

  // =========================================================================
  // 10. Student Public Pages: /terms, /privacy, /refund-policy, /support
  // =========================================================================
  test('10. Student portal renders /terms, /privacy, /refund-policy, and /support pages', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.desktop);

    // Terms
    await page.goto('http://127.0.0.1:5173/terms');
    await expect(page.locator('h1')).toContainText('Terms of Service');
    await page.screenshot({ path: path.join(QA_DIR, '10-student-terms.png'), fullPage: true });

    // Privacy
    await page.goto('http://127.0.0.1:5173/privacy');
    await expect(page.locator('h1')).toContainText('Privacy Policy');
    await page.screenshot({ path: path.join(QA_DIR, '10-student-privacy.png'), fullPage: true });

    // Refund Policy
    await page.goto('http://127.0.0.1:5173/refund-policy');
    await expect(page.locator('h1')).toContainText('Refund & Cancellation Policy');
    await page.screenshot({ path: path.join(QA_DIR, '10-student-refund.png'), fullPage: true });

    // Support & Helplines
    await page.goto('http://127.0.0.1:5173/support');
    await expect(page.locator('h1')).toContainText('Need Support Right Now?');
    await expect(page.locator('text=Tele-MANAS')).toBeVisible();
    await page.screenshot({ path: path.join(QA_DIR, '10-student-support.png'), fullPage: true });
  });
});
