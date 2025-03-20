import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.goto('https://www.saucedemo.com/v1/index.html', { timeout: 60000 });
  });

const standard_user = 'standard_user';
const problem_user = 'problem_user';
const performance_glitch_user = 'performance_glitch_user';

const password = 'secret_sauce';

async function verifyProducts(page, userType) {
  console.log(`=== ${userType.toUpperCase()} PRODUCTS ===`);
  const items = await page.locator('div.inventory_item');
  await expect(items).toHaveCount(6);
  
  const count = await items.count();
  for (let i = 0; i < count; i++) {
    const item = items.nth(i);
    const name = await item.locator('.inventory_item_name').textContent();
    const description = await item.locator('.inventory_item_desc').textContent();
    const price = await item.locator('.inventory_item_price').textContent();
    const imageSrc = await item.locator('img').getAttribute('src');
    
    console.log('Product:', name);
    console.log('Description:', description);
    console.log('Price:', price);
    console.log('Image:', imageSrc);
    console.log('-------------------');
  }
  return items;
}

test.describe('User product tests', () => {
    test.setTimeout(60000);
    
    test('standard user can view products correctly', async ({ page }) => {
      await expect(page).toHaveTitle(/Swag Labs/);
      
      await page.getByPlaceholder('Username').fill(standard_user);
      await page.getByPlaceholder('Password').fill(password);
      
      await page.locator('#login-button').click({ timeout: 45000 });
      
      await expect(page).toHaveURL('https://www.saucedemo.com/v1/inventory.html', { timeout: 45000 });

      const expectedProducts = [
        { name: 'Sauce Labs Backpack', price: '$29.99' },
        { name: 'Sauce Labs Bike Light', price: '$9.99' },
        { name: 'Sauce Labs Bolt T-Shirt', price: '$15.99' },
        { name: 'Sauce Labs Fleece Jacket', price: '$49.99' },
        { name: 'Sauce Labs Onesie', price: '$7.99' },
        { name: 'Test.allTheThings() T-Shirt (Red)', price: '$15.99' }
      ];
      
      const items = await verifyProducts(page, 'standard user');
      
      const count = await items.count();
      for (let i = 0; i < count; i++) {
        const name = await items.nth(i).locator('.inventory_item_name').textContent();
        const price = await items.nth(i).locator('.inventory_item_price').textContent();
        
        expect(name).toBe(expectedProducts[i].name);
        expect(price).toBe(expectedProducts[i].price);
      }
    });
    
    test('problem user sees product issues', async ({ page }) => {
      await expect(page).toHaveTitle(/Swag Labs/);
      
      await page.getByPlaceholder('Username').fill(problem_user);
      await page.getByPlaceholder('Password').fill(password);
      await page.getByRole('button', { name: 'Login' }).click();
      await expect(page).toHaveURL('https://www.saucedemo.com/v1/inventory.html');

      let items = await page.locator('div.inventory_item');
      await expect(items).toHaveCount(6);
      
      console.log('=== PROBLEM USER PRODUCTS ===');
      // Get details for each inventory item with associated images
      const count = await items.count();
      for (let i = 0; i < count; i++) {
        const item = items.nth(i);
        const name = await item.locator('.inventory_item_name').textContent();
        const description = await item.locator('.inventory_item_desc').textContent();
        const price = await item.locator('.inventory_item_price').textContent();
        const imageSrc = await item.locator('img').getAttribute('src');
        
        console.log('Product:', name);
        console.log('Description:', description);
        console.log('Price:', price);
        console.log('Image:', imageSrc);
        console.log('-------------------');
      }
    });
    
    test('performance glitch user product loading', async ({ page }) => {
      await expect(page).toHaveTitle(/Swag Labs/);
      
      await page.getByPlaceholder('Username').fill(performance_glitch_user);
      await page.getByPlaceholder('Password').fill(password);
      
      // Start timing for login
      const loginStartTime = Date.now();
      await page.getByRole('button', { name: 'Login' }).click();
      await expect(page).toHaveURL('https://www.saucedemo.com/v1/inventory.html');
      const loginEndTime = Date.now();
      console.log(`Performance glitch user login took ${loginEndTime - loginStartTime}ms`);

      // Start timing for product load
      const productStartTime = Date.now();
      let items = await page.locator('div.inventory_item');
      await expect(items).toHaveCount(6);
      const productEndTime = Date.now();
      console.log(`Performance glitch user product load took ${productEndTime - productStartTime}ms`);
      
      console.log('=== PERFORMANCE GLITCH USER PRODUCTS ===');
      // Get details for each inventory item with associated images
      const count = await items.count();
      for (let i = 0; i < count; i++) {
        const item = items.nth(i);
        const name = await item.locator('.inventory_item_name').textContent();
        const description = await item.locator('.inventory_item_desc').textContent();
        const price = await item.locator('.inventory_item_price').textContent();
        const imageSrc = await item.locator('img').getAttribute('src');
        
        console.log('Product:', name);
        console.log('Description:', description);
        console.log('Price:', price);
        console.log('Image:', imageSrc);
        console.log('-------------------');
      }

      // Set a threshold for performance
      expect(loginEndTime - loginStartTime).toBeGreaterThan(1000); // Expect delay
    });
    test('product data matches across users except for known issues', async ({ page }) => {
      // Create a function to get product data for a specific user
      async function getProductDataForUser(username) {
        // Login with the specified user
        await page.goto('https://www.saucedemo.com/v1/index.html', { timeout: 60000 });
        await page.getByPlaceholder('Username').fill(username);
        await page.getByPlaceholder('Password').fill(password);
        await page.locator('#login-button').click({ timeout: 45000 });
        await expect(page).toHaveURL('https://www.saucedemo.com/v1/inventory.html', { timeout: 45000 });
        
        // Get all product items
        const items = await page.locator('div.inventory_item').all();
        
        // Extract detailed product data
        const products = await Promise.all(items.map(async (item) => ({
          name: await item.locator('.inventory_item_name').textContent(),
          description: await item.locator('.inventory_item_desc').textContent(),
          price: await item.locator('.inventory_item_price').textContent(),
          imageSrc: await item.locator('img').getAttribute('src')
        })));
        
        console.log(`Found ${products.length} products for ${username}`);
        return products;
      }
      
      // Collect product data for each user type
      const standardUserProducts = await test.step('Get standard user products', async () => {
        return await getProductDataForUser(standard_user);
      });
      
      const problemUserProducts = await test.step('Get problem user products', async () => {
        return await getProductDataForUser(problem_user);
      });
      
      const performanceGlitchUserProducts = await test.step('Get performance glitch user products', async () => {
        return await getProductDataForUser(performance_glitch_user);
      });
      
      // Verify product data - text content should match between standard and performance glitch users
      await test.step('Compare standard and performance glitch user products', async () => {
        for (let i = 0; i < standardUserProducts.length; i++) {
          expect(performanceGlitchUserProducts[i].name).toBe(standardUserProducts[i].name);
          expect(performanceGlitchUserProducts[i].description).toBe(standardUserProducts[i].description);
          expect(performanceGlitchUserProducts[i].price).toBe(standardUserProducts[i].price);
          // Images should also match
          expect(performanceGlitchUserProducts[i].imageSrc).toBe(standardUserProducts[i].imageSrc);
        }
      });
      
      // Verify problem user - text content should match but images will be different
      await test.step('Verify problem user product issues', async () => {
        // Text content should match standard user
        for (let i = 0; i < standardUserProducts.length; i++) {
          expect(problemUserProducts[i].name).toBe(standardUserProducts[i].name);
          expect(problemUserProducts[i].description).toBe(standardUserProducts[i].description);
          expect(problemUserProducts[i].price).toBe(standardUserProducts[i].price);
        }
        
        // Check for image issues - collect all image sources
        const standardImageSrcs = standardUserProducts.map(p => p.imageSrc);
        const problemImageSrcs = problemUserProducts.map(p => p.imageSrc);
        
        // Verify all problem user images are the same (or at least different from standard)
        const uniqueProblemImages = new Set(problemImageSrcs);
        console.log(`Problem user has ${uniqueProblemImages.size} unique images for ${problemImageSrcs.length} products`);
        
        // Log detailed comparison of each product's images
        console.log('\n===== DETAILED IMAGE COMPARISON =====');
        console.log('Format: [Product Name] - Standard User Image | Problem User Image');
        console.log('-------------------------------------------------------');
        
        let mismatchCount = 0;
        for (let i = 0; i < standardUserProducts.length; i++) {
          const productName = standardUserProducts[i].name;
          const standardImg = standardImageSrcs[i];
          const problemImg = problemImageSrcs[i];
          
          if (standardImg !== problemImg) {
            mismatchCount++;
            console.log(`❌ MISMATCH #${mismatchCount}: "${productName}"`);
            console.log(`   Standard: ${standardImg}`);
            console.log(`   Problem:  ${problemImg}`);
            console.log('   -------------------------------------------------------');
          } else {
            console.log(`✅ Match: "${productName}"`);
            console.log(`   Both: ${standardImg}`);
            console.log('   -------------------------------------------------------');
          }
        }
        
        console.log(`\n📊 SUMMARY: Found ${mismatchCount} image mismatches out of ${standardUserProducts.length} products`);
        
        // Either all images are the same, or they're different from standard user
        if (uniqueProblemImages.size === 1) {
          console.log('All problem user images are the same - known issue confirmed');
          // Log the single image that's used for all products
          console.log(`Single image used for all products: ${problemImageSrcs[0]}`);
        } else {
          // Check if images don't match standard user pattern
          let imagesMatch = true;
          let firstMismatchIndex = -1;
          
          for (let i = 0; i < standardImageSrcs.length; i++) {
            if (standardImageSrcs[i] !== problemImageSrcs[i]) {
              imagesMatch = false;
              if (firstMismatchIndex === -1) firstMismatchIndex = i;
            }
          }
          
          expect(imagesMatch).toBeFalsy();
          console.log('Problem user images are different from standard user - known issue confirmed');
          
          if (firstMismatchIndex !== -1) {
            console.log(`\n🔍 First mismatch example:`);
            console.log(`Product: "${standardUserProducts[firstMismatchIndex].name}"`);
            console.log(`Standard image: ${standardImageSrcs[firstMismatchIndex]}`);
            console.log(`Problem image: ${problemImageSrcs[firstMismatchIndex]}`);
          }
        }
      });
    });
});

  