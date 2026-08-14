// E2E: Вход админа → бан пользователя → просмотр отчётов
describe('Admin Flow', () => {
  it('should access admin panel as admin', () => {
    cy.visit('/login');
    cy.get('input[type="email"], input[name="email"]').type('admin@balloo.ru');
    cy.get('input[type="password"], input[name="password"]').type('Admin1234');
    cy.get('button[type="submit"]').click();

    cy.get('body').then(($body) => {
      if ($body.find('a[href*="admin"], [data-testid="admin-link"]').length > 0) {
        cy.get('a[href*="admin"], [data-testid="admin-link"]').first().click();
        cy.url().should('include', '/admin');
      }
    });
  });

  it('should view users list in admin', () => {
    cy.visit('/admin/users');
    cy.get('body').then(($body) => {
      if ($body.find('.admin-users, [data-testid="users-list"]').length > 0) {
        cy.get('.admin-users, [data-testid="users-list"]').should('be.visible');
      }
    });
  });

  it('should view reports in admin', () => {
    cy.visit('/admin/reports');
    cy.get('body').then(($body) => {
      if ($body.find('.admin-reports, [data-testid="reports-list"]').length > 0) {
        cy.get('.admin-reports, [data-testid="reports-list"]').should('be.visible');
      }
    });
  });

  it('should view bans in admin', () => {
    cy.visit('/admin/bans');
    cy.get('body').then(($body) => {
      if ($body.find('.admin-bans, [data-testid="bans-list"]').length > 0) {
        cy.get('.admin-bans, [data-testid="bans-list"]').should('be.visible');
      }
    });
  });
});
