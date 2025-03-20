import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { Users } from '../../fixtures/users';

test.describe('Login functionality', () => {
  test('standard user can login successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    await expect(page).toHaveTitle(/Swag Labs/);
    await loginPage.login(Users.standard.username, Users.standard.password);
    
    // Verify redirect to inventory page
    await expect(page).toHaveURL('https://www.saucedemo.com/v1/inventory.html');
  });

  test('locked out user cannot login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    await loginPage.login(Users.locked.username, Users.locked.password);
    
    // Verify error message
    await expect(loginPage.errorButton).toBeVisible();
    const errorText = await loginPage.getErrorMessage();
    expect(errorText).toContain('Sorry, this user has been locked out');
    
    // Verify no redirect
    await expect(page).not.toHaveURL('https://www.saucedemo.com/v1/inventory.html');
  });

  test('problem user can login but may have UI issues', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    await expect(page).toHaveTitle(/Swag Labs/);
    await loginPage.login(Users.problem.username, Users.problem.password);
    
    // Should redirect to inventory page despite potential issues
    await expect(page).toHaveURL('https://www.saucedemo.com/v1/inventory.html');
    
    // Verify we're on the inventory page
    const inventoryPage = new InventoryPage(page);
    // Basic existence check for inventory page
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  test('performance glitch user experiences delayed login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    await expect(page).toHaveTitle(/Swag Labs/);
    
    // Start timing
    const startTime = Date.now();
    
    await loginPage.login(Users.performance.username, Users.performance.password);
    
    // Should eventually redirect to inventory page
    await expect(page).toHaveURL('https://www.saucedemo.com/v1/inventory.html');
    
    const endTime = Date.now();
    const loginTime = endTime - startTime;
    
    // Log the login time for analysis
    console.log(`Performance glitch user login took ${loginTime}ms`);
    
    // Optional: Add an assertion if you know the expected delay range
    // expect(loginTime).toBeGreaterThan(1000); // Example: Expect at least 1 second delay
  });

  // Add more login tests...
}); 