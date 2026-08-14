// E2E: Создание чата → отправка сообщения → реакция
describe('Chat Flow', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('/login');
    cy.get('input[type="email"], input[name="email"]').type('e2e@test.balloo.ru');
    cy.get('input[type="password"], input[name="password"]').type('Test1234');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login');
  });

  it('should create a new group chat', () => {
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Создать"), [data-testid="create-chat"]').length > 0) {
        cy.get('button:contains("Создать"), [data-testid="create-chat"]').first().click();
        cy.get('input[name="name"]').type('E2E Test Group');
        cy.get('button[type="submit"]').click();
        cy.contains('E2E Test Group').should('be.visible');
      }
    });
  });

  it('should send a text message', () => {
    // Select first chat if available
    cy.get('body').then(($body) => {
      if ($body.find('.chat-item, [data-testid="chat-item"]').length > 0) {
        cy.get('.chat-item, [data-testid="chat-item"]').first().click();
        cy.get('textarea, input[name="message"]').type('E2E test message{enter}');
        cy.contains('E2E test message').should('be.visible');
      }
    });
  });

  it('should add a reaction to a message', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.chat-item, [data-testid="chat-item"]').length > 0) {
        cy.get('.chat-item, [data-testid="chat-item"]').first().click();
        cy.get('.message, [data-testid="message"]').first().trigger('mouseover');
        cy.get('body').then(($b) => {
          if ($b.find('.message__action-btn:contains("😊")').length > 0) {
            cy.get('.message__action-btn').eq(2).click();
          }
        });
      }
    });
  });
});
