import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { Users } from '../fixtures/users';
import { ExpectedProducts } from '../fixtures/products';

test.describe('Inventory page functionality', () => {
  test.beforeEach(async ({ page }) => {
    console.log('🔷 Setting up test: Logging in as standard user');
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(Users.standard.username, Users.standard.password);
    await expect(page).toHaveURL('https://www.saucedemo.com/v1/inventory.html');
    console.log('✅ Login successful');
  });

  test('displays correct number of products', async ({ page }) => {
    console.log('🔷 TEST: Verifying correct number of products displayed');
    const inventoryPage = new InventoryPage(page);
    const productCount = await inventoryPage.getProductCount();
    console.log(`Found ${productCount} products on the page`);
    expect(productCount).toBe(6);
    console.log('✅ Product count verified: 6 products as expected');
  });

  test('sorts products correctly - A to Z', async ({ page }) => {
    console.log('🔷 TEST: Verifying A to Z sorting');
    const inventoryPage = new InventoryPage(page);
    
    console.log('Selecting "A to Z" sort option');
    await inventoryPage.sortBy('az');
    
    const productNames = await inventoryPage.getProductNames();
    console.log('Products in current order:', productNames);
    
    // Verify products are sorted alphabetically
    const sortedNames = [...productNames].sort();
    console.log('Expected alphabetical order:', sortedNames);
    
    expect(productNames).toEqual(sortedNames);
    console.log('✅ A to Z sorting verified successfully');
  });
  
  test('sorts products correctly - Z to A', async ({ page }) => {
    console.log('🔷 TEST: Verifying Z to A sorting');
    const inventoryPage = new InventoryPage(page);
    
    console.log('Selecting "Z to A" sort option');
    await inventoryPage.sortBy('za');
    
    const productNames = await inventoryPage.getProductNames();
    console.log('Products in current order:', productNames);
    
    // Verify products are sorted reverse alphabetically
    const sortedNames = [...productNames].sort().reverse();
    console.log('Expected reverse alphabetical order:', sortedNames);
    
    expect(productNames).toEqual(sortedNames);
    console.log('✅ Z to A sorting verified successfully');
  });

  test('sorts products correctly - low to high price', async ({ page }) => {
    console.log('🔷 TEST: Verifying low to high price sorting');
    const inventoryPage = new InventoryPage(page);
    
    console.log('Selecting "Price (low to high)" sort option');
    await inventoryPage.sortBy('lohi');
    
    const productPrices = await inventoryPage.getProductPrices();
    console.log('Products prices in current order:', productPrices);
    
    // Verify products are sorted by price ascending
    const sortedPrices = [...productPrices].sort((a, b) => a - b);
    console.log('Expected price order (ascending):', sortedPrices);
    
    expect(productPrices).toEqual(sortedPrices);
    console.log('✅ Low to high price sorting verified successfully');
  });

  test('sorts products correctly - high to low price', async ({ page }) => {
    console.log('🔷 TEST: Verifying high to low price sorting');
    const inventoryPage = new InventoryPage(page);
    
    console.log('Selecting "Price (high to low)" sort option');
    await inventoryPage.sortBy('hilo');
    
    const productPrices = await inventoryPage.getProductPrices();
    console.log('Products prices in current order:', productPrices);
    
    // Verify products are sorted by price descending
    const sortedPrices = [...productPrices].sort((a, b) => b - a);
    console.log('Expected price order (descending):', sortedPrices);
    
    expect(productPrices).toEqual(sortedPrices);
    console.log('✅ High to low price sorting verified successfully');
  });
  
  test('verifies all sorting options produce correct results', async ({ page }) => {
    console.log('🔷 TEST: Comprehensive sorting verification');
    const inventoryPage = new InventoryPage(page);
    
    // Test all sorting options in one test for an overview
    await test.step('A to Z sorting', async () => {
      console.log('📌 STEP: Testing A to Z sorting');
      await inventoryPage.sortBy('az');
      const names = await inventoryPage.getProductNames();
      console.log('Current product order:', names);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
      console.log('✅ A to Z sorting verified');
    });
    
    await test.step('Z to A sorting', async () => {
      console.log('📌 STEP: Testing Z to A sorting');
      await inventoryPage.sortBy('za');
      const names = await inventoryPage.getProductNames();
      console.log('Current product order:', names);
      const sortedNames = [...names].sort().reverse();
      expect(names).toEqual(sortedNames);
      console.log('✅ Z to A sorting verified');
    });
    
    await test.step('Low to high price sorting', async () => {
      console.log('📌 STEP: Testing low to high price sorting');
      await inventoryPage.sortBy('lohi');
      const prices = await inventoryPage.getProductPrices();
      console.log('Current price order:', prices);
      const sortedPrices = [...prices].sort((a, b) => a - b);
      expect(prices).toEqual(sortedPrices);
      console.log('✅ Low to high price sorting verified');
    });
    
    await test.step('High to low price sorting', async () => {
      console.log('📌 STEP: Testing high to low price sorting');
      await inventoryPage.sortBy('hilo');
      const prices = await inventoryPage.getProductPrices();
      console.log('Current price order:', prices);
      const sortedPrices = [...prices].sort((a, b) => b - a);
      expect(prices).toEqual(sortedPrices);
      console.log('✅ High to low price sorting verified');
    });
    
    console.log('✅ All sorting options verified successfully');
  });

  // You could also add tests for:
  // 1. Checking correct products show after sorting
  // 2. Testing that problem_user might have sorting issues
  // 3. Testing performance for performance_glitch_user during sorting
}); 