import { Page, Locator } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async navigate(url: string) {
    await this.page.goto(url, { timeout: 30000 });
  }

  async getTitle() {
    return await this.page.title();
  }
} 