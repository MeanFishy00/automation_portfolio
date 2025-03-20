import { test, expect } from '@playwright/test';

// Common test data
const USERS = {
  standard: { username: 'standard_user', password: 'secret_sauce' },
  problem: { username: 'problem_user', password: 'secret_sauce' },
  performance: { username: 'performance_glitch_user', password: 'secret_sauce' }
};

// Setup for all tests
test.beforeEach(async ({ page }) => {
  console.log('🔷 Setting up test: Navigating to login page');
  await page.goto('https://www.saucedemo.com/v1/index.html', { timeout: 60000 });
});

// Helper functions to reduce code duplication
async function loginAs(page, userType = 'standard') {
  console.log(`Logging in as ${userType} user`);
  const user = USERS[userType];
  await page.getByPlaceholder('Username').fill(user.username);
  await page.getByPlaceholder('Password').fill(user.password);
  await page.locator('#login-button').click({ timeout: 45000 });
  await expect(page).toHaveURL('https://www.saucedemo.com/v1/inventory.html', { timeout: 45000 });
  console.log('✅ Login successful');
}

test.describe('Cart functionality tests', () => {
  test.setTimeout(60000);
  
  test('add single item to cart and remove it', async ({ page }) => {
    console.log('🔷 TEST: Adding a single item to cart and removing it');
    
    // Login with reusable function
    await loginAs(page, 'standard');
    
    // Verify cart is empty initially
    const cartBadge = page.locator('.shopping_cart_badge');
    await expect(cartBadge).not.toBeVisible();
    console.log('✅ Verified cart is initially empty');
    
    // Get the first product name for verification
    const firstProductName = await page.locator('.inventory_item_name').first().textContent();
    console.log(`Selected product: "${firstProductName}"`);
    
    // Add first item to cart with better error handling
    console.log('Adding item to cart');
    try {
      const firstAddButton = page.locator('.btn_primary.btn_inventory').first();
      await firstAddButton.click();
      
      // Verify cart badge updated
      await expect(cartBadge).toBeVisible({ timeout: 5000 });
      await expect(cartBadge).toHaveText('1');
      console.log('✅ Verified cart badge shows 1 item');
      
      // Verify button text changed to REMOVE
      await expect(page.locator('.btn_secondary.btn_inventory').first()).toBeVisible();
      const removeButton = page.locator('.btn_secondary.btn_inventory').first();
      const buttonText = await removeButton.textContent();
      console.log(`Button text changed to: ${buttonText}`);
      expect(buttonText).toContain('REMOVE');
      
      // Remove item from cart
      console.log('Removing item from cart');
      await removeButton.click();
      
      // Verify cart badge disappeared
      await expect(cartBadge).not.toBeVisible({ timeout: 5000 });
      console.log('✅ Verified cart is empty after removal');
      
      // Verify button changed back to ADD TO CART
      await expect(page.locator('.btn_primary.btn_inventory').first()).toBeVisible();
      console.log('✅ Button changed back to ADD TO CART');
    } catch (error) {
      console.error(`❌ Error during cart operation: ${error.message}`);
      // Take screenshot on failure for debugging
      await page.screenshot({ path: `error-single-item-${Date.now()}.png` });
      throw error;
    }
  });
  
  test('add multiple items to cart', async ({ page }) => {
    console.log('🔷 TEST: Adding multiple items to cart');
    
    // Login with reusable function
    await loginAs(page, 'standard');
    
    // Verify cart is empty initially
    const cartBadge = page.locator('.shopping_cart_badge');
    await expect(cartBadge).not.toBeVisible();
    console.log('✅ Verified cart is initially empty');
    
    try {
      // Get inventory items with explicit wait for page load
      await page.waitForSelector('.inventory_item', { timeout: 10000 });
      const inventoryItems = page.locator('.inventory_item');
      const itemCount = await inventoryItems.count();
      console.log(`Found ${itemCount} items that can be added to cart`);
      
      // Add items one by one and verify cart badge
      for (let i = 0; i < itemCount; i++) {
        // Get each item individually to ensure we're working with fresh DOM state
        const currentItem = page.locator('.inventory_item').nth(i);
        const productName = await currentItem.locator('.inventory_item_name').textContent();
        console.log(`Adding product ${i+1}/${itemCount}: "${productName}"`);
        
        // Get the specific add button for this item and ensure it's visible
        const addButton = currentItem.locator('.btn_primary.btn_inventory');
        await addButton.waitFor({ state: 'visible', timeout: 5000 });
        
        // Add debugging info
        console.log(`  Button text: "${await addButton.textContent()}"`);
        console.log(`  Button visible: ${await addButton.isVisible()}`);
        
        try {
          await addButton.click({ timeout: 5000 });
          console.log(`  Successfully clicked button for "${productName}"`);
        } catch (error) {
          console.error(`  Failed to click button for "${productName}": ${error.message}`);
          
          // Try force click as fallback
          console.log(`  Attempting force click as fallback...`);
          await addButton.click({ force: true, timeout: 5000 });
        }
        
        // Verify cart badge updated with retry logic
        await expect(async () => {
          const text = await cartBadge.textContent();
          expect(text).toBe(`${i+1}`);
        }).toPass({ timeout: 5000 });
        
        console.log(`✅ Verified cart badge shows ${i+1} item(s)`);
      }
      
      // Now remove items one by one
      console.log('Now removing items one by one');
      
      for (let i = itemCount - 1; i >= 0; i--) {
        // Get each item individually to ensure we're working with fresh DOM state
        const currentItem = page.locator('.inventory_item').nth(i);
        const productName = await currentItem.locator('.inventory_item_name').textContent();
        console.log(`Removing product ${itemCount-i}/${itemCount}: "${productName}"`);
        
        // Get the specific remove button for this item
        const removeButton = currentItem.locator('.btn_secondary.btn_inventory');
        await removeButton.waitFor({ state: 'visible', timeout: 5000 });
        
        try {
          await removeButton.click({ timeout: 5000 });
        } catch (error) {
          console.error(`Failed to click remove button: ${error.message}`);
          await removeButton.click({ force: true, timeout: 5000 });
        }
        
        // Verify cart badge updated with improved handling
        if (i > 0) {
          await expect(async () => {
            const text = await cartBadge.textContent();
            expect(text).toBe(`${i}`);
          }).toPass({ timeout: 5000 });
          console.log(`✅ Verified cart badge shows ${i} item(s)`);
        } else {
          await expect(cartBadge).not.toBeVisible({ timeout: 5000 });
          console.log('✅ Verified cart is empty after removing all items');
        }
      }
    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`);
      await page.screenshot({ path: `error-multiple-items-${Date.now()}.png` });
      throw error;
    }
  });
  
  test('verify cart contents match added items', async ({ page }) => {
    console.log('🔷 TEST: Verifying cart contents match added items');
    
    // Login with reusable function
    await loginAs(page, 'standard');
    
    try {
      // Select specific items to add (first and last)
      await page.waitForSelector('.inventory_item', { timeout: 10000 });
      const firstProductName = await page.locator('.inventory_item_name').first().textContent();
      const lastProductName = await page.locator('.inventory_item_name').last().textContent();
      
      console.log(`Adding first product: "${firstProductName}"`);
      await page.locator('.btn_primary.btn_inventory').first().click();
      
      console.log(`Adding last product: "${lastProductName}"`);
      await page.locator('.btn_primary.btn_inventory').last().click();
      
      // Take a screenshot of items in cart for visual verification
      await page.screenshot({ path: 'items-added-to-cart.png' });
      
      // Verify cart badge shows 2 items
      await expect(page.locator('.shopping_cart_badge')).toHaveText('2');
      console.log('✅ Verified cart badge shows 2 items');
      
      // Navigate to cart
      console.log('Navigating to cart page');
      await page.locator('.shopping_cart_link').click();
      await expect(page).toHaveURL('https://www.saucedemo.com/v1/cart.html');
      
      // Verify cart contents with more detailed logging
      const cartItems = page.locator('.cart_item');
      await expect(cartItems).toHaveCount(2);
      console.log('✅ Verified cart has 2 items');
      
      // Get detailed item information
      const cartItemNames = await page.locator('.inventory_item_name').allTextContents();
      const cartItemPrices = await page.locator('.inventory_item_price').allTextContents();
      
      console.log('Cart contents:');
      for (let i = 0; i < cartItemNames.length; i++) {
        console.log(`  ${i+1}. ${cartItemNames[i]} - ${cartItemPrices[i]}`);
      }
      
      // Verify correct items are in cart
      expect(cartItemNames).toContain(firstProductName);
      expect(cartItemNames).toContain(lastProductName);
      console.log('✅ Verified cart items match the products we added');
      
      // Remove an item from the cart
      console.log('Removing one item from cart');
      await page.locator('.btn_secondary.cart_button').first().click();
      
      // Verify one item was removed with retry logic
      await expect(async () => {
        const count = await cartItems.count();
        expect(count).toBe(1);
      }).toPass({ timeout: 5000 });
      console.log('✅ Verified cart has 1 item after removal');
      
      // Continue shopping
      console.log('Clicking Continue Shopping button');
      await page.getByText('Continue Shopping').click();
      await expect(page).toHaveURL('https://www.saucedemo.com/v1/inventory.html');
      
      // Verify cart badge shows 1
      await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
      console.log('✅ Verified cart badge still shows 1 item after returning to inventory');
    } catch (error) {
      console.error(`❌ Cart verification failed: ${error.message}`);
      await page.screenshot({ path: `cart-verification-error-${Date.now()}.png` });
      throw error;
    }
  });
});

  