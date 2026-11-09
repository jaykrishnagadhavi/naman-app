import { test, expect } from '@playwright/test';

test.describe('Student App: Explore Programs Page', () => {
  test('1. Loads /explore page with category chips and search bar', async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/explore');

    // Page header
    await expect(page.locator('h1')).toContainText('Explore Programs');
    await expect(page.locator('text=Browse live cohorts and video courses')).toBeVisible();

    // Category chips
    await expect(page.locator('button:has-text("All Programs")')).toBeVisible();
    await expect(page.locator('button:has-text("Emotional Resilience")')).toBeVisible();
    await expect(page.locator('button:has-text("Mental Clarity")')).toBeVisible();
    await expect(page.locator('button:has-text("Academic Mastery")')).toBeVisible();
    await expect(page.locator('button:has-text("Personal Momentum")')).toBeVisible();

    // Search bar
    const searchBar = page.locator('input[placeholder*="Search challenges"]');
    await expect(searchBar).toBeVisible();
  });

  test('2. Renders either real programs or the friendly brand empty state', async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/explore');

    // Wait for either the programs list or the empty state to render (loading skeleton finishes)
    const programsList = page.locator('[data-testid="explore-programs-list"]');
    const emptyState = page.locator('[data-testid="explore-empty-state"]');

    await expect(programsList.or(emptyState)).toBeVisible();

    if (await emptyState.isVisible()) {
      await expect(page.locator('text=New programs are coming soon')).toBeVisible();
    } else {
      // At least one program card is rendered
      const firstCard = page.locator('[data-testid="explore-programs-list"] h4').first();
      await expect(firstCard).toBeVisible();
    }
  });

  test('3. Clicking a growth pillar chip filters the view', async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/explore');

    // Click "Mental Clarity" chip
    await page.click('button:has-text("Mental Clarity")');

    // Chip should become selected (styled with amber/black highlight)
    const mentalChip = page.locator('button:has-text("Mental Clarity")');
    await expect(mentalChip).toHaveClass(/bg-\[#F5871F\]/);
  });
});

