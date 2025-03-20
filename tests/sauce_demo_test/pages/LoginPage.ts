import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  // URLs
  readonly url = 'https://www.saucedemo.com/v1/index.html';
  
  // Element selectors
  readonly usernameInput = this.page.getByPlaceholder('Username');
  readonly passwordInput = this.page.getByPlaceholder('Password');
  readonly loginButton = this.page.locator('#login-button');
  readonly errorMessage = this.page.locator('[data-test="error"]');
  readonly errorButton = this.page.locator('.error-button');

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.navigate(this.url);
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click({ timeout: 45000 });
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }

  async isErrorVisible() {
    return await this.errorButton.isVisible();
  }
} 