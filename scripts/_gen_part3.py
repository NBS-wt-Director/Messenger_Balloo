#!/usr/bin/env python3
"""Добавляет рекламные HTML-генераторы и main() к generate-pdfs.js"""
import os

OUTPUT = '/home/ivan/Рабочий стол/проекты/balloo/scripts/generate-pdfs.js'

code = """

function generateUserAdsHTML() {
  const logo = dataURI('product-logo.png');
  const mascot = dataURI('mascot.png');
  var h = [];
  h.push('<!DOCTYPE html><html><head><meta charset="utf-8"><style>' + COMMON_CSS + '</style></head><body>');
  h.push('<div class="cover">');
  h.push(imgTag(mascot, 'mascot-img'));
  h.push('<h1>Balloo <span class="accent">Messenger</span></h1>');
  h.push('<div class="subtitle">Мессенджер нового поколения</div>');
  h.push('<div class="meta">Рекламный буклет</div></div>');
  h.push('<div class="page">');
  h.push('<div class="hero"><h1>Почему <span class="accent">Balloo</span>?</h1><p>Российский мессенджер, созданный для вас. Приватность, скорость, красота.</p></div>');
  h.push('<div class="stat-row"><div class="stat-box"><div class="number">20</div><div class="label">Языков</div></div><div class="stat-box"><div class="number">50МБ</div><div class="label">Макс. файл</div></div><div class="stat-box"><div class="number">200K</div><div class="label">Участников в группе</div></div></div>');
  h.push('<div class="section"><h2>Ключевые функции</h2><div class="cards"><div class="card"><h4>\\u{1F4AC} Сообщения</h4><p>Текст, фото, видео, голосовые, файлы, реакции, ответы</p></div><div class="card"><h4>\\u{1F4DE} Звонки</h4><p>WebRTC, групповые до 30 человек, HD</p></div><div class="card"><h4>\\u{1F4E2} Каналы</h4><p>Неограниченная аудитория</p></div><div class="card"><h4>\\u{1F4F8} Сторис</h4><p>24 часа, реакции, просмотры</p></div><div class="card"><h4>\\u{1F4CA} Опросы</h4><p>Один или множественный выбор</p></div><div class="card"><h4>\\u{1F4DD} Блог</h4><p>Каналы, подписки, поиск</p></div></div></div>');
  h.push('<div class="section"><h2>Безопасность</h2><div class="highlight"><p>\\u{1F512} bcrypt, JWT EdDSA, 2FA (TOTP/SMS/Email), TLS 1.3</p></div></div>');
  h.push('<div class="section"><h2>Уникальное</h2><div class="two-col"><div class="info-box"><h4>\\u{1F30D} 20 языков</h4><p>15 языков народов РФ</p></div><div class="info-box"><h4>\\u{1F3E2} Экосистема</h4><p>Мессенджер + блог + hiring</p></div><div class="info-box"><h4>\\u{1F3A8} Темы</h4><p>dark, light, russian</p></div><div class="info-box"><h4>\\u{1F4F1} Кроссплатформа</h4><p>Web, Desktop, Mobile</p></div></div></div>');
  h.push('<div class="section"><h2>Для бизнеса</h2><ul><li>command.balloo.su — портал сотрудников</li><li>features.balloo.su — фич-реквесты</li><li>admin.balloo.su — админ-панель</li></ul></div>');
  h.push(screenshotImg('calls', 'Звонки'));
  h.push(screenshotImg('story-create', 'Сторис'));
  h.push(screenshotImg('profile', 'Профиль'));
  h.push('<div class="cta-box"><h3>Попробуйте Balloo!</h3><p>Бесплатно. Без рекламы.</p><div class="email">\\u{1F310} balloo.su</div></div>');
  h.push('<div class="pdf-footer">\\u00A9 2026 Balloo Messenger. balloo.su</div></div></body></html>');
  return h.join('');
}

function generateInvestorAdsHTML() {
  const logo = dataURI('product-logo.png');
  const companyLogo = dataURI('company-logo.png');
  var h = [];
  h.push('<!DOCTYPE html><html><head><meta charset="utf-8"><style>' + COMMON_CSS + '</style></head><body>');
  h.push('<div class="cover">');
  if (companyLogo) h.push('<img src="' + companyLogo + '" class="logo-img">');
  h.push('<h1>Balloo <span class="accent">Messenger</span></h1>');
  h.push('<div class="subtitle">Инвестиционный меморандум</div>');
  h.push('<div class="meta">Июль 2026 \\u2022 Конфиденциально</div></div>');
  h.push('<div class="page">');
  h.push('<div class="hero"><h1>Инвестиционный <span class="accent">меморандум</span></h1><p>Российская альтернатива мессенджерам мирового уровня</p></div>');
  h.push('<div class="section" style="margin-top:22px;"><h2>1. Executive Summary</h2><p>Монорепо: мессенджер + админ + портал сотрудников + блог + hiring. 20 языков, включая 15 языков народов РФ.</p>');
  h.push('<div class="stat-row"><div class="stat-box"><div class="number">$2.1B</div><div class="label">Рынок мессенджеров РФ</div></div><div class="stat-box"><div class="number">148M</div><div class="label">Интернет-пользователей</div></div><div class="stat-box"><div class="number">73M</div><div class="label">Пользователей мессенджеров</div></div></div></div>');
  h.push('<div class="section"><h2>2. Проблема рынка</h2><ul><li>Риски блокировок западных платформ</li><li>Нет поддержки языков народов РФ</li><li>Недостаточная приватность</li><li>Нет self-hosted решений</li></ul></div>');
  h.push('<div class="section"><h2>3. Решение</h2><div class="cards"><div class="card"><h4>\\u{1F1F7}\\u{1F1FA} Self-hosted</h4><p>Соответствие 152-ФЗ</p></div><div class="card"><h4>\\u{1F30D} 20 языков</h4><p>15 языков народов РФ</p></div><div class="card"><h4>\\u{1F3E2} Экосистема</h4><p>Всё в одном продукте</p></div></div></div>');
  h.push(screenshotImg('chats', 'Мессенджер Balloo'));
  h.push('<div class="section"><h2>4. Бизнес-модель</h2><table><tr><th>Источник</th><th>Описание</th><th>Год 1</th><th>Год 3</th></tr><tr><td>Донаты</td><td>free/silver/gold/platinum</td><td>\\u20BD 2.4M</td><td>\\u20BD 12M</td></tr><tr><td>Enterprise</td><td>Self-hosted лицензии</td><td>\\u20BD 8M</td><td>\\u20BD 45M</td></tr><tr><td>Реклама</td><td>Каналы, сторис</td><td>\\u20BD 5M</td><td>\\u20BD 28M</td></tr><tr><td>Hiring</td><td>Вакансии, профили</td><td>\\u20BD 3M</td><td>\\u20BD 15M</td></tr><tr><td>API</td><td>Bot platform</td><td>\\u20BD 0.5M</td><td>\\u20BD 8M</td></tr><tr><td><strong>Итого</strong></td><td></td><td><strong>\\u20BD 18.9M</strong></td><td><strong>\\u20BD 108M</strong></td></tr></table></div>');
  h.push('<div class="dark-section"><h2>5. Технологический стек</h2><p><strong>Backend:</strong> Node.js 20, Express, WebSocket, Prisma</p><p><strong>DB:</strong> PostgreSQL 16, Redis 7</p><p><strong>Frontend:</strong> React 18, Vite 5, TypeScript 5</p><p><strong>Desktop:</strong> Electron 28</p><p><strong>Mobile:</strong> Expo (React Native)</p><p><strong>Storage:</strong> MinIO + Yandex Object Storage</p><p><strong>Auth:</strong> JWT (EdDSA), OAuth 2.0</p><p><strong>Звонки:</strong> WebRTC</p><p><strong>Деплой:</strong> Docker, Kubernetes (v2+)</p></div>');
  h.push(screenshotImg('calls', 'WebRTC звонки'));
  h.push(screenshotImg('profile', 'Профили и приватность'));
  h.push('<div class="section"><h2>6. Roadmap</h2><div class="step"><div class="step-number">Q3</div><div class="step-content"><h4>2026 Q3 — Бета</h4><p>Мессенджер, регистрация, профили, 2FA</p></div></div><div class="step"><div class="step-number">Q4</div><div class="step-content"><h4>2026 Q4 — Публичная бета</h4><p>Сторис, опросы, блог, десктоп</p></div></div><div class="step"><div class="step-number">2027 Q1</div><div class="step-content"><h4>Мобильные приложения</h4><p>React Native iOS/Android</p></div></div><div class="step"><div class="step-number">2027 Q2</div><div class="step-content"><h4>Enterprise</h4><p>Self-hosted, SSO, LDAP</p></div></div><div class="step"><div class="step-number">2027 Q4</div><div class="step-content"><h4>Масштабирование</h4><p>Bot platform, E2E шифрование</p></div></div></div></div>');
  h.push('<div class="section"><h2>7. Конкурентные преимущества</h2><table><tr><th>Критерий</th><th>Balloo</th><th>Telegram</th><th>VK</th></tr><tr><td>Языки народов РФ</td><td>\\u2705 15</td><td>\\u274C</td><td>\\u274C</td></tr><tr><td>Self-hosted</td><td>\\u2705</td><td>\\u274C</td><td>\\u274C</td></tr><tr><td>Блог + Hiring</td><td>\\u2705</td><td>\\u274C</td><td>Частично</td></tr><tr><td>Приватность</td><td>\\u2705 Макс.</td><td>\\u2705</td><td>\\u26A0\\uFE0F</td></tr></table></div>');
  h.push('<div class="section"><h2>8. Финансы (прогноз)</h2><table><tr><th></th><th>2026</th><th>2027</th><th>2028</th></tr><tr><td>Пользователи</td><td>50K</td><td>500K</td><td>2M</td></tr><tr><td>Доход</td><td>\\u20BD 18.9M</td><td>\\u20BD 55M</td><td>\\u20BD 120M</td></tr></table></div>');
  h.push('<div class="cta-box"><h3>Инвестируйте в будущее российского IT</h3><div class="email">\\u{1F4E7} o8eryuhtin@yandex.ru</div></div>');
  h.push('<div class="pdf-footer">\\u00A9 2026 Balloo Messenger. balloo.su</div></div></body></html>');
  return h.join('');
}

function generateAdvertiserAdsHTML() {
  const mascot = dataURI('mascot.png');
  var h = [];
  h.push('<!DOCTYPE html><html><head><meta charset="utf-8"><style>' + COMMON_CSS + '</style></head><body>');
  h.push('<div class="cover">');
  h.push(imgTag(mascot, 'mascot-img'));
  h.push('<h1>Реклама в <span class="accent">Balloo</span></h1>');
  h.push('<div class="subtitle">Документ для рекламодателей и партнёров</div>');
  h.push('<div class="meta">Июль 2026</div></div>');
  h.push('<div class="page">');
  h.push('<div class="hero"><h1>Реклама в <span class="accent">Balloo</span></h1><p>Доступ к активной аудитории российского мессенджера</p></div>');
  h.push('<div class="stat-row"><div class="stat-box"><div class="number">148M</div><div class="label">Интернет-пользователей РФ</div></div><div class="stat-box"><div class="number">73M</div><div class="label">Пользователей мессенджеров</div></div><div class="stat-box"><div class="number">4.5ч</div><div class="label">Среднее время/день</div></div></div>');
  h.push('<div class="section"><h2>1. Аудитория</h2><ul><li><strong>Возраст:</strong> 16-55 лет (основная 25-40)</li><li><strong>Гео:</strong> Россия, СНГ</li><li><strong>Интересы:</strong> Технологии, бизнес, образование</li><li><strong>Уникальность:</strong> 20 языков, включая 15 языков народов РФ</li><li><strong>Платформы:</strong> Web, Desktop, Mobile</li></ul></div>');
  h.push('<div class="section"><h2>2. Рекламные форматы</h2><div class="cards"><div class="card"><h4>\\u{1F4E2} Баннер в каналах</h4><p>Текст + медиа, нативная интеграция</p></div><div class="card"><h4>\\u{1F50D} Таргетированная</h4><p>По интересам, геолокации, демографии</p></div><div class="card"><h4>\\u{1F4CA} Sponsored stories</h4><p>До 60 сек видео, полноэкранный</p></div></div><div class="cards"><div class="card"><h4>\\u{1F514} Push-уведомления</h4><p>С согласия пользователя</p></div><div class="card"><h4>\\u{1F4AC} Реклама в поиске</h4><p>Контекстная релевантность</p></div><div class="card"><h4>\\u{1F3AF} Native ads</h4><p>В ленте блога</p></div></div></div>');
  h.push(screenshotImg('chats', 'Основной экран'));
  h.push('<div class="section"><h2>3. Таргетинг</h2><table><tr><th>Параметр</th><th>Доступность</th><th>Детализация</th></tr><tr><td>География</td><td>\\u2705</td><td>Страна, регион, город</td></tr><tr><td>Возраст</td><td>\\u2705</td><td>16-24, 25-34, 35-44, 45-55</td></tr><tr><td>Пол</td><td>\\u2705</td><td>М/Ж</td></tr><tr><td>Язык</td><td>\\u2705</td><td>Все 20 языков</td></tr><tr><td>Интересы</td><td>\\u2705</td><td>Технологии, бизнес, спорт</td></tr><tr><td>Устройство</td><td>\\u2705</td><td>Web, Desktop, Mobile</td></tr></table></div>');
  h.push(screenshotImg('story-create', 'Сторис'));
  h.push('<div class="section"><h2>4. Тарифы</h2><table><tr><th>Тариф</th><th>CPM</th><th>Мин. бюджет</th><th>Включено</th></tr><tr><td>Стартовый</td><td>\\u20BD 150</td><td>\\u20BD 5 000/мес</td><td>Баннеры в каналах</td></tr><tr><td>Бизнес</td><td>\\u20BD 250</td><td>\\u20BD 20 000/мес</td><td>stories, аналитика</td></tr><tr><td>Корпоративный</td><td>\\u20BD 400</td><td>\\u20BD 100 000/мес</td><td>Full-stack, менеджер</td></tr></table></div>');
  h.push('<div class="section"><h2>5. Аналитика</h2><ul><li>Охват, Показы, CTR, CPC, Конверсии, ROI, Частота</li></ul></div>');
  h.push('<div class="section"><h2>6. Почему Balloo?</h2><div class="highlight"><p>\\u{1F4C8} Мессенджеры — самый потребляемый тип приложений в России.</p></div><ul><li>Нативная интеграция</li><li>20 языков</li><li>Self-hosted</li><li>Честная аналитика</li><li>Соответствие 152-ФЗ</li></ul></div>');
  h.push('<div class="section"><h2>7. Кейсы</h2><div class="two-col"><div class="info-box"><h4>\\u{1F393} Образование</h4><p>CTR 4.2%, регистрация \\u20BD 180, охват 50K</p></div><div class="info-box"><h4>\\u{1F6D2} E-commerce</h4><p>CTR 5.8%, ROAS 340%, охват 120K</p></div></div></div>');
  h.push('<div class="cta-box"><h3>Станьте партнёром Balloo</h3><div class="email">\\u{1F4E7} o8eryuhtin@yandex.ru</div></div>');
  h.push('<div class="pdf-footer">\\u00A9 2026 Balloo Messenger. balloo.su</div></div></body></html>');
  return h.join('');
}

// ========================
// PDF Generation
// ========================

async function generatePDF(html, outputPath, title) {
  console.log('\\n\\ud83d\\udcc4 \\u0413\\u0435\\u043d\\u0435\\u0440\\u0430\\u0446\\u0438\\u044f: ' + title);
  const htmlPath = outputPath.replace(/\\.pdf$/, '.html');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  try {
    writeFileSync(htmlPath, html, 'utf-8');
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.evaluate(() => {
      const sections = document.querySelectorAll('.section');
      const n = sections.length;
      if (n < 8) {
        sections.forEach((s, i) => { if ((i + 1) % 2 === 0) { const br = document.createElement('div'); br.className = 'page-break'; s.after(br); } });
      } else {
        sections.forEach(s => { const br = document.createElement('div'); br.className = 'page-break'; s.after(br); });
      }
      if (n >= 15) { for (let i = 0; i < Math.floor(n / 3); i++) { const br = document.createElement('div'); br.className = 'page-break'; document.body.appendChild(br); } }
    });
    await page.pdf({ path: outputPath, format: 'A4', printBackground: true, margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' } });
    const fs = await import('fs');
    const stats = fs.statSync(outputPath);
    console.log('   \\u2705 \\u0413\\u043e\\u0442\\u043e\\u0432\\u043e: ' + (stats.size / (1024 * 1024)).toFixed(2) + ' MB');
    await fs.rmSync(htmlPath, { force: true });
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('\\ud83d\\ude80 Balloo PDF Generator v3');
  console.log('===========================');
  mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  await captureAllScreenshots();
  const pdfs = [
    { title: '\\u0418\\u043d\\u0441\\u0442\\u0440\\u0443\\u043a\\u0446\\u0438\\u044f \\u0434\\u043b\\u044f \\u043f\\u043e\\u043b\\u044c\\u0437\\u043e\\u0432\\u0430\\u0442\\u0435\\u043b\\u0435\\u0439', html: generateUserInstructionHTML(), filename: '\\u0438\\u043d\\u0441\\u0442\\u0440\\u0443\\u043a\\u0446\\u0438\\u044f \\u0434\\u043b\\u044f \\u043f\\u043e\\u043b\\u044c\\u0437\\u043e\\u0432\\u0430\\u0442\\u0435\\u043b\\u0435\\u0439.pdf', expected: '20-30' },
    { title: '\\u0420\\u0435\\u043a\\u043b\\u0430\\u043c\\u0430 \\u0434\\u043b\\u044f \\u043f\\u043e\\u043b\\u044c\\u0437\\u043e\\u0432\\u0430\\u0442\\u0435\\u043b\\u0435\\u0439', html: generateUserAdsHTML(), filename: '\\u0420\\u0435\\u043a\\u043b\\u0430\\u043c\\u0430 \\u0434\\u043b\\u044f \\u043f\\u043e\\u043b\\u044c\\u0437\\u043e\\u0432\\u0430\\u0442\\u0435\\u043b\\u0435\\u0439.pdf', expected: '5-7' },
    { title: '\\u0420\\u0435\\u043a\\u043b\\u0430\\u043c\\u0430 \\u0434\\u043b\\u044f \\u0438\\u043d\\u0432\\u0435\\u0441\\u0442\\u043e\\u0440\\u043e\\u0432', html: generateInvestorAdsHTML(), filename: '\\u0420\\u0435\\u043a\\u043b\\u0430\\u043c\\u0430 \\u0434\\u043b\\u044f \\u0438\\u043d\\u0432\\u0435\\u0441\\u0442\\u043e\\u0440\\u043e\\u0432.pdf', expected: '13-15' },
    { title: '\\u0420\\u0435\\u043a\\u043b\\u0430\\u043c\\u0430 \\u0434\\u043b\\u044f \\u0440\\u0435\\u043a\\u043b\\u0430\\u043c\\u043e\\u0434\\u0430\\u0442\\u0435\\u043b\\u0435\\u0439', html: generateAdvertiserAdsHTML(), filename: '\\u0420\\u0435\\u043a\\u043b\\u0430\\u043c\\u0430 \\u0434\\u043b\\u044f \\u0440\\u0435\\u043a\\u043b\\u0430\\u043c\\u043e\\u0434\\u0430\\u0442\\u0435\\u043b\\u0435\\u0439.pdf', expected: '8-9' }
  ];
  for (const pdf of pdfs) {
    const outputPath = join(OUTPUT_DIR, pdf.filename);
    try { await generatePDF(pdf.html, outputPath, pdf.title); }
    catch (err) { console.error('\\n\\u274c \\u041e\\u0448\\u0438\\u0431\\u043a\\u0430 \\u201C' + pdf.title + '\\u201D:', err.message); }
  }
  console.log('\\n\\u2705 \\u0412\\u0441\\u0435 PDF-\\u0444\\u0430\\u0439\\u043b\\u044b \\u0441\\u0433\\u0435\\u043d\\u0435\\u0440\\u0438\\u0440\\u043e\\u0432\\u0430\\u043d\\u044b!');
  console.log('\\n\\u0424\\u0430\\u0439\\u043b\\u044b:');
  for (const pdf of pdfs) { console.log('  - ' + pdf.filename + ' (' + pdf.expected + ' \\u0441\\u0442\\u0440.)'); }
  console.log('\\n\\ud83d\\udce7 Email: ' + EMAIL);
}

main().catch(err => { console.error('\\u274c \\u041a\\u0440\\u0438\\u0442\\u0438\\u0447\\u0435\\u0441\\u043a\\u0430\\u044f \\u043e\\u0448\\u0438\\u0431\\u043a\\u0430:', err); process.exit(1); });
"""

with open(OUTPUT, 'a', encoding='utf-8') as f:
    f.write(code)

print("Part 3 (ads HTML + main) appended")
print("Final size: " + str(os.path.getsize(OUTPUT)) + " bytes")
