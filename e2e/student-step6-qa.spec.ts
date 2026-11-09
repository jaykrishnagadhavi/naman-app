import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Step 6 Student App: Shell, Home, Library, Public Preview & Checkout', () => {
  test.describe.configure({ mode: 'serial' });

  test('1. Student shell & Desktop Home Page (1440px)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://127.0.0.1:5173/');

    // Header brand logo & navigation
    await expect(page.locator('header').getByText('ABrainoConscious').first()).toBeVisible();
    await expect(page.locator('header button', { hasText: 'Explore' })).toBeVisible();
    await expect(page.locator('header button', { hasText: 'My Programs' })).toBeVisible();
    await expect(page.locator('header button', { hasText: 'Community' })).toBeVisible();
    await expect(page.locator('header button', { hasText: 'Support' })).toBeVisible();
    await expect(page.locator('header button', { hasText: 'JOIN NOW' })).toBeVisible();

    // Notification bell empty state dropdown
    const bellBtn = page.locator('header button[aria-label="Notifications"]');
    await expect(bellBtn).toBeVisible();
    await bellBtn.click();
    await expect(page.getByText('No notifications right now.')).toBeVisible();
    await page.keyboard.press('Escape');

    // Streaming Hero Banner
    await expect(page.locator('h2').first()).toBeVisible();

    // Peterson Academy Trending Rail
    await expect(page.getByText('Trending Cohorts')).toBeVisible();

    // Stats Strip
    await expect(page.getByText('Active Students')).toBeVisible();

    // Capture 1440px Desktop Screenshot
    await page.screenshot({
      path: path.join(process.cwd(), 'docs/qa-step6/home-desktop-1440px.png'),
      fullPage: false,
    });
  });

  test('2. Student shell & Mobile Home Page (390px)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://127.0.0.1:5173/');

    // Mobile header
    await expect(page.locator('header').getByText('ABrainoConscious').first()).toBeVisible();

    // Mobile bottom navigation bar
    const mobileNav = page.locator('nav[aria-label="Mobile navigation"]');
    await expect(mobileNav).toBeVisible();
    await expect(mobileNav.locator('button', { hasText: 'Home' })).toBeVisible();
    await expect(mobileNav.locator('button', { hasText: 'Explore' })).toBeVisible();
    await expect(mobileNav.locator('button', { hasText: 'My Programs' })).toBeVisible();
    await expect(mobileNav.locator('button', { hasText: 'Inbox' })).toBeVisible();
    await expect(mobileNav.locator('button', { hasText: 'Login' })).toBeVisible();

    // Capture 390px Mobile Screenshot
    await page.screenshot({
      path: path.join(process.cwd(), 'docs/qa-step6/home-mobile-390px.png'),
      fullPage: false,
    });
  });

  test('3. Library Explore Page (1440px): Search, Category Chips & URL Sync', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://127.0.0.1:5173/explore');

    // Page title
    await expect(page.locator('h1')).toContainText('Explore Library');

    // Category chips
    await expect(page.locator('button', { hasText: 'All Programs' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Emotional Resilience' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Mental Clarity' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Academic Mastery' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Personal Momentum' })).toBeVisible();

    // Filter by Mental Clarity
    await page.click('button:has-text("Mental Clarity")');
    await page.waitForURL((url) => url.searchParams.get('category') === 'mental');
    expect(page.url()).toContain('category=mental');

    // Search input
    const searchInput = page.locator('input[placeholder*="Search challenges"]');
    await searchInput.fill('Mind');
    await page.waitForTimeout(400); // allow debounce to sync URL
    expect(page.url()).toContain('search=Mind');

    // View mode toggle
    const gridBtn = page.locator('button', { hasText: 'Grid' });
    await gridBtn.click();
    await page.waitForURL((url) => url.searchParams.get('view') === 'grid');

    // Capture 1440px Explore Screenshot
    await page.screenshot({
      path: path.join(process.cwd(), 'docs/qa-step6/explore-desktop-1440px.png'),
      fullPage: false,
    });
  });

  test('4. Library Explore Page (390px)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://127.0.0.1:5173/explore');

    await expect(page.locator('h1')).toContainText('Explore Library');
    await expect(page.locator('input[placeholder*="Search challenges"]')).toBeVisible();

    // Capture 390px Mobile Screenshot
    await page.screenshot({
      path: path.join(process.cwd(), 'docs/qa-step6/explore-mobile-390px.png'),
      fullPage: false,
    });
  });

  test('5. Public Program Preview Page (1440px): SEO, Schedule & Security Leak Check', async ({ page, context }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Security Assert: listen to all network traffic and assert no live_url or recording_url leaks
    const leakedUrls: string[] = [];
    page.on('response', async (res) => {
      try {
        const ct = res.headers()['content-type'] || '';
        if (ct.includes('application/json') || ct.includes('text/plain')) {
          const body = await res.text();
          if (body.includes('"live_url"') || body.includes('"recording_url"')) {
            leakedUrls.push(res.url());
          }
        }
      } catch {
        // Ignore streamed or cancelled responses
      }
    });

    await page.goto('http://127.0.0.1:5173/programs/21-day-mind-emotion-mastery');

    // Verify program title & badges
    await expect(page.locator('h1')).toContainText('21-Day Mind & Emotion Mastery');
    await expect(page.getByText('Mental Clarity').first()).toBeVisible();
    await expect(page.getByText('Live Cohort Challenge').first()).toBeVisible();

    // Daily Live Schedule should be rendered with day numbers and IST timing
    await expect(page.getByText('Daily Live Schedule')).toBeVisible();
    await expect(page.getByText('Day 1').first()).toBeVisible();
    await expect(page.getByText('Link Locked').first()).toBeVisible();

    // Instructor Section
    await expect(page.getByText('Your Instructor')).toBeVisible();
    await expect(page.getByText('Naman').first()).toBeVisible();

    // Sticky Join Card
    await expect(page.getByText('Enrollment Fee').first()).toBeVisible();
    await expect(page.getByText('₹4,999').first()).toBeVisible();
    await expect(page.getByText('7-Day 100% Money-Back Guarantee').first()).toBeVisible();

    // SEO checks
    const title = await page.title();
    expect(title).toContain('21-Day Mind & Emotion Mastery');

    const metaDesc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDesc).toBeTruthy();

    // JSON-LD validation
    const jsonLd = await page.locator('script[type="application/ld+json"]').innerText();
    const parsedJsonLd = JSON.parse(jsonLd);
    expect(parsedJsonLd.name).toBe('21-Day Mind & Emotion Mastery');

    // Share button
    await page.click('button[aria-label="Share program"]');
    await expect(page.getByText('Link Copied!')).toBeVisible();

    // Assert that protected links were never leaked
    expect(leakedUrls.length).toBe(0);

    // Capture 1440px Program Preview Screenshot
    await page.screenshot({
      path: path.join(process.cwd(), 'docs/qa-step6/program-preview-desktop-1440px.png'),
      fullPage: false,
    });
  });

  test('6. Public Program Preview Page (390px): Mobile Sticky Join Bar', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://127.0.0.1:5173/programs/21-day-mind-emotion-mastery');

    await expect(page.locator('h1')).toContainText('21-Day Mind & Emotion Mastery');

    // Mobile sticky bottom join bar
    const mobileBottomBar = page.locator('div.lg\\:hidden.fixed.bottom-14');
    await expect(mobileBottomBar).toBeVisible();
    await expect(mobileBottomBar.getByText('₹4,999')).toBeVisible();
    await expect(mobileBottomBar.locator('button')).toBeVisible();

    // Capture 390px Mobile Program Preview Screenshot
    await page.screenshot({
      path: path.join(process.cwd(), 'docs/qa-step6/program-preview-mobile-390px.png'),
      fullPage: false,
    });
  });

  test('7. Checkout Summary Page: Order Breakdown, Terms & Step 7 Notice', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Sign in first with confirmed student account
    await page.goto('http://127.0.0.1:5173/login?next=/checkout/21-day-mind-emotion-mastery');
    await page.fill('input[placeholder="you@domain.com"]', 'student.step6@gmail.com');
    await page.fill('input[placeholder="Your account password"]', 'Password123!');
    await page.click('button[type="submit"]:has-text("Sign In")');

    // Should redirect to checkout page
    await page.waitForURL((url) => url.pathname.includes('/checkout/21-day-mind-emotion-mastery'));

    // Checkout Summary Content
    await expect(page.locator('h1')).toContainText('Enrollment Order Summary');
    await expect(page.locator('h3:has-text("21-Day Mind & Emotion Mastery")')).toBeVisible();
    await expect(page.getByText('Priya Sharma')).toBeVisible();
    await expect(page.getByText('student.step6@gmail.com')).toBeVisible();

    // Price Breakdown
    await expect(page.getByText('Payment Breakdown')).toBeVisible();
    await expect(page.locator('span:has-text("₹4,999")').first()).toBeVisible();
    await expect(page.getByText('GST (Inclusive, 18%)')).toBeVisible();

    // Coupon code input
    const couponInput = page.locator('input[placeholder="Coupon code"]');
    await expect(couponInput).toBeVisible();
    await couponInput.fill('SAVE20');
    await page.click('button:has-text("Apply")');
    await expect(page.getByText('Coupon code entered. Dynamic discount calculations activate in Step 7')).toBeVisible();

    // Step 7 Dev Notice
    await expect(page.getByText('Step 7 Notice (Razorpay Integration)')).toBeVisible();

    // Terms checkbox enforces agreement before paying
    const payBtn = page.locator('button:has-text("PAY ₹4,999 VIA RAZORPAY")');
    await expect(payBtn).toBeDisabled();

    // Accept terms
    await page.check('#terms-check');
    await expect(payBtn).toBeEnabled();

    // Capture Desktop 1440px Screenshot
    await page.screenshot({
      path: path.join(process.cwd(), 'docs/qa-step6/checkout-desktop-1440px.png'),
      fullPage: false,
    });

    // Mobile Viewport for Checkout
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: path.join(process.cwd(), 'docs/qa-step6/checkout-mobile-390px.png'),
      fullPage: false,
    });
  });

  test('8. Draft or Unknown Program 404 Security Screen', async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/programs/secret-unreleased-cohort');
    await expect(page.getByText('Program Not Found')).toBeVisible();
    await expect(page.locator('button:has-text("Browse Available Programs")')).toBeVisible();
  });
});
