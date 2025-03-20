# Sauce Demo - Automation Portfolio

## Overview
This project demonstrates end-to-end test automation for the Sauce Demo website using Playwright and TypeScript. It showcases best practices in test automation including Page Object Model pattern, reusable functions, and comprehensive test coverage across different user types.

## Technologies
- Playwright
- TypeScript
- Node.js

## Project Structure
```
sauce_demo_test/
├── Cart page/       # Shopping cart functionality tests
├── Login page/      # Authentication tests
├── Inventory page/  # Product listing tests
├── fixtures/        # Test data
└── pages/           # Page Object Models
```

## Features Tested
- User authentication
- Inventory browsing
- Shopping cart operations
  - Adding items to cart
  - Removing items from cart
  - Cart item verification
  - Checkout flow

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation
```bash
# Clone the repository
git clone https://github.com/Meanfishy00/automation_portfolio.git
cd automation_portfolio

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

## Running the Tests
```bash
# Run all tests
npx playwright test

# Run tests with specific tag
npx playwright test --grep "@smoke"

# Run tests with UI mode
npx playwright test --ui

# Generate and open HTML report
npx playwright test --reporter=html && npx playwright show-report
```

## Key Implementation Details
- Helper functions for common actions
- Different user type testing (standard, problem, performance_glitch)
- Performance measurements
- Error handling with screenshots
- Detailed logging

## Future Enhancements
- API testing integration
- CI/CD pipeline setup
- Visual regression testing
- Reporting capabilities

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Author
Isaiah G - [GitHub Profile](https://github.com/Meanfishy00)
 
