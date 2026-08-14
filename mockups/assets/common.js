/* ============================================
   BALLOO MESSENGER — Common JS
   Shared interactivity for all mockups
   ============================================ */

/* ---------- Theme Switching ---------- */
const BALLOO_THEMES = [
  { id: 'dark',    label: '🌙 Тёмная',  short: '🌙' },
  { id: 'light',   label: '☀️ Светлая', short: '☀️' },
  { id: 'russian', label: '🇷🇺 Наша',   short: '🇷🇺' }
];

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('balloo-theme', theme);
  // Update active markers in right-menu theme submenu
  document.querySelectorAll('[data-theme-option]').forEach(el => {
    const check = el.querySelector('.right-menu__subitem-check');
    if (el.getAttribute('data-theme-option') === theme) {
      el.classList.add('right-menu__subitem--active');
      if (check) check.textContent = '✓';
    } else {
      el.classList.remove('right-menu__subitem--active');
      if (check) check.textContent = '';
    }
  });
}

function initTheme() {
  const url = new URLSearchParams(window.location.search);
  const saved = url.get('theme') || localStorage.getItem('balloo-theme') || 'dark';
  setTheme(saved);
}

/* ---------- Language Switching (visual only) ---------- */
const BALLOO_LANGS = [
  { id: 'ru', label: '🇷🇺 Русский' },
  { id: 'en', label: '🇬🇧 English' },
  { id: 'zh', label: '🇨🇳 中文' },
  { id: 'fr', label: '🇫🇷 Français' },
  { id: 'be', label: '🇧🇾 Беларуская' },
  { id: 'hi', label: '🇮🇳 हिन्दी' }
];

function setLanguage(lang) {
  localStorage.setItem('balloo-lang', lang);
  document.querySelectorAll('[data-lang-option]').forEach(el => {
    const check = el.querySelector('.right-menu__subitem-check');
    if (el.getAttribute('data-lang-option') === lang) {
      el.classList.add('right-menu__subitem--active');
      if (check) check.textContent = '✓';
    } else {
      el.classList.remove('right-menu__subitem--active');
      if (check) check.textContent = '';
    }
  });
}

function initLanguage() {
  const url = new URLSearchParams(window.location.search);
  const saved = url.get('lang') || localStorage.getItem('balloo-lang') || 'ru';
  setLanguage(saved);
}

/* ---------- Dropdown Toggle ---------- */
function toggleDropdown(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = el.style.display === 'block' ? 'none' : 'block';
  }
}

/* ---------- Modal Control ---------- */
function openModal(id) {
  const overlay = document.getElementById('modal-overlay');
  const modal = document.getElementById(id);
  if (overlay) overlay.classList.add('modal-overlay--visible');
  if (modal) modal.classList.add('modal--visible');
}

function closeModal(id) {
  const overlay = document.getElementById('modal-overlay');
  const modal = document.getElementById(id);
  if (overlay) overlay.classList.remove('modal-overlay--visible');
  if (modal) modal.classList.remove('modal--visible');
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(o => o.classList.remove('modal-overlay--visible'));
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('modal--visible'));
}

/* ---------- Sidebar Toggle (Mobile) ---------- */
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.classList.toggle('sidebar--collapsed');
    if (sidebar.classList.contains('sidebar--collapsed')) {
      sidebar.style.width = '64px';
      sidebar.style.overflow = 'hidden';
    } else {
      sidebar.style.width = '';
      sidebar.style.overflow = '';
    }
  }
}

/* ---------- Message Actions ---------- */
function toggleAttachments(msgId) {
  const msg = document.getElementById(msgId);
  if (msg) {
    const att = msg.querySelector('.message__attachments');
    if (att) att.classList.toggle('message__attachments--open');
  }
}

function toggleEditHistory(msgId) {
  const msg = document.getElementById(msgId);
  if (msg) {
    const hist = msg.querySelector('.message__edit-history');
    if (hist) hist.classList.toggle('message__edit-history--open');
  }
}

