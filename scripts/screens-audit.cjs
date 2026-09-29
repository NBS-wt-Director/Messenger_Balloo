#!/usr/bin/env node
// Скрипт-сборщик аудита экранов (тикет 1790479490-04).
//
// Сводит три источника:
//   1. макеты — mockups/index_ecrans.json (id, name, file, status) + наличие .html;
//   2. код — packages/web/src/screens/**/*Screen.tsx;
//   3. роутер — packages/web/src/router/index.tsx (path → компонент).
//
// Правило индексирования — вариант А (ответ владельца В-29): состояния одного
// экрана считаются одним экраном кода. Явная карта «макет → экран кода» задана
// в STATE_MAP ниже; каждое сопоставление выведено из чтения макета и кода.
//
// Выход: tickets/screens-audit.json (промежуточный), tickets/screens-audit.html,
//        tickets/screens-questionnaire.md.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const JSON_IN = path.join(ROOT, 'mockups', 'index_ecrans.json');
const ROUTER = path.join(ROOT, 'packages', 'web', 'src', 'router', 'index.tsx');
const SCREENS_DIR = path.join(ROOT, 'packages', 'web', 'src', 'screens');
const ANDROID_DIR = path.join(ROOT, 'packages', 'mobile-android', 'src');
const ANDROID_ROUTER = path.join(ROOT, 'packages', 'mobile-android', 'src', 'router', 'index.tsx');
const DESKTOP_DIR = path.join(ROOT, 'packages', 'desktop', 'src', 'renderer', 'src', 'screens');

// ── Платформа макета по папке ──
function platformOf(file) {
  if (file.startsWith('mobile/')) return 'android';
  if (file.startsWith('desktop/')) return 'desktop';
  return 'web';
}

