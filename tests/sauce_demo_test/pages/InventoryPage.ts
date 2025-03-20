import { Page, expect, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

export interface Product {
  name: string;
  description: string;
  price: string;
  imageSrc: string;
}

export class InventoryPage extends BasePage {
  // URLs
  readonly url = 'https://www.saucedemo.com/v1/inventory.html';
  
  // Element selectors
  readonly inventoryItems = this.page.locator('div.inventory_item');
  readonly sortDropdown = this.page.locator('.product_sort_container');
  readonly productNames = this.page.locator('.inventory_item_name');
  readonly productPrices = this.page.locator('.inventory_item_price');
  readonly addToCartButtons = this.page.locator('.btn_primary.btn_inventory');
  readonly cartBadge = this.page.locator('.shopping_cart_badge');
  readonly cartLink = this.page.locator('.shopping_cart_link');

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.navigate(this.url);
  }

  async sortBy(option: SortOption) {
    await this.sortDropdown.selectOption(option);
  }

  async getProductCount() {
    return await this.inventoryItems.count();
  }

  async getProductNames() {
    return await this.productNames.allTextContents();
  }

  async getProductPrices() {
    const priceTexts = await this.productPrices.allTextContents();
    return priceTexts.map(price => parseFloat(price.replace('$', '')));
  }

  async getAllProducts(): Promise<Product[]> {
    const items = await this.inventoryItems.all();
    const products: Product[] = [];
    
    for (const item of items) {
      products.push({
        name: (await item.locator('.inventory_item_name').textContent()) || '',
        description: (await item.locator('.inventory_item_desc').textContent()) || '',
        price: (await item.locator('.inventory_item_price').textContent()) || '',
        imageSrc: (await item.locator('img').getAttribute('src')) || ''
      });
    }
    
    return products;
  }

  async addToCart(productIndex: number) {
    await this.addToCartButtons.nth(productIndex).click();
  }

  async getCartItemCount() {
    try {
      const text = await this.cartBadge.textContent();
      return parseInt(text || '0');
    } catch {
      return 0; // If badge is not present, cart is empty
    }
  }

  async goToCart() {
    await this.cartLink.click();
  }
} 