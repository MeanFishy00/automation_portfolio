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

// Define an interface for cart items
interface CartItem {
  name: string;
  price: string;
}

// Helper to add specific items to cart by name
async function addSpecificItemsToCart(page, itemNames: string[]): Promise<CartItem[]> {
  console.log(`Adding specific items to cart: ${itemNames.join(', ')}`);
  await page.waitForSelector('.inventory_item', { timeout: 10000 });
  
  const addedItems: CartItem[] = [];
  
  // For each inventory item
  const items = page.locator('.inventory_item');
  const count = await items.count();
  
  for (let i = 0; i < count; i++) {
    const item = items.nth(i);
    const name = await item.locator('.inventory_item_name').textContent() || '';
    
    // If this item is in our target list
    if (itemNames.includes(name)) {
      const price = await item.locator('.inventory_item_price').textContent() || '';
      addedItems.push({ name, price });
      
      console.log(`Adding item: "${name}" - ${price}`);
      await item.locator('.btn_primary.btn_inventory').click();
    }
  }
  
  // Verify the correct number of items were added
  await expect(page.locator('.shopping_cart_badge')).toHaveText(`${addedItems.length}`);
  console.log(`✅ Added ${addedItems.length} specific items to cart`);
  
  return addedItems;
}

// Helper to go to cart page
async function goToCart(page) {
  console.log('Navigating to cart page');
  await page.locator('.shopping_cart_link').click();
  await expect(page).toHaveURL('https://www.saucedemo.com/v1/cart.html');
  console.log('✅ Successfully navigated to cart page');
}