// ── Явная карта: basename макета → basename экрана кода (правило А: состояния = один экран) ──
// Значение '' — состояние уже учтённого экрана, отдельного кода нет.
// Значение null/undefined — не сопоставлен (unknown).
const STATE_MAP = {
  // у_00 shared
  'error-404': 'NotFoundScreen', 'error-403': '', 'error-500': '', 'error-503': '',
  'error-555': '', 'offline-authed': '', 'offline-guest': '', 'ban-appeal': '',
  // у_01 balloo.su
  'login': 'LoginScreen', 'register': 'RegisterScreen', 'chats': 'ChatViewScreen',
  'chat': 'ChatViewScreen', 'contacts': 'ContactsScreen', 'search': 'SearchScreen',
  'archive': '', 'profile': 'ProfileScreen', 'public-profile': 'PublicProfileScreen',
  'calls': '', 'group-create': 'CreateGroupScreen', 'group-settings': 'GroupSettingsScreen',
  'settings': 'SettingsScreen', 'my-devices': '', 'accounts': '', 'add-device': 'AddDeviceScreen',
  'stories': 'StoriesScreen', 'password-reset': 'ResetPasswordScreen', 'two-factor': 'TwoFactorScreen',
  'my-donates': 'DonateScreen', 'message-editor': '', 'file-viewer': '',
  'notification-settings': 'NotificationSettingsScreen', 'channel-create': 'CreateChannelScreen',
  'empty-chat': '', 'privacy-settings': 'PrivacySettingsScreen', 'blocked-users': 'BlockedUsersScreen',
  'voice-message': '', 'attachment-panel': '', 'story-create': 'StoryCreateScreen',
  'support': 'SupportScreen',
  'about-balloo': '', 'about-company': '', 'active-call': '', 'bots': '',
  'chat-attachments': '', 'donate': 'DonateScreen', 'invites': '', 'onboarding': '',
  'poll-editor': 'PollScreen', 'report-message': '', 'rules': 'RulesScreen',
  // у_02 admin
  'announcements': 'AnnouncementsScreen', 'audit-log': 'AuditLogsScreen', 'bans': 'BansScreen',
  'blog-channels': 'BlogChannelsScreen', 'blog-migrate': '', 'blog-queue': 'BlogQueueScreen',
  'blog-review': '', 'blog-stats': 'AnalyticsScreen', 'bots-mgmt': '',
  'donations': 'AdminDonationsScreen', 'employees': '', 'features-flags': 'FeatureFlagsScreen',
  'features-mgmt': '', 'files': 'DownloadsScreen', 'groups-mgmt': '', 'metrics': 'AnalyticsScreen',
  'reports': 'ReportsScreen', 'service-status': '', 'texts': 'SystemSettingsScreen',
  'users': 'UsersScreen', 'versions': 'VersionsScreen', 'dashboard': 'DashboardScreen',
  // у_03 command
  'todo': 'TasksScreen', 'candidate-interview': 'InterviewScreen', 'manager-dashboard': '',
  'time-off': '', 'departments': 'HRScreen', 'vacancies': 'VacanciesScreen',
  'application-form': 'ApplicationScreen', 'blog-channel-settings': '',
  'blog-editor': '', 'blog-my-channel': '', 'blog-my-posts': '', 'calendar': '',
  'candidate': '', 'department-management': '', 'employee-profile': '', 'hiring': 'HireScreen',
  'hr': 'HRScreen', 'internal-chat': 'InternalChatScreen', 'knowledge-base': 'KnowledgeScreen',
  'meetings': '', 'monitoring': '', 'my-department': '', 'vacancy-detail': 'VacancyScreen',
  'why-us': '',
  // у_04 features
  'feature-detail': 'FeatureDetailScreen', 'vote': '', 'list': 'FeaturesListScreen',
  'submit': 'FeatureCreateScreen',
  // у_05 history
  'version-detail': 'VersionDetailScreen', 'compare': 'CompareScreen', 'version-list': 'HistoryScreen',
  // у_06 download
  'downloads': 'DownloadScreen',
  // у_07 docs
  'api-docs': 'DocsScreen',
  // у_08 mobile (android-клиент + общие экраны, реализованные в desktop/web)
  'overview': 'DesktopOverviewScreen', 'calls-history': 'DesktopCallsHistoryScreen',
  'chat-attachments': 'DesktopChatAttachmentsScreen', 'report-message': 'DesktopReportMessageScreen',
  'media-viewer': 'DesktopMediaViewerScreen', 'my-donates': 'DesktopMyDonatesScreen',
  'modes': 'DesktopModesScreen', 'voice-record': '', 'right-menu': '',
  // у_09 desktop
  'devices': 'DesktopDevicesScreen', 'notification-settings': 'NotificationSettingsScreen',
  // у_10 specifity (все 7 — один экран SpecifityScreen + компоненты)
  'components': 'SpecifityScreen', 'data': 'SpecifityScreen', 'endpoints': 'SpecifityScreen',
  'home': 'SpecifityScreen', 'screens': 'SpecifityScreen', 'specification': 'SpecifityScreen',
  // у_11 blog
  'category': 'BlogCategoryScreen', 'channel': 'BlogChannelScreen', 'feed': 'BlogLandingScreen',
  'personal-feed': 'BlogLandingScreen', 'post': 'BlogLandingPostScreen',
};

// Платформенные карты (перебивают STATE_MAP для своей платформы)
const ANDROID_MAP = {
  'chat': 'ChatListScreen', 'contacts': 'ContactsScreen', 'settings': 'SettingsScreen',
  'profile': 'ProfileScreen', 'group-create': 'CreateGroupScreen', 'blog': 'BlogScreen',
  'login': 'LoginScreen', 'register': 'RegisterScreen', 'password-reset': 'ResetPasswordScreen',
  'two-factor': 'TwoFactorScreen', 'knowledge-base': 'KnowledgeScreen', 'hiring': 'HiringScreen',
};
const DESKTOP_MAP = {
  'overview': 'DesktopOverviewScreen', 'add-device': 'DesktopAddDeviceScreen',
  'archive': 'DesktopArchiveScreen', 'calls-history': 'DesktopCallsHistoryScreen',
  'chat-attachments': 'DesktopChatAttachmentsScreen', 'donate': 'DesktopDonateScreen',
  'media-viewer': 'DesktopMediaViewerScreen', 'modes': 'DesktopModesScreen',
  'my-donates': 'DesktopMyDonatesScreen', 'report-message': 'DesktopReportMessageScreen',
  'devices': 'DesktopDevicesScreen',
};

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function listScreenFiles(dir, base = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      out.push(...listScreenFiles(path.join(dir, entry.name), rel));
    } else if (/Screen\.tsx$/.test(entry.name)) {
      out.push(rel);
    }
  }
  return out;
}

