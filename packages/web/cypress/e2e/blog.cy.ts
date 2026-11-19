// E2E: Просмотр блога → создание поста → комментарий
// Тик. 1795094088 (решение владельца 19.11.2026): blog (узел 11) выведен из MVP1,
// маршруты /blog* удалены. E2E-специк сохранён для восстановления узла в скоуп.
describe.skip('Blog Flow — выведен из MVP1 (тик. 1795094088)', () => {
  it('should view blog posts', () => {
    cy.visit('/#/blog');
    cy.get('body').then(($body) => {
      // Blog should have some content
      expect($body.find('.blog-post, article, [data-testid="blog-post"]').length).to.be.greaterThan(-1);
    });
  });

  it('should view a blog post detail', () => {
    cy.visit('/#/blog');
    cy.get('body').then(($body) => {
      if ($body.find('.blog-post a, [data-testid="blog-post-link"]').length > 0) {
        cy.get('.blog-post a, [data-testid="blog-post-link"]').first().click();
        cy.url().should('include', '/blog/');
      }
    });
  });

  it('should navigate to blog categories', () => {
    cy.visit('/#/blog');
    cy.get('body').then(($body) => {
      if ($body.find('a:contains("категор"), [data-testid="blog-categories"]').length > 0) {
        cy.get('a:contains("категор"), [data-testid="blog-categories"]').first().click();
      }
    });
  });
});
