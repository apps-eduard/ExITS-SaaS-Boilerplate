// // cypress/support/commands.ts - Custom Cypress commands
// Cypress.Commands.add('login', (email: string, password: string) => {
//   cy.visit('/login');
//   cy.get('input[name="email"]').type(email);
//   cy.get('input[name="password"]').type(password);
//   cy.get('button[type="submit"]').click();
//   cy.url().should('include', '/dashboard');
// });

// Cypress.Commands.add('logout', () => {
//   cy.get('[data-testid="user-menu"]').click();
//   cy.get('[data-testid="logout-button"]').click();
//   cy.url().should('include', '/login');
// });

// Cypress.Commands.add('selectDropdown', (selector: string, option: string) => {
//   cy.get(selector).click();
//   cy.get(`[role="option"]`).contains(option).click();
// });

// Cypress.Commands.add('checkApiResponse', (method: string, url: string, expectedStatus: number) => {
//   cy.intercept(method, url).as('apiCall');
//   cy.wait('@apiCall').then((interception) => {
//     expect(interception.response?.statusCode).to.equal(expectedStatus);
//   });
// });

// Cypress.Commands.add('waitForLoadingToFinish', () => {
//   cy.get('[data-testid="loading-spinner"]', { timeout: 5000 }).should('not.exist');
// });