/** Извлекает из роутера пары {path, component} для lazy-импортов экранов. */
function parseRouter(src) {
  const routes = [];
  // const X = lazy(() => import('@/screens/...'))  →  имя компонента = basename
  const lazyRe = /const\s+(\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\('@\/screens\/([^']+)'\)/g;
  const lazyMap = new Map();
  let m;
  while ((m = lazyRe.exec(src))) {
    lazyMap.set(m[1], m[2]);
  }
  // path: 'x', ... element: <Comp />
  const routeRe = /path:\s*'([^']*)'[\s\S]{0,300}?element:\s*<([A-Za-z0-9_]+)/g;
  while ((m = routeRe.exec(src))) {
    routes.push({ path: m[1], component: m[2], module: lazyMap.get(m[2]) || null });
  }
  return { routes, lazyMap };
}

const data = readJson(JSON_IN);
const screenFiles = listScreenFiles(SCREENS_DIR);
const androidFiles = listScreenFiles(ANDROID_DIR);
const desktopFiles = fs.existsSync(DESKTOP_DIR)
  ? fs.readdirSync(DESKTOP_DIR).filter((f) => /Screen\.tsx$/.test(f)).map((f) => `desktop:${f}`)
  : [];
const routerSrc = fs.readFileSync(ROUTER, 'utf8');
const androidRouterSrc = fs.existsSync(ANDROID_ROUTER) ? fs.readFileSync(ANDROID_ROUTER, 'utf8') : '';
const { routes, lazyMap } = parseRouter(routerSrc);

// Компонент → маршруты (первый непустой)
const compRoutes = new Map();
for (const r of routes) {
  if (!compRoutes.has(r.component)) compRoutes.set(r.component, []);
  compRoutes.get(r.component).push(r.path);
}

// basename экрана кода без .tsx → файл (web и android раздельно)
const codeByBase = new Map();
for (const f of screenFiles) {
  const base = path.basename(f, '.tsx');
  if (!codeByBase.has(base)) codeByBase.set(base, f);
}
const androidByBase = new Map();
for (const f of androidFiles) {
  const base = path.basename(f, '.tsx');
  if (!androidByBase.has(base)) androidByBase.set(base, f);
}
const desktopByBase = new Map();
for (const f of desktopFiles) {
  const clean = f.replace('desktop:', '');
  const base = path.basename(clean, '.tsx');
  desktopByBase.set(base, clean);
}

const rows = [];
for (const node of data.nodes) {
  for (const s of node.screens) {
    const htmlPath = path.join(ROOT, 'mockups', s.file || '');
    const hasHtml = Boolean(s.file) && fs.existsSync(htmlPath);
    const base = (s.file || '').split('/').pop().replace(/\.html$/, '');
    const platform = platformOf(s.file || '');

    let mapped = STATE_MAP[base];
    // Android-макеты: явная android-карта, иначе STATE_MAP (часть экранов mobile
    // реализована в web/desktop — например media-viewer, my-donates).
    if (platform === 'android' && ANDROID_MAP[base] !== undefined) mapped = ANDROID_MAP[base];
    // Desktop-макеты: desktop-карта, иначе STATE_MAP (часть экранов desktop
    // повторяет web-экраны — login, register).
    if (platform === 'desktop' && DESKTOP_MAP[base] !== undefined) mapped = DESKTOP_MAP[base];

    let verdict;
    let codeFile = '';
    let routesOf = [];
    if (mapped === undefined) {
      verdict = 'unknown';
    } else if (mapped === '') {
      verdict = 'state';
    } else {
      if (platform === 'android') {
        // Android-экран: файл в mobile-android, маршрут — в его роутере.
        codeFile = androidByBase.get(mapped) || '';
        routesOf = codeFile && androidRouterSrc.includes(mapped) ? ['(android app)'] : [];
        // Если android-экрана нет — ищем в web/desktop (часть mobile-макетов
        // реализована общими экранами).
        if (!codeFile && codeByBase.has(mapped)) {
          codeFile = codeByBase.get(mapped);
          routesOf = compRoutes.get(mapped) || (routerSrc.includes(`<${mapped}`) ? ['(в роутере)'] : []);
        }
        if (!codeFile && desktopByBase.has(mapped)) {
          codeFile = desktopByBase.get(mapped);
          routesOf = ['(desktop app)'];
        }
      } else if (platform === 'desktop') {
        if (desktopByBase.has(mapped)) {
          codeFile = desktopByBase.get(mapped);
          routesOf = ['(desktop app)'];
        } else {
          // desktop-клиент использует web-роутер (DesktopApp → @balloo/web/router),
          // поэтому web-экран с маршрутом считается подключённым.
          codeFile = codeByBase.get(mapped) || '';
          routesOf = compRoutes.get(mapped) || [];
          if (codeFile && routesOf.length === 0 && routerSrc.includes(`<${mapped}`)) {
            routesOf = ['(web router)'];
          }
        }
      } else {
        codeFile = codeByBase.get(mapped) || '';
        routesOf = compRoutes.get(mapped) || [];
        if (codeFile && routesOf.length === 0 && routerSrc.includes(`<${mapped}`)) {
          routesOf = ['(в роутере)'];
        }
        if (!codeFile && desktopByBase.has(mapped)) {
          codeFile = desktopByBase.get(mapped);
          routesOf = ['(desktop app)'];
        }
      }
      verdict = codeFile ? (routesOf.length ? 'ok' : 'code-no-route') : 'missing';
    }
    rows.push({
      nodeId: node.id,
      nodeName: node.name,
      platform,
      id: s.id,
      name: s.name,
      file: s.file,
      hasHtml,
      status: s.status,
      mapped: mapped === undefined ? null : mapped,
      codeFile,
      routes: routesOf,
      verdict,
    });
  }
}

