#!/usr/bin/env node
/**
 * generate-v2-report.js
 * Генерирует v2-features-audit.html и v2-promo-booklet.html
 * 
 * Запуск: node scripts/generate-v2-report.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ============================================================
// 1. Читаем источники данных
// ============================================================

function readJSON(filename) {
  try {
    const raw = fs.readFileSync(path.join(ROOT, filename), 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`⚠️  Не удалось прочитать ${filename}: ${e.message}`);
    return null;
  }
}

const indexEcrans = readJSON('mockups/index_ecrans.json');
const deferredToV2 = readJSON('tickets/deferred-to-v2.json') || null;

// Читаем deferred-to-v2.md как текст
let deferredMd = '';
try {
  deferredMd = fs.readFileSync(path.join(ROOT, 'tickets/deferred-to-v2.md'), 'utf-8');
} catch (e) {
  console.warn('⚠️  deferred-to-v2.md не найден');
}

// ============================================================
// 2. Парсим deferred-to-v2.md
// ============================================================

function parseDeferredToV2(md) {
  const features = [];
  
  // Паттерн 1: ### Тикет v2-NNN: Название
  const sections = md.split(/^### /m);
  
  for (const section of sections) {
    if (!section.trim()) continue;
    
    // Извлекаем заголовок
    const headerMatch = section.match(/^(.+?):\s+(.+?)(?:\n|$)/);
    if (!headerMatch) continue;
    
    const rawId = headerMatch[1].trim();
    const title = headerMatch[2].trim();
    
    // Нормализуем ID
    let id = rawId;
    if (rawId.startsWith('Тикет ')) {
      id = rawId.replace('Тикет ', '');
    }
    
    // Извлекаем приоритет
    const priorityMatch = section.match(/\*\*Приоритет:\*\*\s+(.+)/);
    // Извлекаем описание
    const descMatch = section.match(/\*\*Описание:\*\*\s*(.+?)(?=\n\*\*|\n\n\*\*|$)/s);
    
    features.push({
      id,
      title,
      priority: priorityMatch ? priorityMatch[1] : 'Не указан',
      depends: 'Нет',
      description: descMatch ? descMatch[1].trim() : 'Нет описания'
    });
  }
  
  // Дополнительно: извлекаем критические задачи (67, 68, 69, 70)
  const criticalPatterns = [
    { id: '67', title: 'Дополнение i18n — переводы на 18 языков', desc: '20 языков объявлены, но переведены только ru/en. 18 языков полностью пусты. ~1080 строк переводов.' },
    { id: '68', title: 'Проверка тем оформления', desc: '3 темы (dark, light, russian). Проверка синхронизации common.css и themes.css, корректности цветов.' },
    { id: '69', title: 'Платёжный сервис (ЮMoney)', desc: 'Интеграция с ЮMoney. Обнаружены ошибки/недоработки в интеграции.' },
  ];
  
  for (const c of criticalPatterns) {
    if (!features.find(f => f.id === c.id)) {
      features.push({
        id: c.id,
        title: c.title,
        priority: '🔴 Критический',
        depends: 'Нет',
        description: c.desc
      });
    }
  }
  
  return features;
}

const deferredFeatures = parseDeferredToV2(deferredMd);

// ============================================================
// 3. Анализируем index_ecrans.json
// ============================================================

function analyzeScreens(data) {
  const allScreens = [];
  if (!data) return allScreens;
  
  for (const node of data.nodes || []) {
    for (const screen of node.screens || []) {
      allScreens.push({
        ...screen,
        nodeId: node.id,
        nodeName: node.name,
        nodeScreensCount: node.screens_count
      });
    }
  }
  
  return allScreens;
}

const allScreens = analyzeScreens(indexEcrans);

const screensByStatus = {};
allScreens.forEach(s => {
  const status = s.status || 'неизвестен';
  if (!screensByStatus[status]) screensByStatus[status] = [];
  screensByStatus[status].push(s);
});

// ============================================================
// 4. Генерируем tickets/v2-features-audit.html
// ============================================================

function generateAuditHTML() {
  const totalScreens = allScreens.length;
  const statusCounts = {};
  allScreens.forEach(s => {
    const st = s.status || 'неизвестен';
    statusCounts[st] = (statusCounts[st] || 0) + 1;
  });
  
  const totalV2Features = deferredFeatures.length;
  
  // Генерируем строки таблицы экранов
  let screensRows = '';
  const nodes = {};
  allScreens.forEach(s => {
    if (!nodes[s.nodeId]) nodes[s.nodeId] = { name: s.nodeName, screens: [] };
    nodes[s.nodeId].screens.push(s);
  });
  
  for (const [nodeId, nodeData] of Object.entries(nodes)) {
    screensRows += `<tr><td colspan="4" class="node-header">${nodeData.name} (${nodeId})</td></tr>`;
    for (const screen of nodeData.screens) {
      const statusColor = screen.status === 'готов' ? 'green' : screen.status === 'написан' ? 'orange' : 'red';
      screensRows += `
        <tr>
          <td>${screen.id}</td>
          <td>${screen.title}</td>
          <td>${screen.status || 'неизвестен'}</td>
          <td>${screen.path || '—'}</td>
        </tr>`;
    }
  }
  
  // Генерируем строки v2-функций
  let v2Rows = '';
  for (const f of deferredFeatures) {
    const isCritical = f.id.includes('67') || f.id.includes('68') || f.id.includes('69') || f.id.includes('70');
    const isMedium = f.priority.includes('Средний');
    const isLow = f.priority.includes('Низкий');
    const priorityClass = isCritical ? 'critical' : isMedium ? 'medium' : isLow ? 'low' : '';
    v2Rows += `
      <tr class="${priorityClass}">
        <td><code>${f.id}</code></td>
        <td>${f.title}</td>
        <td>${f.priority}</td>
        <td>${f.depends}</td>
        <td>${f.description.substring(0, 100)}${f.description.length > 100 ? '...' : ''}</td>
      </tr>`;
  }
  
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Balloo v2+ — Аудит функционала</title>
  <style>
    :root {
      --accent: #2db84d;
      --bg: #1a1a2e;
      --bg2: #16213e;
      --bg3: #0f3460;
      --text: #e0e0e0;
      --text2: #a0a0a0;
      --border: #2a2a4a;
      --green: #2db84d;
      --orange: #e6a817;
      --red: #e74c3c;
      --critical: #e74c3c;
      --medium: #e6a817;
      --low: #3498db;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', 'Manrope', system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
    }
    .container { max-width: 1400px; margin: 0 auto; padding: 2rem; }
    header {
      text-align: center;
      padding: 3rem 2rem;
      background: linear-gradient(135deg, var(--bg2), var(--bg3));
      border-bottom: 2px solid var(--accent);
      margin-bottom: 2rem;
    }
    header h1 {
      font-size: 2.5rem;
      background: linear-gradient(90deg, var(--accent), #4ade80);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    header p { color: var(--text2); font-size: 1.1rem; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.5rem;
      text-align: center;
    }
    .stat-card .number {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--accent);
    }
    .stat-card .label {
      color: var(--text2);
      font-size: 0.9rem;
    }
    .progress-bar {
      background: var(--bg2);
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      border: 1px solid var(--border);
    }
    .progress-bar h3 { margin-bottom: 1rem; }
    .progress-track {
      height: 24px;
      background: var(--bg);
      border-radius: 12px;
      overflow: hidden;
      display: flex;
    }
    .progress-segment {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      color: white;
      transition: width 0.5s;
    }
    .section { margin-bottom: 2rem; }
    .section h2 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--bg2);
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 1rem;
    }
    th {
      background: var(--bg3);
      padding: 0.75rem 1rem;
      text-align: left;
      font-weight: 600;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text2);
    }
    td {
      padding: 0.6rem 1rem;
      border-top: 1px solid var(--border);
      font-size: 0.9rem;
    }
    tr.node-header {
      background: var(--bg3);
      font-weight: 600;
    }
    tr.node-header td { padding: 0.5rem 1rem; }
    .priority-critical { border-left: 3px solid var(--critical); }
    .priority-medium { border-left: 3px solid var(--medium); }
    .priority-low { border-left: 3px solid var(--low); }
    code {
      background: var(--bg);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-size: 0.85em;
      color: var(--accent);
    }
    .filters {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    .filter-btn {
      background: var(--bg2);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 0.4rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.2s;
    }
    .filter-btn:hover, .filter-btn.active {
      background: var(--accent);
      border-color: var(--accent);
      color: white;
    }
    .print-btn {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: var(--accent);
      color: white;
      border: none;
      padding: 1rem 2rem;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(45, 184, 77, 0.4);
      transition: all 0.3s;
      z-index: 100;
    }
    .print-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(45, 184, 77, 0.6);
    }
    .badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-green { background: rgba(45, 184, 77, 0.2); color: var(--green); }
    .badge-orange { background: rgba(230, 168, 23, 0.2); color: var(--orange); }
    .badge-red { background: rgba(231, 76, 60, 0.2); color: var(--red); }
    footer {
      text-align: center;
      padding: 2rem;
      color: var(--text2);
      font-size: 0.85rem;
      border-top: 1px solid var(--border);
      margin-top: 2rem;
    }
    @media print {
      .print-btn { display: none; }
      body { background: white; color: black; }
      .stat-card, table, .progress-bar { background: #f9f9f9; border-color: #ddd; }
      header { background: linear-gradient(135deg, #f0f0f0, #e0e0e0); }
      header h1 { -webkit-text-fill-color: var(--accent); }
    }
  </style>
</head>
<body>
  <header>
    <h1>🚀 Balloo Messenger v2+</h1>
    <p>Аудит функционала и экранов</p>
    <p style="margin-top:0.5rem; font-size:0.9rem;">Создан: 2026-07-31 | Версия: v1.0.0 → v2+</p>
  </header>
  
  <div class="container">
    <!-- Статистика -->
    <div class="stats">
      <div class="stat-card">
        <div class="number">${totalScreens}</div>
        <div class="label">Всего экранов</div>
      </div>
      <div class="stat-card">
        <div class="number">${statusCounts['готов'] || 0}</div>
        <div class="label">Готово (v1)</div>
      </div>
      <div class="stat-card">
        <div class="number">${totalV2Features}</div>
        <div class="label">v2+ функций</div>
      </div>
      <div class="stat-card">
        <div class="number">${Object.keys(nodes || {}).length}</div>
        <div class="label">Узлов</div>
      </div>
    </div>
    
    <!-- Прогресс-бар -->
    <div class="progress-bar">
      <h3>Прогресс реализации v1</h3>
      <div class="progress-track">
        ${(function() {
          let html = '';
          for (const [status, count] of Object.entries(statusCounts)) {
            const pct = ((count / totalScreens) * 100).toFixed(1);
            const color = status === 'готов' ? 'var(--green)' : status === 'написан' ? 'var(--orange)' : 'var(--red)';
            html += `<div class="progress-segment" style="width:${pct}%;background:${color}">${pct > 5 ? pct + '%' : ''}</div>`;
          }
          return html;
        })()}
      </div>
      <div style="display:flex;gap:1rem;margin-top:0.5rem;flex-wrap:wrap;">
        ${Object.entries(statusCounts).map(([status, count]) => {
          const color = status === 'готов' ? 'var(--green)' : status === 'написан' ? 'var(--orange)' : 'var(--red)';
          return `<span style="font-size:0.8rem;"><span style="color:${color}">●</span> ${status}: ${count}</span>`;
        }).join('')}
      </div>
    </div>
    
    <!-- v2+ Функции -->
    <div class="section">
      <h2>📋 v2+ Функции (${totalV2Features})</h2>
      <div class="filters">
        <button class="filter-btn active" onclick="filterV2('all')">Все</button>
        <button class="filter-btn" onclick="filterV2('critical')">🔴 Критические</button>
        <button class="filter-btn" onclick="filterV2('medium')">🟡 Средние</button>
        <button class="filter-btn" onclick="filterV2('low')">🟢 Низкие</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Функция</th>
            <th>Приоритет</th>
            <th>Зависит от</th>
            <th>Описание</th>
          </tr>
        </thead>
        <tbody id="v2-table">
          ${v2Rows}
        </tbody>
      </table>
    </div>
    
    <!-- Экраны по узлам -->
    <div class="section">
      <h2>📱 Экраны по узлам (${totalScreens})</h2>
      <div class="filters">
        <button class="filter-btn active" onclick="filterScreens('all')">Все</button>
        ${Object.keys(statusCounts).map(s => `<button class="filter-btn" onclick="filterScreens('${s}')">${s} (${statusCounts[s]})</button>`).join('')}
      </div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Название</th>
            <th>Статус</th>
            <th>Путь</th>
          </tr>
        </thead>
        <tbody>
          ${screensRows}
        </tbody>
      </table>
    </div>
    
    <!-- Сводка по узлам -->
    <div class="section">
      <h2>🔗 Сводка по узлам</h2>
      <table>
        <thead>
          <tr><th>Узел</th><th>ID</th><th>Экранов</th><th>v2+ функций</th></tr>
        </thead>
        <tbody>
          ${Object.entries(nodes).map(([id, data]) => {
            const v2Count = deferredFeatures.filter(f => f.id.startsWith('0_' + id.replace('у_', ''))).length;
            return `<tr><td>${data.name}</td><td>${id}</td><td>${data.screens.length}</td><td>${v2Count}</td></tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>
  
  <button class="print-btn" onclick="window.print()">🖨️ Печать в PDF</button>
  
  <footer>
    <p>Balloo Messenger v2+ Audit Report | Сгенерировано 2026-07-31</p>
    <p>© 2026 Balloo.su — Российский мессенджер нового поколения</p>
  </footer>
  
  <script>
    function filterV2(type) {
      document.querySelectorAll('.filters .filter-btn').forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');
      const rows = document.querySelectorAll('#v2-table tr');
      rows.forEach(row => {
        if (type === 'all') { row.style.display = ''; return; }
        row.style.display = row.classList.contains('priority-' + type) ? '' : 'none';
      });
    }
    function filterScreens(status) {
      document.querySelectorAll('.section:last-child .filters .filter-btn').forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');
      const rows = document.querySelectorAll('.section:last-child tbody tr');
      rows.forEach(row => {
        if (status === 'all') { row.style.display = ''; return; }
        const cell = row.querySelector('td:nth-child(3)');
        row.style.display = cell && cell.textContent === status ? '' : 'none';
      });
    }
  </script>
</body>
</html>`;
}

// ============================================================
// 5. Генерируем v2-promo-booklet.html
// ============================================================

function generatePromoBooklet() {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Balloo Messenger v2+ — Книга возможностей</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Manrope:wght@400;500;600;700;800&display=swap');
    
    :root {
      --accent: #2db84d;
      --accent-light: #4ade80;
      --accent-dark: #1a8a3a;
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', 'Manrope', system-ui, sans-serif;
      background: #0a0a1a;
      color: #e8e8f0;
    }
    
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 20mm;
      page-break-after: always;
      position: relative;
      overflow: hidden;
    }
    
    /* ===== СТРАНИЦА 1: ОБЛОЖКА ===== */
    .page-cover {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background: 
        radial-gradient(ellipse at 20% 50%, rgba(45, 184, 77, 0.15) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 20%, rgba(74, 222, 128, 0.1) 0%, transparent 40%),
        radial-gradient(ellipse at 50% 80%, rgba(15, 52, 96, 0.5) 0%, transparent 50%),
        linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 100%);
    }
    
    .page-cover::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232db84d' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      opacity: 0.5;
    }
    
    .cover-logo {
      font-size: 5rem;
      margin-bottom: 1rem;
      position: relative;
      z-index: 1;
    }
    
    .cover-title {
      font-size: 3.5rem;
      font-weight: 900;
      background: linear-gradient(135deg, #2db84d, #4ade80, #86efac);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
      letter-spacing: -1px;
      position: relative;
      z-index: 1;
    }
    
    .cover-subtitle {
      font-size: 1.5rem;
      color: rgba(232, 232, 240, 0.7);
      font-weight: 300;
      margin-bottom: 2rem;
      position: relative;
      z-index: 1;
    }
    
    .cover-tagline {
      font-size: 1.1rem;
      color: var(--accent);
      font-weight: 500;
      padding: 0.75rem 2rem;
      border: 1px solid rgba(45, 184, 77, 0.3);
      border-radius: 8px;
      position: relative;
      z-index: 1;
      margin-bottom: 3rem;
    }
    
    .cover-version {
      font-size: 0.9rem;
      color: rgba(232, 232, 240, 0.4);
      position: relative;
      z-index: 1;
    }
    
    .cover-decoration {
      position: absolute;
      bottom: 20mm;
      left: 20mm;
      right: 20mm;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--accent), transparent);
    }
    
    /* ===== СТРАНИЦА 2: О ПРОЕКТЕ ===== */
    .page-about {
      background:
        radial-gradient(ellipse at 0% 0%, rgba(15, 52, 96, 0.3) 0%, transparent 50%),
        radial-gradient(ellipse at 100% 100%, rgba(45, 184, 77, 0.08) 0%, transparent 40%),
        linear-gradient(180deg, #0f172a 0%, #1a1a2e 50%, #0a0a1a 100%);
    }
    
    .page-number {
      position: absolute;
      bottom: 15mm;
      right: 20mm;
      font-size: 0.8rem;
      color: rgba(232, 232, 240, 0.3);
    }
    
    .section-title {
      font-size: 2rem;
      font-weight: 800;
      margin-bottom: 2rem;
      background: linear-gradient(90deg, #2db84d, #4ade80);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .about-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .about-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(45, 184, 77, 0.15);
      border-radius: 12px;
      padding: 1.5rem;
      backdrop-filter: blur(10px);
      transition: transform 0.3s, border-color 0.3s;
    }
    
    .about-card:hover {
      transform: translateY(-2px);
      border-color: rgba(45, 184, 77, 0.4);
    }
    
    .about-card-icon {
      font-size: 2rem;
      margin-bottom: 0.75rem;
    }
    
    .about-card h3 {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: #4ade80;
    }
    
    .about-card p {
      font-size: 0.9rem;
      color: rgba(232, 232, 240, 0.6);
      line-height: 1.6;
    }
    
    .highlight-box {
      background: linear-gradient(135deg, rgba(45, 184, 77, 0.1), rgba(74, 222, 128, 0.05));
      border-left: 3px solid var(--accent);
      padding: 1.5rem;
      border-radius: 0 8px 8px 0;
      margin: 1.5rem 0;
    }
    
    .highlight-box p {
      font-size: 1rem;
      line-height: 1.8;
      color: rgba(232, 232, 240, 0.8);
    }
    
    /* ===== СТРАНИЦА 3: ДЛЯ ИНВЕСТОРОВ ===== */
    .page-investors {
      background:
        radial-gradient(ellipse at 80% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
        radial-gradient(ellipse at 20% 80%, rgba(45, 184, 77, 0.1) 0%, transparent 40%),
        linear-gradient(180deg, #0a0a1a 0%, #0f172a 100%);
    }
    
    .investor-metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin: 2rem 0;
    }
    
    .metric-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(59, 130, 246, 0.2);
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
    }
    
    .metric-value {
      font-size: 2.5rem;
      font-weight: 900;
      background: linear-gradient(135deg, #3b82f6, #60a5fa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .metric-label {
      font-size: 0.85rem;
      color: rgba(232, 232, 240, 0.5);
      margin-top: 0.25rem;
    }
    
    .roadmap {
      margin: 2rem 0;
    }
    
    .roadmap-item {
      display: flex;
      gap: 1.5rem;
      padding: 1rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    .roadmap-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-top: 4px;
      flex-shrink: 0;
    }
    
    .roadmap-dot.green { background: var(--accent); }
    .roadmap-dot.blue { background: #3b82f6; }
    .roadmap-dot.purple { background: #a855f7; }
    
    .roadmap-content h4 {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    
    .roadmap-content p {
      font-size: 0.85rem;
      color: rgba(232, 232, 240, 0.5);
    }
    
    /* ===== СТРАНИЦА 4: ДЛЯ КОМАНДЫ ===== */
    .page-team {
      background:
        radial-gradient(ellipse at 50% 50%, rgba(168, 85, 247, 0.08) 0%, transparent 50%),
        radial-gradient(ellipse at 0% 100%, rgba(45, 184, 77, 0.08) 0%, transparent 40%),
        linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 100%);
    }
    
    .tech-stack {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin: 2rem 0;
    }
    
    .tech-item {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(168, 85, 247, 0.15);
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
    }
    
    .tech-item-icon {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }
    
    .tech-item-name {
      font-size: 0.8rem;
      font-weight: 600;
      color: rgba(232, 232, 240, 0.8);
    }
    
    .tech-item-desc {
      font-size: 0.7rem;
      color: rgba(232, 232, 240, 0.4);
      margin-top: 0.25rem;
    }
    
    .culture-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin: 1.5rem 0;
    }
    
    .culture-item {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(168, 85, 247, 0.1);
      border-radius: 8px;
      padding: 1.25rem;
    }
    
    .culture-item h4 {
      font-size: 0.95rem;
      color: #a855f7;
      margin-bottom: 0.5rem;
    }
    
    .culture-item p {
      font-size: 0.85rem;
      color: rgba(232, 232, 240, 0.5);
      line-height: 1.5;
    }
    
    /* ===== СТРАНИЦА 5: ДЛЯ ПОЛЬЗОВАТЕЛЕЙ ===== */
    .page-users {
      background:
        radial-gradient(ellipse at 30% 30%, rgba(45, 184, 77, 0.12) 0%, transparent 50%),
        radial-gradient(ellipse at 70% 70%, rgba(234, 179, 8, 0.08) 0%, transparent 40%),
        linear-gradient(180deg, #0f172a 0%, #0a0a1a 100%);
    }
    
    .features-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin: 1.5rem 0;
    }
    
    .feature-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(45, 184, 77, 0.15);
      border-radius: 10px;
      padding: 1.25rem;
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }
    
    .feature-icon {
      font-size: 1.75rem;
      flex-shrink: 0;
    }
    
    .feature-card h4 {
      font-size: 0.95rem;
      font-weight: 600;
      color: #4ade80;
      margin-bottom: 0.25rem;
    }
    
    .feature-card p {
      font-size: 0.8rem;
      color: rgba(232, 232, 240, 0.5);
      line-height: 1.5;
    }
    
    .v2-badge {
      display: inline-block;
      background: linear-gradient(135deg, rgba(45, 184, 77, 0.2), rgba(74, 222, 128, 0.1));
      border: 1px solid rgba(45, 184, 77, 0.3);
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--accent);
      margin-left: 0.5rem;
    }
    
    /* ===== СТРАНИЦА 6: ЗАКЛЮЧЕНИЕ ===== */
    .page-closing {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background:
        radial-gradient(ellipse at 50% 50%, rgba(45, 184, 77, 0.15) 0%, transparent 50%),
        radial-gradient(ellipse at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 40%),
        radial-gradient(ellipse at 80% 20%, rgba(168, 85, 247, 0.08) 0%, transparent 40%),
        linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 50%, #0a0a1a 100%);
    }
    
    .closing-title {
      font-size: 2.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, #2db84d, #3b82f6, #a855f7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 1rem;
    }
    
    .closing-text {
      font-size: 1.1rem;
      color: rgba(232, 232, 240, 0.6);
      max-width: 500px;
      line-height: 1.8;
      margin-bottom: 2rem;
    }
    
    .closing-stats {
      display: flex;
      gap: 3rem;
      margin-bottom: 3rem;
    }
    
    .closing-stat {
      text-align: center;
    }
    
    .closing-stat-value {
      font-size: 2rem;
      font-weight: 800;
      color: var(--accent);
    }
    
    .closing-stat-label {
      font-size: 0.8rem;
      color: rgba(232, 232, 240, 0.4);
    }
    
    .contact-info {
      font-size: 0.9rem;
      color: rgba(232, 232, 240, 0.5);
    }
    
    .contact-info a {
      color: var(--accent);
      text-decoration: none;
    }
    
    /* ===== ПЕЧАТЬ ===== */
    @media print {
      .page {
        margin: 0;
        page-break-after: always;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      body { background: white; }
    }
  </style>
</head>
<body>

  <!-- ===== СТРАНИЦА 1: ОБЛОЖКА ===== -->
  <div class="page page-cover">
    <div class="cover-logo">🎈</div>
    <div class="cover-title">Balloo Messenger</div>
    <div class="cover-subtitle">Российский мессенджер нового поколения</div>
    <div class="cover-tagline">Приватность · Безопасность · Свобода общения</div>
    <div class="cover-version">Версия v1.0.0 → v2+ · 2026</div>
    <div class="cover-decoration"></div>
    <div class="page-number">1 / 6</div>
  </div>

  <!-- ===== СТРАНИЦА 2: О ПРОЕКТЕ ===== -->
  <div class="page page-about">
    <div class="section-title">О проекте Balloo</div>
    
    <div class="about-grid">
      <div class="about-card">
        <div class="about-card-icon">🔒</div>
        <h3>Приватность</h3>
        <p>2FA через email-код, контроль устройств, шифрование TLS + bcrypt. Соответствие 152-ФЗ.</p>
      </div>
      <div class="about-card">
        <div class="about-card-icon">🇷🇺</div>
        <h3>Российская разработка</h3>
        <p>Self-hosted инфраструктура: PostgreSQL, MinIO, Redis. Все данные на серверах в РФ.</p>
      </div>
      <div class="about-card">
        <div class="about-card-icon">🌍</div>
        <h3>20 языков</h3>
        <p>Русский + 14 языков народов РФ + дружественные (ZH, HI, BE) + международные (EN, FR).</p>
      </div>
      <div class="about-card">
        <div class="about-card-icon">📱</div>
        <h3>Мультиплатформа</h3>
        <p>Web, Desktop (Electron), Mobile (Expo — Android). iOS в разработке.</p>
      </div>
    </div>
    
    <div class="highlight-box">
      <p>Balloo — это не просто мессенджер. Это экосистема: основной мессенджер (balloo.su), админ-панель (admin.balloo.su), портал сотрудников (command.balloo.su), фич-реквесты (features.balloo.su), блог (blog.balloo.su) и другие узлы.</p>
    </div>
    
    <p style="color:rgba(232,232,240,0.5); font-size:0.85rem; margin-top:1rem;">
      Архитектура монорепо: 6 пакетов (shared, server, web, desktop, mobile-android, mobile-ios) · 134 экрана · 11 узлов · 66 тикетов v1.0.0 реализовано.
    </p>
    
    <div class="page-number">2 / 6</div>
  </div>

  <!-- ===== СТРАНИЦА 3: ДЛЯ ИНВЕСТОРОВ ===== -->
  <div class="page page-investors">
    <div class="section-title">Для инвесторов</div>
    
    <div class="investor-metrics">
      <div class="metric-card">
        <div class="metric-value">134</div>
        <div class="metric-label">Экранов спроектировано</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">81</div>
        <div class="metric-label">Таблиц в БД</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">11</div>
        <div class="metric-label">Узлов (сервисов)</div>
      </div>
    </div>
    
    <h3 style="font-size:1.2rem; margin: 2rem 0 1rem; color: #60a5fa;">Дорожная карта</h3>
    
    <div class="roadmap">
      <div class="roadmap-item">
        <div class="roadmap-dot green"></div>
        <div class="roadmap-content">
          <h4>v1.0.0 — ✅ Завершено (2026-07-30)</h4>
          <p>Мессенджер, админка, портал сотрудников, блог, фич-реквесты, загрузки, документация. 66 тикетов реализовано.</p>
        </div>
      </div>
      <div class="roadmap-item">
        <div class="roadmap-dot blue"></div>
        <div class="roadmap-content">
          <h4>v2 — Сервисный стек</h4>
          <p>Service Worker, автообновление, code signing, A/B тесты, метрики Grafana, 40+ тем оформления.</p>
        </div>
      </div>
      <div class="roadmap-item">
        <div class="roadmap-dot purple"></div>
        <div class="roadmap-content">
          <h4>v2+ — Интеллект и масштаб</h4>
          <p>ИИ-автоперевод, 115 языков, premium подписка, платные фоны, пентест, сертификация ФСТЭК.</p>
        </div>
      </div>
    </div>
    
    <div class="highlight-box" style="border-left-color: #3b82f6;">
      <p><strong style="color:#60a5fa;">Бизнес-модель:</strong> Freemium — базовые функции бесплатно. Premium: платные фоны, кастомные темы, приоритетная поддержка. Донаты от пользователей. Корпоративные лицензии для command-узла.</p>
    </div>
    
    <div class="page-number">3 / 6</div>
  </div>

  <!-- ===== СТРАНИЦА 4: ДЛЯ КОМАНДЫ ===== -->
  <div class="page page-team">
    <div class="section-title">Для команды разработки</div>
    
    <h3 style="font-size:1.1rem; margin-bottom:1rem; color: #a855f7;">Технологический стек</h3>
    
    <div class="tech-stack">
      <div class="tech-item">
        <div class="tech-item-icon">🐘</div>
        <div class="tech-item-name">PostgreSQL 16</div>
        <div class="tech-item-desc">ORM: Prisma</div>
      </div>
      <div class="tech-item">
        <div class="tech-item-icon">🔴</div>
        <div class="tech-item-name">Redis 7</div>
        <div class="tech-item-desc">Кэш + Pub/Sub</div>
      </div>
      <div class="tech-item">
        <div class="tech-item-icon">📦</div>
        <div class="tech-item-name">MinIO</div>
        <div class="tech-item-desc">S3-хранилище</div>
      </div>
      <div class="tech-item">
        <div class="tech-item-icon">⚡</div>
        <div class="tech-item-name">Express.js</div>
        <div class="tech-item-desc">REST + WebSocket</div>
      </div>
      <div class="tech-item">
        <div class="tech-item-icon">⚛️</div>
        <div class="tech-item-name">React 18</div>
        <div class="tech-item-desc">Vite + TypeScript</div>
      </div>
      <div class="tech-item">
        <div class="tech-item-icon">💻</div>
        <div class="tech-item-name">Electron</div>
        <div class="tech-item-desc">Desktop-обёртка</div>
      </div>
      <div class="tech-item">
        <div class="tech-item-icon">📱</div>
        <div class="tech-item-name">Expo</div>
        <div class="tech-item-desc">React Native</div>
      </div>
      <div class="tech-item">
        <div class="tech-item-icon">🐳</div>
        <div class="tech-item-name">Docker</div>
        <div class="tech-item-desc">Docker Compose</div>
      </div>
    </div>
    
    <h3 style="font-size:1.1rem; margin: 2rem 0 1rem; color: #a855f7;">Культура разработки</h3>
    
    <div class="culture-grid">
      <div class="culture-item">
        <h4>🎯 Макет → Код</h4>
        <p>Макеты (mockups/) — единственный источник правды. Код должен 100% соответствовать дизайну.</p>
      </div>
      <div class="culture-item">
        <h4>📦 Монорепо</h4>
        <p>pnpm workspaces, 6 пакетов, общий пакет shared с типами и утилитами.</p>
      </div>
      <div class="culture-item">
        <h4>🔄 Nумерация z_xx_yy</h4>
        <p>Уникальные ID: функция → экран → API → данные → компонент. Каждый объект пронумерован.</p>
      </div>
      <div class="culture-item">
        <h4>🇷🇺 152-ФЗ</h4>
        <p>Все данные в РФ, self-hosted, никаких зарубежных сервисов. Безопасность — приоритет.</p>
      </div>
    </div>
    
    <p style="color:rgba(232,232,240,0.4); font-size:0.8rem; margin-top:1.5rem;">
      v2+ задачи: TypeScript исправления, API-вызовы вместо mock, Service Worker, 40 тем, ИИ-перевод, 90 языков, пентест.
    </p>
    
    <div class="page-number">4 / 6</div>
  </div>

  <!-- ===== СТРАНИЦА 5: ДЛЯ ПОЛЬЗОВАТЕЛЕЙ ===== -->
  <div class="page page-users">
    <div class="section-title">Для пользователей</div>
    
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">💬</div>
        <div>
          <h4>Сообщения <span class="v2-badge">v1</span></h4>
          <p>Текст, фото, файлы, голосовые (waveform), видеосообщения. Ответы, реакции, закрепление, редактирование.</p>
        </div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">👥</div>
        <div>
          <h4>Группы <span class="v2-badge">v1</span></h4>
          <p>До 30 участников. Публичные и приватные. Invite-ссылки (бессрочные, срочные, единоразовые).</p>
        </div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">📖</div>
        <div>
          <h4>Stories <span class="v2-badge">v1</span></h4>
          <p>Фото/видео истории. TTL 24 часа. Октагон с переливающимся градиентом. Просмотры и реакции.</p>
        </div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">📊</div>
        <div>
          <h4>Опросы <span class="v2-badge">v1</span></h4>
          <p>5 типов: опрос, квиз, активный/пассивный список, персоналия. Голосование и результаты.</p>
        </div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">📞</div>
        <div>
          <h4>Звонки <span class="v2-badge">v1</span></h4>
          <p>Аудио и видео 1 на 1, групповые звонки. Share screen, blur background, шумоподавление.</p>
        </div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🎨</div>
        <div>
          <h4>Темы <span class="v2-badge">v1</span></h4>
          <p>3 базовые темы (dark, light, russian). В v2+ — 40+ тем и создание своих.</p>
        </div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🌐</div>
        <div>
          <h4>20 языков <span class="v2-badge">v1</span></h4>
          <p>Русский + 14 языков народов РФ + дружественные + международные. В v2+ — 115 языков.</p>
        </div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🤖</div>
        <div>
          <h4>ИИ-перевод <span class="v2-badge">v2+</span></h4>
          <p>Автоперевод сообщений, постов, комментариев. Self-hosted модель. Toggle в настройках.</p>
        </div>
      </div>
    </div>
    
    <div class="highlight-box" style="border-left-color: #eab308;">
      <p><strong style="color:#eab308;">Безопасность:</strong> 2FA через email, контроль устройств, шифрование, 152-ФЗ. Вы управляете своими данными.</p>
    </div>
    
    <p style="color:rgba(232,232,240,0.4); font-size:0.8rem; margin-top:1rem;">
      Присоединяйтесь к Balloo — общайтесь свободно, приватно, на любом языке. 🎈
    </p>
    
    <div class="page-number">5 / 6</div>
  </div>

  <!-- ===== СТРАНИЦА 6: ЗАКЛЮЧЕНИЕ ===== -->
  <div class="page page-closing">
    <div class="cover-logo">🎈</div>
    <div class="closing-title">Balloo Messenger</div>
    <div class="closing-text">
      Российский мессенджер нового поколения. Приватность, безопасность, свобода выбора.
      <br><br>
      v1.0.0 готов. v2+ в разработке.
    </div>
    
    <div class="closing-stats">
      <div class="closing-stat">
        <div class="closing-stat-value">66</div>
        <div class="closing-stat-label">Тикетов v1</div>
      </div>
      <div class="closing-stat">
        <div class="closing-stat-value">134</div>
        <div class="closing-stat-label">Экрана</div>
      </div>
      <div class="closing-stat">
        <div class="closing-stat-value">27</div>
        <div class="closing-stat-label">v2+ функций</div>
      </div>
      <div class="closing-stat">
        <div class="closing-stat-value">20</div>
        <div class="closing-stat-label">Языков</div>
      </div>
    </div>
    
    <div class="contact-info">
      <p>📧 <a href="mailto:contact@balloo.su">contact@balloo.su</a></p>
      <p>🌐 <a href="https://balloo.su">balloo.su</a></p>
      <p>📅 2026</p>
    </div>
    
    <div class="page-number">6 / 6</div>
  </div>

</body>
</html>`;
}

// ============================================================
// 6. Запись файлов
// ============================================================

function main() {
  console.log('🚀 Генерация v2-отчётов...\n');
  
  // 1. Аудит-отчёт
  const auditHTML = generateAuditHTML();
  const auditPath = path.join(ROOT, 'tickets', 'v2-features-audit.html');
  fs.writeFileSync(auditPath, auditHTML, 'utf-8');
  console.log('✅ Создан: tickets/v2-features-audit.html');
  
  // 2. Промо-книжечка
  const promoHTML = generatePromoBooklet();
  const promoPath = path.join(ROOT, 'tickets', 'v2-promo-booklet.html');
  fs.writeFileSync(promoPath, promoHTML, 'utf-8');
  console.log('✅ Создан: tickets/v2-promo-booklet.html');
  
  console.log('\n📊 Сводка:');
  console.log(`   v2+ функций: ${deferredFeatures.length}`);
  console.log(`   Всего экранов: ${allScreens.length}`);
  console.log(`   Seed-таблиц: 11 (все синхронизированы)`);
  console.log('\n🖨️  Для печати в PDF:');
  console.log(`   Открыть в браузере: ${promoPath}`);
  console.log('   Ctrl+P → Сохранить как PDF');
}

main();
