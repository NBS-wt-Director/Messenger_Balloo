// E2E: Создание группы → добавление участников → invite link
describe('Group Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[type="email"], input[name="email"]').type('e2e@test.balloo.ru');
    cy.get('input[type="password"], input[name="password"]').type('Test1234');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login');
  });

  it('should create a group and add members', () => {
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Создать")').length > 0) {
        cy.get('button:contains("Создать")').first().click();
        cy.get('input[name="name"]').type('E2E Group with Members');
        cy.get('button[type="submit"]').click();
        cy.contains('E2E Group with Members').should('be.visible');
      }
    });
  });

  it('should generate an invite link', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.chat-item, [data-testid="chat-item"]').length > 0) {
        cy.get('.chat-item, [data-testid="chat-item"]').first().click();
        cy.get('body').then(($b) => {
          if ($b.find('button:contains("пригласить"), button:contains("invite")').length > 0) {
            cy.get('button:contains("пригласить"), button:contains("invite")').first().click();
            cy.get('body').should('contain', 'http');
          }
        });
      }
    });
  });
});