const summary = {
  total: rows.length,
  ok: rows.filter((r) => r.verdict === 'ok').length,
  state: rows.filter((r) => r.verdict === 'state').length,
  missing: rows.filter((r) => r.verdict === 'missing').length,
  codeNoRoute: rows.filter((r) => r.verdict === 'code-no-route').length,
  unknown: rows.filter((r) => r.verdict === 'unknown').length,
  noHtml: rows.filter((r) => !r.hasHtml).length,
};

fs.writeFileSync(
  path.join(ROOT, 'tickets', 'screens-audit.json'),
  JSON.stringify({ summary, rows }, null, 2)
);

console.log('=== Сводка ===');
console.log(JSON.stringify(summary, null, 2));
console.log('\n=== unknown (нет в карте) ===');
rows.filter((r) => r.verdict === 'unknown').forEach((r) => console.log(` ${r.id} ${r.name} — ${r.file}`));
console.log('\n=== missing (карта есть, кода нет) ===');
rows.filter((r) => r.verdict === 'missing').forEach((r) => console.log(` ${r.id} ${r.name} — ${r.file} → ${r.mapped}`));
console.log('\n=== code-no-route ===');
rows.filter((r) => r.verdict === 'code-no-route').forEach((r) => console.log(` ${r.id} ${r.name} → ${r.mapped}`));

// ── HTML-отчёт ──
const VERDICT_LABEL = {
  ok: '✅ код + маршрут',
  state: '🟡 состояние экрана',
  missing: '🔴 нет кода',
  'code-no-route': '🟠 код без маршрута',
  unknown: '❔ не сопоставлен',
};
const VERDICT_CLASS = {
  ok: 'v-ok', state: 'v-state', missing: 'v-missing', 'code-no-route': 'v-noroute', unknown: 'v-unknown',
};

const nodeRows = [];
const byNode = new Map();
for (const r of rows) {
  if (!byNode.has(r.nodeId)) byNode.set(r.nodeId, { name: r.nodeName, rows: [] });
  byNode.get(r.nodeId).rows.push(r);
}
for (const [nodeId, info] of byNode) {
  const total = info.rows.length;
  const ok = info.rows.filter((r) => r.verdict === 'ok').length;
  const pct = Math.round((ok / total) * 100);
  nodeRows.push(`
    <tr class="node-row">
      <td colspan="7">
        <b>${nodeId} ${info.name}</b> — ${total} экранов, подключено ${ok} (${pct}%)
        <div class="progress"><div class="progress__bar" style="width:${pct}%"></div></div>
      </td>
    </tr>`);
  for (const r of info.rows) {
    nodeRows.push(`
    <tr data-verdict="${r.verdict}" data-node="${nodeId}" class="${VERDICT_CLASS[r.verdict]}">
      <td><code>${r.id}</code></td>
      <td>${r.name}</td>
      <td>${r.file || '—'}</td>
      <td>${r.codeFile || '—'}</td>
      <td>${r.routes.join(', ') || '—'}</td>
      <td>${r.status || '—'}</td>
      <td class="verdict">${VERDICT_LABEL[r.verdict]}</td>
    </tr>`);
  }
}

