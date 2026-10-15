// E2E: Регистрация → Логин → Ошибка логина → Logout
// Тикет mvp1-04 (первый реальный прогон Cypress). Исправлено под реальный UI:
// hash-роутер (createHashRouter → /#/login), формы с data-testid, капча/согласие
// на регистрации.
const API = 'http://localhost:3100';

function uniqueEmail(): string {
  return `e2e_${Date.now()}_${Math.floor(Math.random() * 1000)}@test.balloo.ru`;
}

// Создание пользователя напрямую через API (не зависит от состояния UI-регистрации)
function createUserViaApi(email: string, password: string) {
  return cy.request('POST', `${API}/api/auth/register`, { email, password });
}

describe('Auth Flow', () => {
  it('should register a new user', () => {
    const email = uniqueEmail();

    cy.visit('/#/register');
    cy.get('[data-testid="register-name"]').type('Тест Тестов');
    cy.get('[data-testid="register-email"]').type(email);
    cy.get('[data-testid="register-password"]').type('Test1234!');
    cy.get('[data-testid="register-confirm"]').type('Test1234!');
    cy.get('[data-testid="register-agree"]').check();

    // Капча: читаем отображаемый код и вводим его
    cy.get('[data-testid="register-captcha-text"]')
      .invoke('text')
      .then((captcha) => {
        cy.get('[data-testid="register-captcha"]').type(captcha.trim());
      });

    cy.get('[data-testid="register-submit"]').click();

    // После успешной регистрации: setUser → GuestRoute редиректит в /#/chat.
    // UX-дефект (записан в тикет mvp1-04): шаг подтверждения email (register-code-step)
    // из UI недостижим — редирект происходит раньше.
    cy.url({ timeout: 15000 }).should('include', '/#/chat');
  });

  it('should login with existing credentials', () => {
    const email = uniqueEmail();
    createUserViaApi(email, 'Test1234!').then(() => {
      // cy.request устанавливает httpOnly-куки ответа в jar Cypress — на
      // /#/login сессия уже есть, и ProtectedRoute редиректит в чат. Чистим.
      cy.clearCookies();
      cy.visit('/#/login');
      cy.get('[data-testid="login-email"]').type(email);
      cy.get('[data-testid="login-password"]').type('Test1234!');
      cy.get('[data-testid="login-submit"]').click();

      // Редирект в чат
      cy.url().should('include', '/#/chat');
    });
  });

  it('should show error for invalid login', () => {
    cy.visit('/#/login');
    cy.get('[data-testid="login-email"]').type('invalid_never_registered@test.balloo.ru');
    cy.get('[data-testid="login-password"]').type('WrongPass123');
    cy.get('[data-testid="login-submit"]').click();

    // Сервер отвечает «Неверный email или пароль»
    cy.get('[data-testid="login-error"]')
      .should('be.visible')
      .invoke('text')
      .then((txt) => {
        expect(txt, 'login-error text: ' + txt).to.match(/неверный|invalid/i);
      });
  });

  it('should logout successfully', () => {
    const email = uniqueEmail();
    createUserViaApi(email, 'Test1234!').then(() => {
      cy.clearCookies();
      cy.visit('/#/login');
      cy.get('[data-testid="login-email"]').type(email);
      cy.get('[data-testid="login-password"]').type('Test1234!');
      cy.get('[data-testid="login-submit"]').click();
      cy.url().should('include', '/#/chat');

      // Открыть правое меню (шапка) и нажать «Выйти»
      cy.get('#balloo-menu-btn').click();
      cy.get('#balloo-right-menu').should('have.class', 'right-menu--open');
      cy.get('#balloo-right-menu').contains('.right-menu__item', 'Выйти').click();

      cy.url().should('not.include', '/#/chat');
    });
  });
});
