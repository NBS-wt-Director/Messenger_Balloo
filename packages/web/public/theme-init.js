// Тема и язык применяются ДО первого рендера React.
// Без этого блока — FOUC (вспышка default-темы) при загрузке.
// Вынесен из index.html для CSP: script-src без 'unsafe-inline'.
(function () {
  function getCookie(name) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }
  var theme = getCookie('balloo-theme');
  if (theme === 'dark' || theme === 'light' || theme === 'russian') {
    document.documentElement.setAttribute('data-theme', theme);
  }
  var lang = getCookie('balloo-language');
  if (lang && /^[a-z]{2,3}$/.test(lang)) {
    document.documentElement.setAttribute('lang', lang);
  }
})();