const html = `<!DOCTYPE html>
<html lang="ru" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Balloo — аудит экранов: макет ↔ код ↔ роутер</title>
<link rel="stylesheet" href="../mockups/assets/common.css">
<style>
  body { padding: 24px; }
  h1 { font-size: 24px; margin-bottom: 6px; }
  .meta { color: var(--text-secondary); font-size: 14px; margin-bottom: 16px; }
  .summary { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 16px; font-size: 14px; }
  .summary b { font-size: 18px; display: block; }
  .filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
  .filters button { background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-primary); padding: 6px 12px; cursor: pointer; font-family: inherit; font-size: 13px; }
  .filters button.active { background: var(--accent); border-color: var(--accent); color: #fff; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid var(--border-color); vertical-align: top; }
  th { background: var(--bg-tertiary); position: sticky; top: 0; }
  .node-row td { background: var(--bg-secondary); font-size: 14px; }
  .progress { height: 6px; background: var(--bg-tertiary); margin-top: 6px; max-width: 400px; }
  .progress__bar { height: 100%; background: var(--accent); }
  .v-ok td:first-child { border-left: 3px solid var(--accent); }
  .v-state td:first-child { border-left: 3px solid var(--warning); }
  .v-missing td:first-child { border-left: 3px solid var(--danger); }
  .v-noroute td:first-child { border-left: 3px solid orange; }
  code { background: var(--bg-tertiary); padding: 1px 5px; font-size: 12px; }
</style>
</head>
<body>
<h1>🗂️ Аудит экранов: макет ↔ код ↔ роутер</h1>
<div class="meta">
  Тикет <code>1790479490-04</code> · дата 2026-09-29 · правило индексирования <b>А</b>
  (состояния одного экрана = один экран кода, ответ владельца В-29) ·
  генератор: <code>scripts/screens-audit.cjs</code>
</div>
<div class="summary">
  <div><b>${summary.total}</b>всего экранов</div>
  <div><b>${summary.ok}</b>✅ код + маршрут</div>
  <div><b>${summary.state}</b>🟡 состояния</div>
  <div><b>${summary.missing}</b>🔴 нет кода</div>
  <div><b>${summary.noHtml}</b>макетов без HTML</div>
</div>
<div class="filters" id="filters">
  <button class="active" data-f="all">Все</button>
  <button data-f="ok">✅ код + маршрут (${summary.ok})</button>
  <button data-f="state">🟡 состояния (${summary.state})</button>
  <button data-f="missing">🔴 нет кода (${summary.missing})</button>
  <button data-f="code-no-route">🟠 без маршрута (${summary.codeNoRoute})</button>
</div>
<table>
<thead><tr><th>ID</th><th>Экран</th><th>Макет</th><th>Код</th><th>Маршрут</th><th>Статус макета</th><th>Вердикт</th></tr></thead>
<tbody>${nodeRows.join('')}</tbody>
</table>
<script>
  const btns = document.querySelectorAll('#filters button');
  const trs = document.querySelectorAll('tbody tr[data-verdict]');
  btns.forEach((b) => b.addEventListener('click', () => {
    btns.forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    const f = b.dataset.f;
    trs.forEach((tr) => { tr.style.display = (f === 'all' || tr.dataset.verdict === f) ? '' : 'none'; });
  }));
</script>
</body>
</html>`;

fs.writeFileSync(path.join(ROOT, 'tickets', 'screens-audit.html'), html);
console.log('\nHTML: tickets/screens-audit.html');
console.log('JSON: tickets/screens-audit.json');

