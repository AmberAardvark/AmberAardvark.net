import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page title contains the site name
    await expect(page).toHaveTitle(/Amber Aardvark/);
  });

  test('should have main navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check for navigation links
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'About' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Services' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Blog' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contact' })).toBeVisible();
  });

  test('should have hero section', async ({ page }) => {
    await page.goto('/');
    
    // Check for hero content
    await expect(page.locator('h2:has-text("Discover the Power of Your Data")')).toBeVisible();
  });

  test('Contact Us button should work', async ({ page }) => {
    await page.goto('/');
    
    // Find and click the "Contact Us" button
    const contactButton = page.getByRole('link', { name: 'Contact Us' }).first();
    await contactButton.click();
    
    // Wait for navigation and check URL
    await expect(page).toHaveURL(/.*contact/);
  });
});

test.describe('Contact Page', () => {
  test('should load contact page', async ({ page }) => {
    await page.goto('/contact');
    
    await expect(page).toHaveTitle(/Contact.*Amber Aardvark/);
  });
});

test.describe('Services Page', () => {
  test('should load services page', async ({ page }) => {
    await page.goto('/services');
    
    await expect(page).toHaveTitle(/Services.*Amber Aardvark/);
  });

  test('should have service sections with anchors', async ({ page }) => {
    await page.goto('/services');
    
    // Check that we can navigate to service section anchors
    await page.goto('/services#data-engineering');
    await expect(page).toHaveURL(/.*#data-engineering/);
  });
});
