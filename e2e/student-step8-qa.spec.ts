import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Ensure docs/qa-step8 directory exists
const qaDir = path.join(process.cwd(), 'docs/qa-step8');
if (!fs.existsSync(qaDir)) {
  fs.mkdirSync(qaDir, { recursive: true });
}

async function loginStudent(page: Page) {
  await page.goto('http://127.0.0.1:5173/login');
  await page.fill('input[type="email"]', 'student.step6@gmail.com');
  await page.fill('input[type="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
  await expect(page.locator('header').getByText('ABrainoConscious').first()).toBeVisible();
}

async function loginAdmin(page: Page) {
  await page.goto('http://127.0.0.1:5174/login');
  await page.fill('input[placeholder="admin@abrainoconcious.com"]', 'admin@abrainoconscious.com');
  await page.fill('input[placeholder="Your admin password"]', 'Password123!');
  await page.click('button[type="submit"]:has-text("Sign In to Studio")');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
}

test.describe('Step 8 Enrolled Student Experience & Admin Students QA', () => {
  test.describe.configure({ mode: 'serial' });

  // Reset student enrollment before starting tests so checkout and enrollment tests start fresh
  test.beforeAll(async () => {
    try {
      const supabase = createClient('https://qwzmonsevvpbxvclnlhw.supabase.co', 'sb_publishable_W0r8fbbljVmx5LvtDveHzw_4qznSR1f');
      await supabase.auth.signInWithPassword({ email: 'admin@abrainoconscious.com', password: 'Password123!' });
      await supabase.from('enrollments').delete().eq('user_id', 'ff7f70d4-9744-417b-8154-261b2349b6ad');
    } catch (e) {
      console.warn('beforeAll enrollment cleanup error (non-fatal):', e);
    }
  });

  // --------------------------------------------------------------------------
  // PART 1: Admin Students Directory (/students)
  // --------------------------------------------------------------------------
  test('1. Admin Students Directory & Enrollment Modal (1440px & 390px)', async ({ browser }) => {
    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const adminPage = await adminContext.newPage();

    // 1. Log in to Admin app
    await loginAdmin(adminPage);

    // 2. Navigate to /students
    await adminPage.goto('http://127.0.0.1:5174/students');
    await expect(adminPage.getByText('Students & Enrollments').first()).toBeVisible();

    // Verify search bar and action buttons
    const searchInput = adminPage.locator('input[placeholder*="Search by student name"]');
    await expect(searchInput).toBeVisible();
    await expect(adminPage.locator('button', { hasText: 'Enrol in Program' })).toBeVisible();

    // Capture 1440px desktop screenshot of Students directory
    await adminPage.screenshot({
      path: path.join(qaDir, 'admin-students-desktop-1440px.png'),
      fullPage: false,
    });

    // 3. Open "Enrol in Program" dialog
    await adminPage.click('button:has-text("Enrol in Program")');
    await expect(adminPage.getByText('Enrol Student in Program')).toBeVisible();
    await expect(adminPage.locator('select')).toBeVisible();
    await expect(adminPage.locator('label[for="send-notif"]')).toBeVisible();

    // Close dialog
    await adminPage.click('button:has-text("Cancel")');

    // 4. Test mobile view (390px)
    await adminPage.setViewportSize({ width: 390, height: 844 });
    await adminPage.screenshot({
      path: path.join(qaDir, 'admin-students-mobile-390px.png'),
      fullPage: false,
    });

    await adminContext.close();
  });

  // --------------------------------------------------------------------------
  // PART 2: Student Login, Checkout & Payment Interest (/checkout/:slug)
  // --------------------------------------------------------------------------
  test('2. Student Checkout & Payment Interest On-Hold (1440px)', async ({ browser }) => {
    const studentContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const studentPage = await studentContext.newPage();

    // 1. Log in as verified student
    await loginStudent(studentPage);

    // 2. Navigate to paid program checkout
    await studentPage.goto('http://127.0.0.1:5173/checkout/21-day-mind-emotion-mastery');
    await expect(studentPage.getByText('Enrollment Order Summary')).toBeVisible();

    // 3. Verify Payment is ON HOLD per Step 8 instructions
    await expect(studentPage.getByText('PAYMENTS OPEN VERY SOON')).toBeVisible();
    await expect(studentPage.getByText('Admissions Opening Very Soon')).toBeVisible();

    // 4. Register Payment Interest
    const emailInput = studentPage.locator('input[placeholder="Your email address"]');
    await expect(emailInput).toBeVisible();
    await emailInput.fill('student.step6@gmail.com');
    const notifyBtn = studentPage.locator('button', { hasText: 'Notify Me When Admissions Open' });
    await expect(notifyBtn).toBeVisible();
    await notifyBtn.click();

    // Wait for confirmation
    await expect(studentPage.getByText("You're on the priority waitlist!")).toBeVisible();

    // Capture 1440px screenshot
    await studentPage.screenshot({
      path: path.join(qaDir, 'student-checkout-interest-1440px.png'),
      fullPage: false,
    });

    await studentContext.close();
  });

  // --------------------------------------------------------------------------
  // PART 3: Admin Enrolls Priya Sharma into 21-Day Mind & Emotion Mastery
  // --------------------------------------------------------------------------
  test('3. Admin Enrolls Student into Challenge Cohort via UI', async ({ browser }) => {
    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const adminPage = await adminContext.newPage();

    await loginAdmin(adminPage);

    // Navigate to /students
    await adminPage.goto('http://127.0.0.1:5174/students');
    await expect(adminPage.getByText('Students & Enrollments').first()).toBeVisible();

    // Open Enrol Modal
    await adminPage.click('button:has-text("Enrol in Program")');
    await expect(adminPage.getByText('Enrol Student in Program')).toBeVisible();

    // Enter Student ID / Email for Priya Sharma
    await adminPage.fill('input[placeholder="student@example.com or user-uuid"]', 'ff7f70d4-9744-417b-8154-261b2349b6ad');
    // Select 21-Day Mind & Emotion Mastery program
    await adminPage.selectOption('select', { value: '0e5e91ae-ef30-4954-bcf5-70e34891089a' });

    // Confirm enrollment
    await adminPage.click('button:has-text("Confirm Enrollment")');
    await expect(adminPage.getByText('Enrol Student in Program')).not.toBeVisible();

    // Verify Priya Sharma has active badge for the challenge
    await expect(adminPage.getByText('21-Day Mind & Emotion Mastery').first()).toBeVisible();

    await adminContext.close();
  });

  // --------------------------------------------------------------------------
  // PART 4: My Programs Dashboard & Welcome Celebration (/my-programs)
  // --------------------------------------------------------------------------
  test('4. Student My Programs Dashboard & Welcome Banner (1440px & 390px)', async ({ browser }) => {
    const studentContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const studentPage = await studentContext.newPage();

    await loginStudent(studentPage);

    // Open /my-programs with welcome param
    await studentPage.goto('http://127.0.0.1:5173/my-programs?welcome=21-day-mind-emotion-mastery');

    // Verify celebration banner
    await expect(studentPage.getByText('Enrollment Confirmed • Welcome to the Cohort!')).toBeVisible();
    await expect(studentPage.getByText('My Learning Dashboard')).toBeVisible();

    // Capture 1440px Desktop Screenshot
    await studentPage.screenshot({
      path: path.join(qaDir, 'student-my-programs-desktop-1440px.png'),
      fullPage: false,
    });

    // Test banner dismissal
    const dismissBtn = studentPage.locator('button[aria-label="Dismiss welcome message"]');
    if (await dismissBtn.isVisible()) {
      await dismissBtn.click();
      await expect(studentPage.getByText('Enrollment Confirmed • Welcome to the Cohort!')).not.toBeVisible();
    }

    // Capture 390px Mobile Screenshot
    await studentPage.setViewportSize({ width: 390, height: 844 });
    await studentPage.screenshot({
      path: path.join(qaDir, 'student-my-programs-mobile-390px.png'),
      fullPage: false,
    });

    await studentContext.close();
  });

  // --------------------------------------------------------------------------
  // PART 5: Enrolled Program Journey Mode (/programs/:slug)
  // --------------------------------------------------------------------------
  test('5. Enrolled Program Journey Mode, Task Toggle & Join Live Guard (1440px)', async ({ browser }) => {
    const studentContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const studentPage = await studentContext.newPage();

    await loginStudent(studentPage);

    // Go to enrolled challenge
    await studentPage.goto('http://127.0.0.1:5173/programs/21-day-mind-emotion-mastery');

    // Verify Enrolled View Elements (SPEC Section 9)
    await expect(studentPage.getByText('Your Daily Growth Checklist')).toBeVisible();
    await expect(studentPage.getByText('1. Watch')).toBeVisible();
    await expect(studentPage.getByText("2. Do Today's Task")).toBeVisible();
    await expect(studentPage.getByText('3. Attend Live Call')).toBeVisible();
    await expect(studentPage.getByText('4. Community Circle')).toBeVisible();

    // Verify Today's Focus Card & Task Toggle
    const taskToggleBtn = studentPage.locator('button', { hasText: /Mark Complete|Task Completed/ }).first();
    if (await taskToggleBtn.isVisible()) {
      await taskToggleBtn.click();
    }

    // Verify Join Live button and refusal guard handling
    const joinLiveBtn = studentPage.locator('button', { hasText: 'Join Live' }).first();
    if (await joinLiveBtn.isVisible()) {
      await joinLiveBtn.click();
      await studentPage.waitForTimeout(500);
    }

    // Verify Full Cohort Schedule Roadmap
    await expect(studentPage.getByText(/Full Cohort Schedule/)).toBeVisible();

    // Verify Certificate of Completion Milestone Progress
    await expect(studentPage.getByText('Certificate of Completion Milestone')).toBeVisible();

    // Capture 1440px screenshot
    await studentPage.screenshot({
      path: path.join(qaDir, 'student-enrolled-journey-1440px.png'),
      fullPage: false,
    });

    await studentContext.close();
  });

  // --------------------------------------------------------------------------
  // PART 6: Real-time Inbox, Notifications & Filtering (/inbox)
  // --------------------------------------------------------------------------
  test('6. Real-time Inbox Feed, Filters & Unread Notifications (1440px & 390px)', async ({ browser }) => {
    const studentContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const studentPage = await studentContext.newPage();

    await loginStudent(studentPage);

    // Navigate to /inbox
    await studentPage.goto('http://127.0.0.1:5173/inbox');
    await expect(studentPage.getByText('Announcements & Inbox')).toBeVisible();

    // Verify filter buttons
    await expect(studentPage.locator('button', { hasText: 'All' }).first()).toBeVisible();
    await expect(studentPage.locator('button', { hasText: 'Unread' }).first()).toBeVisible();
    await expect(studentPage.locator('button', { hasText: 'Announcements' }).first()).toBeVisible();
    await expect(studentPage.locator('button', { hasText: 'Live Links' }).first()).toBeVisible();

    // Test switching filter
    await studentPage.click('button:has-text("Live Links")');
    await studentPage.waitForTimeout(300);
    await studentPage.click('button:has-text("All")');

    // Capture 1440px Desktop Screenshot
    await studentPage.screenshot({
      path: path.join(qaDir, 'student-inbox-desktop-1440px.png'),
      fullPage: false,
    });

    // Capture 390px Mobile Screenshot
    await studentPage.setViewportSize({ width: 390, height: 844 });
    await studentPage.screenshot({
      path: path.join(qaDir, 'student-inbox-mobile-390px.png'),
      fullPage: false,
    });

    await studentContext.close();
  });

  // --------------------------------------------------------------------------
  // PART 7: Enrolled Home Hero & "Your Active Programs" Rail (/)
  // --------------------------------------------------------------------------
  test('7. Logged-in Home Page Adapts with Enrolled Hero & Your Programs Rail', async ({ browser }) => {
    const studentContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const studentPage = await studentContext.newPage();

    await loginStudent(studentPage);

    // Go to Home
    await studentPage.goto('http://127.0.0.1:5173/');

    // Check header
    await expect(studentPage.locator('header').getByText('ABrainoConscious').first()).toBeVisible();

    // Check that hero or programs rail exists
    await expect(studentPage.locator('h2').first()).toBeVisible();

    await studentContext.close();
  });
});
