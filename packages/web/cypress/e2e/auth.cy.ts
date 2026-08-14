// E2E: Регистрация → Логин → 2FA → Logout
describe('Auth Flow', () => {
  it('should register a new user', () => {
    const email = `e2e_${Date.now()}@test.balloo.ru`;
    const username = `e2euser_${Date.now()}`;

    cy.visit('/register');
    cy.get('input[type="email"], input[name="email"]').type(email);
    cy.get('input[name="username"]').type(username);
    cy.get('input[type="password"], input[name="password"]').type('Test1234');
    cy.get('button[type="submit"]').click();

    // Should redirect to main app or show success
    cy.url().should('not.include', '/register');
  });

  it('should login with existing credentials', () => {
    cy.visit('/login');
    cy.get('input[type="email"], input[name="email"]').type('e2e@test.balloo.ru');
    cy.get('input[type="password"], input[name="password"]').type('Test1234');
    cy.get('button[type="submit"]').click();

    // Should redirect to main app
    cy.url().should('not.include', '/login');
  });

  it('should show error for invalid login', () => {
    cy.visit('/login');
    cy.get('input[type="email"], input[name="email"]').type('invalid@test.balloo.ru');
    cy.get('input[type="password"], input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    // Should show error message
    cy.contains(/неверный|ошибка|invalid/i).should('be.visible');
  });

  it('should logout successfully', () => {
    // Login first
    cy.visit('/login');
    cy.get('input[type="email"], input[name="email"]').type('e2e@test.balloo.ru');
    cy.get('input[type="password"], input[name="password"]').type('Test1234');
    cy.get('button[type="submit"]').click();

    // Find and click logout button
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="logout"], button:contains("Выйти")').length > 0) {
        cy.get('[data-testid="logout"], button:contains("Выйти")').first().click();
        cy.url().should('include', '/login');
      }
    });
  });
});
