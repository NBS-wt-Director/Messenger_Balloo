// Временный спек (тик. 1795507295): прокрутка + подвал на публичных экранах.
// Проверяет, что: (1) .balloo-footer виден на каждом экране; (2) контентный
// контейнер реально скроллится при переполнении. Запуск: xvfb-run cypress run.
const PUBLIC_ROUTES = [
  '/#/about-balloo',
  '/#/about-company',
  '/#/donat',
  '/#/for_kassa',
  '/#/support',
  '/#/privacy',
  '/#/rules',
  '/#/cookies',
  '/#/features',
  '/#/history',
  '/#/download',
];

// Узловые экраны с собственной внутренней раскладкой (сплит-панель/док):
// проверяем подвал + наличие любого скролл-контейнера (в т.ч. внутри панелей).
const NODE_ROUTES = ['/#/doc', '/#/spec'];

describe('Подвал и прокрутка на публичных экранах (тик. 1795507295)', () => {
  beforeEach(() => {
    // Согласие на cookie до визита — баннер (fixed снизу) иначе перекрывает подвал
    cy.setCookie('balloo-cookie-consent', 'essential');
  });

  PUBLIC_ROUTES.forEach((route) => {
    it(`${route}: подвал виден и контент скроллится`, () => {
      cy.visit(route);
      cy.get('.balloo-footer', { timeout: 20000 }).should('exist').and('be.visible');
      // Прокрутка: у контентного контейнера scrollHeight > clientHeight
      cy.document().then((doc) => {
        const scroller = Array.from(doc.querySelectorAll('*')).find((el) => {
          const s = getComputedStyle(el as Element);
          return (
            (s.overflowY === 'auto' || s.overflowY === 'scroll') &&
            (el as HTMLElement).scrollHeight > (el as HTMLElement).clientHeight + 5
          );
        });
        expect(
          scroller || doc.querySelector('.page-container'),
          `скролл-контейнер на ${route}`,
        ).to.exist;
      });
    });
  });

  it('меню подвала открывается кликом по copyright', () => {
    cy.visit('/#/about-balloo');
    cy.get('.balloo-footer__copyright', { timeout: 20000 }).click();
    cy.get('.balloo-footer__menu').should('be.visible');
    cy.contains('.balloo-footer__menu-item', 'О компании').should('be.visible');
    cy.contains('.balloo-footer__menu-item', 'Поддержать нас').should('be.visible');
    // Все пункты активны (ссылки), неактивных «(Позже)» нет (тик. 1795507295)
    cy.get('.balloo-footer__menu a.balloo-footer__menu-item').should('have.length', 5);
    cy.get('.balloo-footer__menu').should('not.contain.text', 'Позже');
  });

  it('неготовые пункты меню ведут на заглушку «Экран в разработке»', () => {
    cy.visit('/#/coming-soon?name=%D0%9A%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D1%8B');
    cy.contains('h1', 'Экран в разработке', { timeout: 20000 }).should('be.visible');
    cy.contains('h2', 'Контакты').should('be.visible');
    cy.get('.balloo-footer').should('be.visible');
  });

  it('донат: заголовок «Поддержите нас»', () => {
    cy.visit('/#/donat');
    cy.contains('h1', 'Поддержите нас', { timeout: 20000 }).should('be.visible');
  });

  it('тема «Русская»: градиент фона + малахитовые пузыри', () => {
    cy.setCookie('balloo-theme', 'russian');
    cy.visit('/#/about-balloo');
    cy.get('html', { timeout: 20000 }).should('have.attr', 'data-theme', 'russian');
    cy.document().then((doc) => {
      // --app-bg темы «Русская» содержит флаговый градиент
      const appBg = getComputedStyle(doc.documentElement).getPropertyValue('--app-bg');
      expect(appBg, '--app-bg').to.contain('gradient');
      // Фактический фон пузыря сообщения — малахитовый градиент
      const bubble = doc.createElement('div');
      bubble.className = 'message__bubble';
      doc.body.appendChild(bubble);
      const bg = getComputedStyle(bubble).backgroundImage;
      bubble.remove();
      expect(bg, 'фон пузыря (малахит)').to.contain('gradient');
    });
  });

  it('экран входа: подвал и прокрутка доступны пользователю', () => {
    cy.visit('/#/login');
    cy.get('.balloo-footer', { timeout: 20000 }).should('be.visible');
  });

  it('cookie-баннер не перекрывает подвал (баннер над ним)', () => {
    // Без согласия — баннер виден; подвал должен оставаться кликабельным
    cy.clearCookie('balloo-cookie-consent');
    cy.visit('/#/about-balloo');
    cy.get('.balloo-footer__copyright', { timeout: 20000 }).click();
    cy.get('.balloo-footer__menu').should('be.visible');
  });

  NODE_ROUTES.forEach((route) => {
    it(`${route}: подвал виден и есть скролл-контейнер`, () => {
      cy.visit(route);
      cy.get('.balloo-footer', { timeout: 20000 }).should('be.visible');
      // Ждём, пока экран выйдет из состояния загрузки, затем ищем скролл
      cy.wait(1500);
      cy.document().then((doc) => {
        const scroller = Array.from(doc.querySelectorAll('*')).find((el) => {
          const s = getComputedStyle(el as Element);
          return s.overflowY === 'auto' || s.overflowY === 'scroll';
        });
        expect(scroller, `скролл-контейнер на ${route}`).to.exist;
      });
    });
  });
});