function addReaction(msgId, emoji) {
  const msg = document.getElementById(msgId);
  if (!msg) return;
  const reactions = msg.querySelector('.message__reactions');
  if (!reactions) return;

  // Check if reaction already exists
  const existing = reactions.querySelector(`[data-emoji="${emoji}"]`);
  if (existing) {
    // Toggle off
    existing.remove();
  } else {
    // Check limit (5 max)
    const count = reactions.querySelectorAll('.message__reaction').length;
    if (count >= 5) {
      alert('Максимум 5 реакций на сообщение');
      return;
    }
    // Add new reaction
    const el = document.createElement('span');
    el.className = 'message__reaction message__reaction--mine';
    el.setAttribute('data-emoji', emoji);
    el.innerHTML = `${emoji} <span>1</span>`;
    el.onclick = () => el.remove();
    reactions.appendChild(el);
  }
}

/* ---------- Slash Commands Hint ---------- */
function onInputChange(textarea) {
  const hint = document.getElementById('input-hint');
  if (!hint) return;

  const val = textarea.value;
  if (val.startsWith('/')) {
    hint.classList.add('input-hint--visible');
    // Filter hints based on input
    const items = hint.querySelectorAll('.input-hint__item');
    const cmd = val.split('_')[0].substring(1);
    items.forEach(item => {
      const itemCmd = item.getAttribute('data-cmd');
      if (itemCmd && itemCmd.startsWith(cmd)) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  } else {
    hint.classList.remove('input-hint--visible');
  }
}

function selectHint(cmd, textarea) {
  textarea.value = `/${cmd}_(`;
  textarea.focus();
  document.getElementById('input-hint').classList.remove('input-hint--visible');
}

/* ---------- Send Message (Demo) ---------- */
function sendMessage() {
  const textarea = document.querySelector('.input-area__field');
  if (!textarea || !textarea.value.trim()) return;

  const messages = document.querySelector('.messages');
  if (!messages) return;

  const msg = document.createElement('div');
  msg.className = 'message message--sender';

  const now = new Date();
  const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  msg.innerHTML = `
    <div class="message__bubble">
      <div class="message__header">
        <span>${timeStr}</span>
      </div>
      <div class="message__body">${escapeHtml(textarea.value)}</div>
      <div class="message__actions">
        <button class="message__action-btn" title="Ответить">↩</button>
        <button class="message__action-btn" title="Копировать">📋</button>
        <button class="message__action-btn" title="Реакция">😊</button>
        <button class="message__action-btn" title="Изменить">✏</button>
        <button class="message__action-btn" title="Удалить">🗑</button>
      </div>
    </div>
    <div class="msg-ticks msg-ticks--sent">✓</div>
  `;

  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
  textarea.value = '';
  document.getElementById('input-hint')?.classList.remove('input-hint--visible');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* ---------- Call Overlay ---------- */
function openCall(type) {
  const overlay = document.getElementById('call-overlay');
  if (overlay) {
    overlay.classList.add('call-overlay--visible');
    startCallTimer();
  }
}

function closeCall() {
  const overlay = document.getElementById('call-overlay');
  if (overlay) overlay.classList.remove('call-overlay--visible');
  stopCallTimer();
}

let callTimerInterval = null;
let callSeconds = 0;

function startCallTimer() {
  callSeconds = 0;
  callTimerInterval = setInterval(() => {
    callSeconds++;
    const timer = document.getElementById('call-timer');
    if (timer) {
      const m = Math.floor(callSeconds / 60).toString().padStart(2, '0');
      const s = (callSeconds % 60).toString().padStart(2, '0');
      timer.textContent = `${m}:${s}`;
    }
  }, 1000);
}

function stopCallTimer() {
  if (callTimerInterval) {
    clearInterval(callTimerInterval);
    callTimerInterval = null;
  }
}

function toggleMute() {
  const btn = document.getElementById('call-mute');
  if (btn) {
    btn.classList.toggle('call-control--active');
    btn.style.opacity = btn.classList.contains('call-control--active') ? '0.5' : '1';
  }
}

function toggleVideo() {
  const btn = document.getElementById('call-video');
  if (btn) {
    btn.classList.toggle('call-control--active');
    btn.style.opacity = btn.classList.contains('call-control--active') ? '0.5' : '1';
  }
}

function toggleScreen() {
  const btn = document.getElementById('call-screen');
  if (btn) {
    btn.classList.toggle('call-control--active');
    btn.style.opacity = btn.classList.contains('call-control--active') ? '0.5' : '1';
  }
}

/* ---------- Learning Mode (Tooltips) ---------- */
function toggleLearningMode() {
  const tooltips = document.querySelectorAll('.tooltip');
  const isVisible = tooltips.length > 0 && tooltips[0].classList.contains('tooltip--visible');

  tooltips.forEach(t => {
    if (isVisible) {
      t.classList.remove('tooltip--visible');
    } else {
      t.classList.add('tooltip--visible');
    }
  });
}

/* ---------- Onboarding Navigation ---------- */
let onboardingStep = 0;

function nextOnboarding() {
  const steps = document.querySelectorAll('.onboarding__step');
  const dots = document.querySelectorAll('.onboarding__dot');
  if (onboardingStep < steps.length - 1) {
    steps[onboardingStep].classList.remove('onboarding__step--active');
    dots[onboardingStep].classList.remove('onboarding__dot--active');
    onboardingStep++;
    steps[onboardingStep].classList.add('onboarding__step--active');
    dots[onboardingStep].classList.add('onboarding__dot--active');
  }
}

function prevOnboarding() {
  const steps = document.querySelectorAll('.onboarding__step');
  const dots = document.querySelectorAll('.onboarding__dot');
  if (onboardingStep > 0) {
    steps[onboardingStep].classList.remove('onboarding__step--active');
    dots[onboardingStep].classList.remove('onboarding__dot--active');
    onboardingStep--;
    steps[onboardingStep].classList.add('onboarding__step--active');
    dots[onboardingStep].classList.add('onboarding__dot--active');
  }
}

function skipOnboarding() {
  window.location.href = 'login.html';
}

/* ---------- Tab Switching ---------- */
function switchTab(tabGroup, tabIndex) {
  const group = document.querySelector(`[data-tab-group="${tabGroup}"]`);
  if (!group) return;

  const tabs = group.querySelectorAll('.tab');
  const panels = group.querySelectorAll('.tab-panel');

  tabs.forEach((t, i) => {
    t.classList.toggle('tab--active', i === tabIndex);
  });
  panels.forEach((p, i) => {
    p.style.display = i === tabIndex ? 'block' : 'none';
  });
}

/* ---------- Poll Voting (Demo) ---------- */
function votePoll(pollId, optionIndex) {
  const poll = document.getElementById(pollId);
  if (!poll) return;

  const options = poll.querySelectorAll('.poll__option');
  const totalVotes = poll.querySelectorAll('.poll__option').length;
  const votes = [3, 7, 2, 5]; // demo data
  votes[optionIndex]++;

  const sum = votes.reduce((a, b) => a + b, 0);

  options.forEach((opt, i) => {
    const bar = opt.querySelector('.poll__option-bar');
    const pct = opt.querySelector('.poll__option-percent');
    const percent = Math.round((votes[i] / sum) * 100);
    if (bar) bar.style.width = percent + '%';
    if (pct) pct.textContent = percent + '%';
    opt.style.cursor = 'default';
    opt.onclick = null;
  });

  // Mark as voted
  options[optionIndex].style.borderColor = 'var(--accent)';
}

/* ---------- Ecosystem Nodes (left logo dropdown) ---------- */
const BALLOO_NODES = [
  { id: 'balloo',   icon: '💬', label: 'Balloo',      dir: 'balloo-su',         page: 'chats.html' },
  { id: 'admin',    icon: '🛡️', label: 'Admin',       dir: 'admin-balloo-su',   page: 'dashboard.html' },
  { id: 'command',  icon: '🏢', label: 'Command',     dir: 'command-balloo-su', page: 'dashboard.html' },
  { id: 'features', icon: '💡', label: 'Features',    dir: 'features-balloo-su',page: 'list.html' },
  { id: 'history',  icon: '📜', label: 'History',     dir: 'history-balloo-su', page: 'version-list.html' },
  { id: 'blog',     icon: '📝', label: 'Blog',        dir: 'blog-balloo-su',    page: 'feed.html' },
  { id: 'download', icon: '⬇️', label: 'Download',    dir: 'download-balloo-su',page: 'downloads.html' },
  { id: 'docs',     icon: '📚', label: 'API Docs',    dir: 'docs-balloo-su',    page: 'api-docs.html' }
];

/* Auto-detect current node, path prefix and auth state from URL */
function detectContext() {
  const path = window.location.pathname.replace(/\\/g, '/');
  const segs = path.split('/').filter(Boolean);
  const file = segs.length ? segs[segs.length - 1] : '';

  let node = '';
  for (const n of BALLOO_NODES) {
    if (segs.includes(n.dir)) { node = n.id; break; }
  }
  if (!node) {
    if (segs.includes('mobile')) node = 'mobile';
    else if (segs.includes('desktop')) node = 'desktop';
    else if (file === 'index.html' || file === '') node = 'catalog';
  }

  const inSubdir = BALLOO_NODES.some(n => segs.includes(n.dir)) ||
    segs.includes('mobile') || segs.includes('desktop');
  const prefix = inSubdir ? '../' : '';

  const guestPages = ['login.html', 'register.html', 'onboarding.html'];
  const auth = guestPages.includes(file) ? 'guest' : 'user';

  return { node, prefix, auth, file };
}

function buildNodesDropdown() {
  const container = document.querySelector('.topbar__dropdown');
  if (!container) return;
  const ctx = detectContext();
  container.id = 'balloo-nodes-dropdown';

  let html = '';
  BALLOO_NODES.forEach(n => {
    const isCurrent = n.id === ctx.node;
    const cls = 'topbar__dropdown-item topbar__dropdown-item--node' +
      (isCurrent ? ' topbar__dropdown-item--node--current' : '');
    const target = ctx.prefix + n.dir + '/' + n.page;
    html += `<div class="${cls}" onclick="window.location.href='${target}'">` +
      `${n.icon} ${n.label}` +
      (isCurrent ? ' <span class="text-xs text-muted">(здесь)</span>' : '') +
      `</div>`;
  });
  container.innerHTML = html;
}

/* ---------- Right Dropdown Menu ---------- */
function buildRightMenu() {
  const ctx = detectContext();
  const ballooDir = ctx.prefix + 'balloo-su/';

  // Find existing topbar__right, preserve any back-link (<a>), clear the rest
  let right = document.querySelector('.topbar__right');
  if (!right) {
    // Create one at end of topbar
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;
    right = document.createElement('div');
    right.className = 'topbar__right';
    topbar.appendChild(right);
  }
  const backLink = right.querySelector('a');
  right.innerHTML = '';
  if (backLink) right.appendChild(backLink);

  const btn = document.createElement('button');
  btn.className = 'topbar__menu-btn';
  btn.id = 'balloo-menu-btn';
  btn.title = 'Меню';
  if (ctx.auth === 'guest') {
    // Mascot trigger (bear PNG pending — abstraction placeholder for mockup)
    btn.innerHTML = '<div class="mascot">🐻</div>';
  } else {
    // Authorized user — octagon avatar as menu trigger
    btn.innerHTML = '<div class="avatar avatar--sm avatar--bordered avatar--status-online avatar--ctx-contact"><div class="avatar__inner"><span>ИИ</span></div></div>';
  }
  right.appendChild(btn);

  let html = '';

  // Language submenu
  html += '<div class="right-menu__section-label">Язык / Language</div>';
  html += '<div class="right-menu__item" data-submenu-toggle="lang">' +
    '<span class="right-menu__item-icon">🌐</span>' +
    '<span class="right-menu__item-label" id="right-menu-lang-label">Язык</span>' +
    '<span class="right-menu__item-chevron">▾</span></div>';
  html += '<div class="right-menu__submenu" data-submenu="lang">';
  BALLOO_LANGS.forEach(l => {
    html += `<div class="right-menu__subitem" data-lang-option="${l.id}" onclick="setLanguage('${l.id}');updateLangLabel()">` +
      `<span>${l.label}</span><span class="right-menu__subitem-check"></span></div>`;
  });
  html += '</div>';

  // Theme submenu
  html += '<div class="right-menu__section-label">Тема</div>';
  html += '<div class="right-menu__item" data-submenu-toggle="theme">' +
    '<span class="right-menu__item-icon">🎨</span>' +
    '<span class="right-menu__item-label">Тема оформления</span>' +
    '<span class="right-menu__item-chevron">▾</span></div>';
  html += '<div class="right-menu__submenu" data-submenu="theme">';
  BALLOO_THEMES.forEach(t => {
    html += `<div class="right-menu__subitem" data-theme-option="${t.id}" onclick="setTheme('${t.id}')">` +
      `<span>${t.label}</span><span class="right-menu__subitem-check"></span></div>`;
  });
  html += '</div>';

  html += '<div class="right-menu__divider"></div>';

  // Links
  html += `<div class="right-menu__item" onclick="window.location.href='${ballooDir}support.html'">` +
    '<span class="right-menu__item-icon">🛠️</span><span class="right-menu__item-label">Техподдержка</span></div>';
  html += `<div class="right-menu__item" onclick="window.location.href='${ballooDir}about-balloo.html'">` +
    '<span class="right-menu__item-icon">🔒</span><span class="right-menu__item-label">Приватность</span></div>';
  html += `<div class="right-menu__item" onclick="window.location.href='${ballooDir}rules.html'">` +
    '<span class="right-menu__item-icon">📋</span><span class="right-menu__item-label">Правила пользования</span></div>';

  html += '<div class="right-menu__divider"></div>';

  // User actions
  if (ctx.auth === 'guest') {
    html += '<div class="right-menu__section-label">Аккаунт</div>';
    html += '<div class="right-menu__auth-guest">' +
      `<button class="btn btn--primary btn--block" onclick="window.location.href='${ballooDir}login.html'">Вход</button>` +
      `<button class="btn btn--secondary btn--block" onclick="window.location.href='${ballooDir}register.html'">Регистрация</button>` +
      '</div>';
  } else {
    html += '<div class="right-menu__section-label">Аккаунт</div>';
    html += `<div class="right-menu__item" onclick="window.location.href='${ballooDir}profile.html'">` +
      '<span class="right-menu__item-icon">👤</span><span class="right-menu__item-label">Профиль</span></div>';
    html += `<div class="right-menu__item" onclick="window.location.href='${ballooDir}settings.html'">` +
      '<span class="right-menu__item-icon">⚙️</span><span class="right-menu__item-label">Настройки</span></div>';
    html += `<div class="right-menu__item" onclick="window.location.href='${ballooDir}login.html'">` +
      '<span class="right-menu__item-icon">🚪</span><span class="right-menu__item-label">Выйти</span></div>';
  }

  const menu = document.createElement('div');
  menu.className = 'right-menu';
  menu.id = 'balloo-right-menu';
  menu.innerHTML = html;
  document.body.appendChild(menu);

  // Button toggle
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleRightMenu();
  });

  // Submenu toggles
  menu.querySelectorAll('[data-submenu-toggle]').forEach(t => {
    t.addEventListener('click', (e) => {
      e.stopPropagation();
      const key = t.getAttribute('data-submenu-toggle');
      const sub = menu.querySelector(`[data-submenu="${key}"]`);
      const chev = t.querySelector('.right-menu__item-chevron');
      if (sub) {
        const open = sub.classList.toggle('right-menu__submenu--open');
        if (chev) chev.textContent = open ? '▴' : '▾';
      }
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
      closeRightMenu();
    }
  });
}

function toggleRightMenu() {
  const menu = document.getElementById('balloo-right-menu');
  const btn = document.getElementById('balloo-menu-btn');
  if (!menu) return;
  const open = menu.classList.toggle('right-menu--open');
  if (btn) btn.classList.toggle('topbar__menu-btn--open', open);
}

function closeRightMenu() {
  const menu = document.getElementById('balloo-right-menu');
  const btn = document.getElementById('balloo-menu-btn');
  if (menu) menu.classList.remove('right-menu--open');
  if (btn) btn.classList.remove('topbar__menu-btn--open');
}

function updateLangLabel() {
  const label = document.getElementById('right-menu-lang-label');
  if (!label) return;
  const cur = localStorage.getItem('balloo-lang') || 'ru';
  const found = BALLOO_LANGS.find(l => l.id === cur);
  if (found) label.textContent = found.label;
}

/* ---------- Footer (unified) ---------- */
function buildFooter() {
  if (document.body.getAttribute('data-no-footer') === 'true') return;
  const ctx = detectContext();

  // Composite storyboard pages (mobile/, desktop/) handle their own layout — skip footer
  if (ctx.node === 'mobile' || ctx.node === 'desktop') return;

  // App/catalog pages: flex-column layout so footer pins to bottom
  document.body.classList.add('app-flex');

  // Catalog page: let content grow so footer sits at the bottom
  if (ctx.node === 'catalog') {
    const mp = document.querySelector('.mockups-page');
    if (mp) mp.style.flex = '1';
  }

  const ballooDir = ctx.prefix + 'balloo-su/';
  const year = new Date().getFullYear();

  const footer = document.createElement('footer');
  footer.className = 'balloo-footer';
  footer.innerHTML =
    '<div class="balloo-footer__left">' +
    `  <span class="balloo-footer__copyright" id="balloo-footer-copy" title="История изменений">` +
    `© ${year} Balloo</span>` +
    '</div>' +
    '<div class="balloo-footer__links">' +
    `  <span class="balloo-footer__link" onclick="window.location.href='${ctx.prefix}history-balloo-su/version-list.html'">Changelog</span>` +
    `  <span class="balloo-footer__link" onclick="window.location.href='${ballooDir}about-company.html'">Соглашение</span>` +
    `  <span class="balloo-footer__link" onclick="window.location.href='${ballooDir}rules.html'">Правила</span>` +
    `  <span class="balloo-footer__link" id="balloo-footer-donate">Донат</span>` +
    '</div>';

  document.body.appendChild(footer);

  const copy = document.getElementById('balloo-footer-copy');
  if (copy) {
    copy.addEventListener('click', () => {
      window.location.href = ctx.prefix + 'history-balloo-su/version-list.html';
    });
  }

  const donate = document.getElementById('balloo-footer-donate');
  if (donate) {
    donate.addEventListener('click', () => {
      // Determine donate page path based on current node
      const nodeDonateMap = {
        'balloo-su': ctx.prefix + 'balloo-su/donate.html',
        'download':  ctx.prefix + 'download-balloo-su/donate.html',
        'history':   ctx.prefix + 'history-balloo-su/donate.html',
        'features':  ctx.prefix + 'features-balloo-su/donate.html',
        'mobile':    ctx.prefix + 'mobile/donate.html',
        'desktop':   ctx.prefix + 'desktop/donate.html'
      };
      const donatePath = nodeDonateMap[ctx.node] || (ctx.prefix + 'balloo-su/donate.html');
      window.location.href = donatePath;
    });
  }
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initLanguage();

  // Build unified UI elements
  buildNodesDropdown();
  buildRightMenu();
  buildFooter();

  // Re-apply active markers now that menu exists
  setTheme(localStorage.getItem('balloo-theme') || 'dark');
  setLanguage(localStorage.getItem('balloo-lang') || 'ru');
  updateLangLabel();

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAllModals();
    });
  });

  // Enter to send (Shift+Enter for newline)
  const input = document.querySelector('.input-area__field');
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    input.addEventListener('input', () => onInputChange(input));
  }
});