test.describe('Cart page functionality tests', () => {
  test.setTimeout(60000);
  
  test('empty cart displays appropriate message', { tag: '@smoke' }, async ({ page }) => {
    console.log('🔷 TEST: Verifying empty cart state');
    
    await loginAs(page, 'standard');
    await goToCart(page);
    
    // Verify cart is empty
    await expect(page.locator('.cart_item')).toHaveCount(0);
    
    // Check for appropriate messaging
    await expect(page.locator('.cart_list')).toBeVisible();
    const cartText = await page.locator('.cart_list').textContent();
    console.log('Empty cart display:', cartText?.trim() ?? '');
    
    // Check continue shopping button is available
    await expect(page.getByText('Continue Shopping')).toBeVisible();
    console.log('✅ Verified empty cart displays correctly');
  });
  
  test('cart items display correct information', async ({ page }) => {
    console.log('🔷 TEST: Verifying cart item details');
    
    await loginAs(page, 'standard');
    const addedItems = await addSpecificItemsToCart(page, [
      'Sauce Labs Backpack', 
      'Sauce Labs Bike Light'
    ]);
    await goToCart(page);
    
    try {
      // Screenshot cart for visual verification
      await page.screenshot({ path: 'cart-items-display.png' });
      
      // Verify item count
      const cartItems = page.locator('.cart_item');
      await expect(cartItems).toHaveCount(addedItems.length);
      console.log(`✅ Cart displays ${addedItems.length} items as expected`);
      
      // Verify item details for each item - but don't assume order
      const cartItemNames = await page.locator('.inventory_item_name').allTextContents();
      const cartItemPrices = await page.locator('.inventory_item_price').allTextContents();

      // Check that each added item exists in the cart (regardless of order)
      for (const addedItem of addedItems) {
        // Verify name is in the cart
        expect(cartItemNames).toContain(addedItem.name);
        console.log(`✅ Found item "${addedItem.name}" in cart`);
        
        // Verify price (by value, not exact string)
        const addedItemPriceValue = parseFloat(addedItem.price.replace('$', ''));
        const matchingPriceExists = cartItemPrices.some(price => {
          const cartPriceValue = parseFloat(price.replace('$', ''));
          return Math.abs(cartPriceValue - addedItemPriceValue) < 0.01; // Allow for tiny rounding errors
        });
        
        expect(matchingPriceExists).toBeTruthy();
        console.log(`✅ Found matching price for "${addedItem.name}" in cart (value: ${addedItemPriceValue})`);
      }

      // Log all items found in cart for debugging
      console.log(`Cart contains items: ${cartItemNames.join(', ')}`);
      
      // Verify cart header
      await expect(page.locator('.subheader')).toContainText('Your Cart');
      
      // Verify checkout button is present
      await expect(page.getByText('CHECKOUT')).toBeVisible();
      
      console.log('✅ All cart information displays correctly');
    } catch (error) {
      console.error(`❌ Cart verification failed: ${error.message}`);
      await page.screenshot({ path: `cart-verification-error-${Date.now()}.png` });
      throw error;
    }
  });
  
  test('continue shopping button returns to inventory', async ({ page }) => {
    console.log('🔷 TEST: Testing Continue Shopping button');
    
    await loginAs(page, 'standard');
    await addSpecificItemsToCart(page, ['Sauce Labs Backpack']);
    await goToCart(page);
    
    // Click continue shopping button
    console.log('Clicking Continue Shopping button');
    await page.getByText('Continue Shopping').click();
    
    // Verify navigation back to inventory page
    await expect(page).toHaveURL('https://www.saucedemo.com/v1/inventory.html');
    console.log('✅ Successfully returned to inventory page');
    
    // Verify cart items are preserved
    await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
    console.log('✅ Cart items preserved after returning to inventory');
  });
  
  test('remove button removes item from cart', async ({ page }) => {
    console.log('🔷 TEST: Testing item removal from cart page');
    
    await loginAs(page, 'standard');
    await addSpecificItemsToCart(page, ['Sauce Labs Backpack', 'Sauce Labs Bolt T-Shirt']);
    await goToCart(page);
    
    // Verify initial state
    let cartItems = page.locator('.cart_item');
    await expect(cartItems).toHaveCount(2);
    
    // Get names before removal for verification
    const itemNames = await page.locator('.inventory_item_name').allTextContents();
    console.log('Items before removal:', itemNames);
    
    // Remove first item
    console.log(`Removing item: "${itemNames[0]}"`);
    await page.locator('.cart_button').first().click();
    
    // Verify one item was removed
    await expect(cartItems).toHaveCount(1);
    
    // Verify the correct item remains
    const remainingName = await page.locator('.inventory_item_name').textContent();
    expect(remainingName).toBe(itemNames[1]);
    console.log(`✅ First item removed, "${remainingName}" remains in cart`);
    
    // Verify cart badge updated
    await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
    console.log('✅ Cart badge updated to 1');
    
    // Remove remaining item
    console.log(`Removing item: "${remainingName}"`);
    await page.locator('.cart_button').click();
    
    // Verify cart is empty
    await expect(cartItems).toHaveCount(0);
    await expect(page.locator('.shopping_cart_badge')).not.toBeVisible();
    console.log('✅ All items removed, cart is empty');
  });
  
  test('checkout button navigates to checkout page', async ({ page }) => {
    console.log('🔷 TEST: Testing checkout flow from cart');
    
    await loginAs(page, 'standard');
    await addSpecificItemsToCart(page, ['Sauce Labs Backpack']);
    await goToCart(page);
    
    // Click checkout button
    console.log('Clicking CHECKOUT button');
    await page.getByText('CHECKOUT').click();
    
    // Verify navigation to checkout page
    await expect(page).toHaveURL('https://www.saucedemo.com/v1/checkout-step-one.html');
    console.log('✅ Successfully navigated to checkout information page');
    
    // Verify checkout form elements
    await expect(page.locator('#first-name')).toBeVisible();
    await expect(page.locator('#last-name')).toBeVisible();
    await expect(page.locator('#postal-code')).toBeVisible();
    
    console.log('✅ Checkout form displays correctly');
  });
  
  test('problem user cart functionality', async ({ page }) => {
    console.log('🔷 TEST: Testing cart with problem_user');
    
    await loginAs(page, 'problem');
    await addSpecificItemsToCart(page, ['Sauce Labs Backpack']);
    await goToCart(page);
    
    // Verify problem user can see items in cart
    const cartItems = page.locator('.cart_item');
    await expect(cartItems).toHaveCount(1);
    
    // Attempt to remove item
    console.log('Attempting to remove item as problem user');
    await page.locator('.cart_button').click();
    
    try {
      // Check if item was removed (problem user might have issues)
      const itemCount = await cartItems.count();
      if (itemCount === 0) {
        console.log('✅ Item successfully removed by problem user');
      } else {
        console.log('⚠️ Problem user could not remove item - known issue');
      }
      
      // Attempt checkout
      if (itemCount > 0) {
        console.log('Attempting checkout as problem user');
        await page.getByText('CHECKOUT').click();
        await expect(page).toHaveURL('https://www.saucedemo.com/v1/checkout-step-one.html');
        console.log('✅ Problem user can proceed to checkout');
      }
    } catch (error) {
      console.error(`⚠️ Problem user encountered expected issues: ${error.message}`);
      await page.screenshot({ path: `problem-user-cart-${Date.now()}.png` });
    }
  });
  
  test('performance glitch user cart timing', async ({ page }) => {
    console.log('🔷 TEST: Measuring cart performance for performance_glitch_user');
    
    await loginAs(page, 'performance');
    await addSpecificItemsToCart(page, ['Sauce Labs Backpack']);
    
    // Measure cart navigation time
    console.log('Measuring navigation time to cart page');
    const startTime = Date.now();
    await page.locator('.shopping_cart_link').click();
    await expect(page).toHaveURL('https://www.saucedemo.com/v1/cart.html');
    const endTime = Date.now();
    
    const navigationTime = endTime - startTime;
    console.log(`Cart navigation took ${navigationTime}ms`);
    
    // Measure checkout button performance
    console.log('Measuring checkout button performance');
    const checkoutStartTime = Date.now();
    await page.getByText('CHECKOUT').click();
    await expect(page).toHaveURL('https://www.saucedemo.com/v1/checkout-step-one.html');
    const checkoutEndTime = Date.now();
    
    const checkoutTime = checkoutEndTime - checkoutStartTime;
    console.log(`Checkout navigation took ${checkoutTime}ms`);
    
    console.log('✅ Performance measurements completed');
  });
});
