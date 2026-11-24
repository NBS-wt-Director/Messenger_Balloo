// ВРЕМЕННЫЙ спек: отправляется ли SameSite=Strict cookie (domain .balloo.su)
// с balloo.su на api.balloo.su в реальном Chromium.
describe('samesite cookie transport', () => {
  it('checks strict cookie transport to api host', () => {
    const logs: string[] = [];
    cy.visit('https://balloo.su/');
    cy.setCookie('__Secure-balloo_at', 'dummy.jwt.token', {
      domain: '.balloo.su', path: '/', secure: true, sameSite: 'strict',
    });
    cy.getCookie('__Secure-balloo_at').then((c) => logs.push('COOKIE SET: ' + JSON.stringify(c)));
    cy.window().then(async (win) => {
      const res = await win.fetch('https://api.balloo.su/api/users/me', { credentials: 'include' });
      const body = await res.text();
      logs.push('FETCH status=' + res.status);
      logs.push('FETCH body=' + body.slice(0, 200));
    });
    cy.then(() => cy.writeFile('cypress/samesite.json', JSON.stringify(logs, null, 2), { log: false }));
  });
});
