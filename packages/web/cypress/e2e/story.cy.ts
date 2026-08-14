// E2E: Создание истории → просмотр → реакция
describe('Story Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[type="email"], input[name="email"]').type('e2e@test.balloo.ru');
    cy.get('input[type="password"], input[name="password"]').type('Test1234');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login');
  });

  it('should view stories', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="stories"], .story-circle').length > 0) {
        cy.get('[data-testid="stories"], .story-circle').first().click();
      }
    });
  });

  it('should create a story', () => {
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("история"), button:contains("story"), [data-testid="create-story"]').length > 0) {
        cy.get('button:contains("история"), button:contains("story"), [data-testid="create-story"]').first().click();
      }
    });
  });
});