// ── Опросник (только по расхождениям, которых требует решения) ──
const missing = rows.filter((r) => r.verdict === 'missing' || r.verdict === 'code-no-route' || !r.hasHtml);
const mappedSet = new Set(rows.map((r) => r.mapped).filter((m) => m && m !== ''));
const codeWithoutMock = [...codeByBase.keys()].filter((b) => !mappedSet.has(b)).sort();

const q = [];
q.push('# Опросник по аудиту экранов (тикет 1790479490-04)');
q.push('');
q.push('**Дата:** 2026-09-29 · **правило индексирования:** А (ответ владельца В-29) ·');
q.push('**генератор:** `scripts/screens-audit.cjs` · **отчёт:** `tickets/screens-audit.html`');
q.push('');
q.push('## Сводка аудита');
q.push('');
q.push(`- Всего экранов в макетах: **${summary.total}**`);
q.push(`- ✅ Код + маршрут: **${summary.ok}**`);
q.push(`- 🟡 Состояние существующего экрана: **${summary.state}**`);
q.push(`- 🔴 Нет кода: **${summary.missing}**`);
q.push(`- 🟠 Код без маршрута: **${summary.codeNoRoute}**`);
q.push(`- Макетов без HTML-файла: **${summary.noHtml}**`);
q.push('');
q.push('## 1. Экраны, требующие решения владельца');
q.push('');
if (missing.length === 0) {
  q.push('**Пусто.** Все экраны макетов имеют либо код+маршрут, либо отнесены');
  q.push('к состояниям существующих экранов. Решение по недостающим экранам не требуется.');
} else {
  q.push('| ID | Экран | Узел | Макет | Вопрос |');
  q.push('|---|---|---|---|---|');
  for (const r of missing) {
    const why = !r.hasHtml ? 'HTML-файла макета нет на диске' : 'карта сопоставления есть, экрана в коде нет';
    q.push(`| ${r.id} | ${r.name} | ${r.nodeId} | ${r.file || '—'} | ${why}. Нужен ли в v2, какой функционал? |`);
  }
}
q.push('');
q.push('## 2. Экраны кода без макета (обратный проход)');
q.push('');
q.push(`Найдено **${codeWithoutMock.length}** экранов кода, которым не сопоставлен макет.`);
q.push('Часть из них — служебные/вспомогательные (лендинг, юридические, layout-обёртки),');
q.push('часть — экраны, появившиеся в коде без макета (например, `AdminSupportScreen`,');
q.push('`InstallScreen`, `UserDetailScreen`, блог-лендинг). Решение владельца: заводить');
q.push('ли на них макеты в `mockups/` или пометить как «код без макета, допустимо».');
q.push('');
q.push('| Экран кода | Комментарий |');
q.push('|---|---|');
for (const c of codeWithoutMock) q.push(`| \`${c}\` | |`);
q.push('');
q.push('## 3. Заглушки `NotFoundScreen` в роутере (11 упоминаний)');
q.push('');
q.push('| Маршрут | Что закрыто | Вердикт |');
q.push('|---|---|---|');
q.push('| `/admin/texts` | Тексты (SystemSettingsScreen есть, но роут — заглушка) | проверить |');
q.push('| `/admin/departments` | Отделы | осознанная заглушка |');
q.push('| `/admin/employees` | Сотрудники | осознанная заглушка |');
q.push('| `/admin/vacancies` | Вакансии | осознанная заглушка |');
q.push('| `/admin/features` | Фичи (модерация) | осознанная заглушка |');
q.push('| `/command/meetings` | Встречи | осознанная заглушка |');
q.push('| `/command/my-department` | Мой отдел | осознанная заглушка |');
q.push('| `/command/departments` | Отделы | осознанная заглушка |');
q.push('| `/command/monitoring` | Мониторинг | осознанная заглушка |');
q.push('| `*` (fallback) | Настоящая страница 404 | осознанная |');
q.push('');
q.push('## 4. Как вернуть документ');
q.push('');
q.push('Отвечайте по номерам: «1: vote.html — не нужен», «2: AdminSupportScreen —');
q.push('оставить без макета». После ответов задача `1790479490-05` (недостающие экраны)');
q.push('получит точный список работ.');

fs.writeFileSync(path.join(ROOT, 'tickets', 'screens-questionnaire.md'), q.join('\n'));
console.log('Опросник: tickets/screens-questionnaire.md');
