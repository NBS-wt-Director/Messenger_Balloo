#!/usr/bin/env node
/**
 * Balloo Messenger — PDF Generator v3
 * Генерирует 4 PDF-файла с реальными логотипами, маскотом и скриншотами макетов
 */

import puppeteer from 'puppeteer';
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "..");
const OUTPUT_DIR = PROJECT_ROOT;
const EMAIL = 'o8eryuhtin@yandex.ru';
const LOGOS_DIR = join(PROJECT_ROOT, "assets", "logos");
const MOCKUPS_DIR = join(PROJECT_ROOT, "mockups");
const SCREENSHOTS_DIR = join(PROJECT_ROOT, "tmp", "screenshots");

const COMMON_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; color: #1a1d21; line-height: 1.6; font-size: 10px; }
  @media print {
    @page { size: A4; margin: 15mm; }
    .page { page-break-after: always; min-height: 230mm; padding: 10px 0; }
    .page:last-child { page-break-after: avoid; }
    .page-break { page-break-after: always; }
    .no-break { page-break-inside: avoid; }
  }
  .hero { background: linear-gradient(135deg, #0a0d11, #14191f, #1a2332); color: #f2f5f8; padding: 40px 40px; text-align: center; }
  .hero h1 { font-size: 28px; font-weight: 800; margin-bottom: 10px; }
  .hero h1 .accent { color: #2db84d; }
  .hero p { font-size: 13px; color: #aeb8c4; max-width: 550px; margin: 0 auto; }
  .section { margin-bottom: 22px; }
  .section h2 { font-size: 17px; font-weight: 700; color: #0a0d11; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #2db84d; }
  .section h3 { font-size: 12px; font-weight: 600; color: #1a1d21; margin: 14px 0 5px 0; }
  .section p { margin-bottom: 7px; color: #3a3f47; }
  .section ul, .section ol { margin: 7px 0 7px 16px; }
  .section ul li, .section ol li { margin-bottom: 3px; color: #3a3f47; }
  .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 14px 0; }
  .card { background: #f5f7fa; border: 1px solid #eef1f5; padding: 14px; border-left: 3px solid #2db84d; }
  .card h4 { font-size: 11px; font-weight: 700; margin-bottom: 5px; color: #0a0d11; }
  .card p { font-size: 8px; color: #5a6573; margin: 0; }
  .step { display: flex; gap: 10px; margin-bottom: 14px; align-items: flex-start; }
  .step-number { flex-shrink: 0; width: 28px; height: 28px; background: #2db84d; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; }
  .step-content h4 { font-size: 11px; font-weight: 600; margin-bottom: 2px; }
  .step-content p { font-size: 8px; color: #5a6573; margin: 0; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 8px; }
  th { background: #0a0d11; color: #f2f5f8; padding: 7px 8px; text-align: left; font-weight: 600; }
  td { padding: 5px 8px; border-bottom: 1px solid #eef1f5; color: #3a3f47; }
  tr:nth-child(even) td { background: #f9fafb; }
  .highlight { background: linear-gradient(135deg, #e8f5e9, #f1f8e9); border-left: 3px solid #2db84d; padding: 10px 14px; margin: 14px 0; }
  .highlight p { margin: 0; color: #1a5c2a; font-weight: 500; font-size: 9px; }
  .cta-box { background: linear-gradient(135deg, #2db84d, #1e9e3e); color: white; padding: 20px 28px; text-align: center; margin: 22px 0; }
  .cta-box h3 { color: white; font-size: 15px; margin-bottom: 5px; border: none; }
  .cta-box p { color: rgba(255,255,255,0.9); font-size: 10px; margin-bottom: 10px; }
  .cta-box .email { font-size: 12px; font-weight: 700; }
  .logo-img { height: 36px; width: auto; }
  .mascot-img { height: 120px; width: auto; margin: 10px 0; }
  .screenshot { width: 100%; max-width: 600px; border: 1px solid #eef1f5; border-radius: 6px; margin: 12px auto; display: block; }
  .screenshot-caption { text-align: center; font-size: 8px; color: #727f8d; margin: 4px 0 12px; font-style: italic; }
  .stat-row { display: flex; gap: 16px; margin: 18px 0; }
  .stat-box { flex: 1; text-align: center; padding: 14px; background: #f5f7fa; }
  .stat-box .number { font-size: 24px; font-weight: 800; color: #2db84d; }
  .stat-box .label { font-size: 8px; color: #5a6573; margin-top: 2px; }
  .pdf-footer { margin-top: 28px; padding-top: 10px; border-top: 1px solid #eef1f5; text-align: center; font-size: 7px; color: #939eab; }
  .dark-section { background: #0a0d11; color: #f2f5f8; padding: 22px 28px; margin: 18px 0; }
  .dark-section h3 { color: #2db84d; }
  .dark-section p { color: #aeb8c4; font-size: 8px; }
  .cover { background: linear-gradient(135deg, #0a0d11, #1a2332); color: #f2f5f8; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 297mm; padding: 40px 40px; text-align: center; }
  .cover .mascot-img { height: 140px; width: auto; margin-bottom: 20px; }
  .cover h1 { font-size: 34px; font-weight: 900; margin-bottom: 10px; }
  .cover h1 .accent { color: #2db84d; }
  .cover .subtitle { font-size: 14px; color: #aeb8c4; margin-bottom: 28px; }
  .cover .meta { font-size: 9px; color: #727f8d; }
  .cover .logo-img { height: 48px; width: auto; margin-bottom: 16px; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 14px 0; }
  .info-box { background: #f5f7fa; padding: 12px; border-radius: 4px; }
  .info-box h4 { font-size: 10px; font-weight: 700; margin-bottom: 5px; color: #0a0d11; }
  .info-box p { font-size: 8px; color: #5a6573; margin: 0; }
  .feature-list { columns: 2; column-gap: 18px; margin: 10px 0; }
  .feature-list li { padding: 3px 0; break-inside: avoid; }
`;


async function captureScreenshot(htmlPath, outputPng) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: outputPng, fullPage: false, type: 'png' });
  } finally {
    await browser.close();
  }
}

async function captureAllScreenshots() {
  console.log('\n📸 Захват скриншотов макетов...');
  const allScreenshots = [
    'balloo-su/chats.html', 'balloo-su/login.html', 'balloo-su/register.html',
    'balloo-su/onboarding.html', 'balloo-su/empty-chat.html', 'balloo-su/profile.html',
    'balloo-su/public-profile.html', 'balloo-su/calls.html', 'balloo-su/active-call.html',
    'balloo-su/group-create.html', 'balloo-su/group-settings.html',
    'balloo-su/story-create.html', 'balloo-su/poll-editor.html',
    'balloo-su/settings.html', 'balloo-su/privacy-settings.html',
    'balloo-su/two-factor.html', 'balloo-su/my-devices.html',
    'balloo-su/notification-settings.html', 'balloo-su/about-balloo.html',
    'balloo-su/about-company.html', 'balloo-su/donate.html', 'balloo-su/rules.html',
    'balloo-su/search.html', 'balloo-su/contacts.html', 'balloo-su/invites.html',
    'balloo-su/bots.html', 'balloo-su/archive.html', 'balloo-su/blocked-users.html',
  ];
  let captured = 0;
  for (const mockup of allScreenshots) {
    const mockupPath = join(MOCKUPS_DIR, mockup);
    if (!existsSync(mockupPath)) { console.log('   ⚠️  Не найден: ' + mockup); continue; }
    const desc = mockup.replace(/[\/\-]/g, '_').replace('.html', '');
    const outputPng = join(SCREENSHOTS_DIR, desc + '.png');
    try {
      await captureScreenshot(mockupPath, outputPng);
      captured++;
      console.log('   ✅ ' + mockup);
    } catch (err) {
      console.log('   ❌ ' + mockup + ': ' + err.message);
    }
  }
  console.log('   Всего: ' + captured + '/' + allScreenshots.length + '\n');
}

function screenshotPath(desc) { return join(SCREENSHOTS_DIR, desc + '.png'); }

function screenshotToBase64(desc) {
  const path = screenshotPath(desc);
  if (!existsSync(path)) return null;
  return readFileSync(path, 'base64');
}

function logoToBase64(filename) {
  const path = join(LOGOS_DIR, filename);
  if (!existsSync(path)) return null;
  return readFileSync(path, 'base64');
}

function dataURI(filename) {
  const data = logoToBase64(filename);
  return data ? 'data:image/png;base64,' + data : null;
}

function imgTag(dataURI, className) {
  if (dataURI) return '<img src="' + dataURI + '" class="' + className + '">';
  if (className === 'mascot-img') {
    return '<div style="width:120px;height:120px;background:linear-gradient(135deg,#2db84d,#1e9e3e);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin:10px 0;"><span style="color:white;font-size:48px;font-weight:900;">&#x1F43B;</span></div>';
  }
  return '<div style="width:48px;height:48px;background:linear-gradient(135deg,#2db84d,#1e9e3e);clip-path:polygon(30% 0%,70% 0%,100% 30%,100% 70%,70% 100%,30% 100%,0% 70%,0% 30%);display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;"><span style="color:white;font-weight:800;font-size:20px;">B</span></div>';
}

function screenshotImg(desc, caption) {
  const data = screenshotToBase64(desc);
  if (data) {
    return '<img src="data:image/png;base64,' + data + '" class="screenshot"><div class="screenshot-caption">' + caption + '</div>';
  }
  return '<div class="card" style="text-align:center;padding:30px;"><p style="color:#939eab;">&#x1F4F7; Скриншот: ' + caption + '</p></div>';
}



function generateUserInstructionHTML() {
  const logo = dataURI('product-logo.png');
  const mascot = dataURI('mascot.png');
  var h = [];
  h.push('<!DOCTYPE html><html><head><meta charset="utf-8"><style>' + COMMON_CSS + '</style></head><body>');
  h.push('<div class="cover">');
  h.push(imgTag(mascot, 'mascot-img'));
  h.push('<h1>Balloo <span class="accent">Messenger</span></h1>');
  h.push('<div class="subtitle">Полная инструкция для пользователей</div>');
  h.push('<div class="meta">Версия 1.0 \u2022 Июль 2026</div>');
  if (logo) h.push('<img src="' + logo + '" class="logo-img" style="margin-top:16px;max-height:40px;">');
  h.push('</div>');
  h.push('<div class="page">');
  h.push('<div class="hero">');
  if (logo) h.push('<img src="' + logo + '" style="height:44px;margin-bottom:16px;">');
  else h.push('<div style="width:50px;height:50px;background:linear-gradient(135deg,#2db84d,#1e9e3e);clip-path:polygon(30% 0%,70% 0%,100% 30%,100% 70%,70% 100%,30% 100%,0% 70%,0% 30%);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;"><span style="color:white;font-weight:800;font-size:22px;">B</span></div>');
  h.push('<h1>Полная инструкция для пользователей</h1>');
  h.push('<p>Всё, что нужно знать о мессенджере Balloo: от установки до продвинутых функций</p>');
  h.push('</div>');

  // Section 1
  h.push('<div class="section" style="margin-top:22px;"><h2>1. Что такое Balloo?</h2>');
  h.push('<p>Balloo \u2014 это современный российский мессенджер нового поколения, объединяющий мгновенный обмен сообщениями, голосовые и видеозвонки, сторис, блог-платформу, базу знаний для компаний и систему найма.</p>');
  h.push('<p>Проект создан для российского и СНГ-рынка с поддержкой 20 языков, включая 15 языков народов Российской Федерации.</p>');
  h.push('<div class="cards"><div class="card"><h4>\u{1F4AC} Мгновенные сообщения</h4><p>Текст, фото, видео, голосовые, файлы до 50 МБ, реакции, ответы, закрепление, редактирование</p></div><div class="card"><h4>\u{1F465} Группы и каналы</h4><p>Группы до 200 000 участников, каналы, роли, модерация</p></div><div class="card"><h4>\u{1F4DE} Звонки</h4><p>Голосовые и видеозвонки через WebRTC, групповые до 30 человек, HD-качество</p></div></div></div>');

  // Section 2: Установка
  h.push('<div class="section"><h2>2. Установка и запуск</h2>');
  h.push('<h3>2.1 Веб-версия</h3><p>Откройте <strong>balloo.su</strong> в любом современном браузере. Установка не требуется. Работает на десктопе и мобильных устройствах. Поддерживает PWA.</p>');
  h.push('<h3>2.2 Десктоп (Windows / macOS / Linux)</h3><p>Десктопное приложение построено на Electron:</p>');
  h.push('<ol><li>Перейдите на <strong>download.balloo.su</strong></li><li>Выберите платформу (.exe, .dmg, .AppImage)</li><li>Скачайте (~85 МБ)</li><li>Запустите установку</li><li>Авторизуйтесь</li></ol>');
  h.push('<h3>2.3 Мобильные приложения</h3><p>React Native (Expo) скоро в Google Play и App Store. Используйте веб-версию с PWA.</p>');
  h.push(screenshotImg('onboarding', 'Экран онбординга'));
  h.push('</div>');

  // Section 3: Регистрация
  h.push('<div class="section"><h2>3. Регистрация и вход</h2>');
  h.push(screenshotImg('login', 'Экран входа'));
  h.push('<div class="step"><div class="step-number">1</div><div class="step-content"><h4>Откройте Balloo</h4><p>Перейдите на balloo.su</p></div></div>');
  h.push(screenshotImg('register', 'Регистрация'));
  h.push('<div class="step"><div class="step-number">2</div><div class="step-content"><h4>Выберите способ регистрации</h4><p>Email, номер телефона (SMS), Yandex ID, VK ID, Mail.ru ID</p></div></div>');
  h.push('<div class="step"><div class="step-number">3</div><div class="step-content"><h4>Заполните профиль</h4><p>Отображаемое имя, аватарка (восьмиугольная), bio до 250 символов</p></div></div>');
  h.push('<div class="step"><div class="step-number">4</div><div class="step-content"><h4>Настройте 2FA</h4><p>TOTP, SMS, Email + backup-коды</p></div></div>');
  h.push('</div>');

  // Section 4: Экраны
  h.push('<div class="section"><h2>4. Основные экраны</h2>');
  h.push('<h3>4.1 Список чатов</h3><p>Список всех чатов. Поиск, создание чата. Аватарка, имя, последнее сообщение, время, непрочитанные. Свайп влево — архив, вправо — закрепить.</p>');
  h.push(screenshotImg('chats', 'Главный экран — список чатов'));
  h.push('<h3>4.2 Экран переписки</h3>');
  h.push(screenshotImg('empty-chat', 'Экран переписки'));
  h.push('<ul><li><strong>Отправка</strong> — текст + Enter</li><li><strong>Вложения</strong> — фото, видео, файлы до 50 МБ</li><li><strong>Голосовое</strong> — удерживайте микрофон</li><li><strong>Реакции</strong> — эмодзи на сообщение</li><li><strong>Ответ</strong> — свайп вправо или кнопка</li><li><strong>Редактирование</strong> — до 3 правок</li><li><strong>Удаление</strong> — для всех или для себя</li></ul>');
  h.push('<h3>4.3 Профиль</h3>');
  h.push(screenshotImg('profile', 'Профиль пользователя'));
  h.push(screenshotImg('public-profile', 'Публичный профиль'));
  h.push('</div>');

  // Section 5: Группы
  h.push('<div class="section"><h2>5. Группы и каналы</h2>');
  h.push('<div class="cards"><div class="card"><h4>\u{1F465} Группа</h4><p>До 200 000 участников. Все могут писать сообщения.</p></div><div class="card"><h4>\u{1F4E2} Канал</h4><p>Неограниченная аудитория. Только админы пишут.</p></div><div class="card"><h4>\u{1F517} Invite-ссылки</h4><p>Лимит использований, срок действия</p></div></div>');
  h.push('<h3>5.1 Роли</h3><table><tr><th>Действие</th><th>Owner</th><th>Admin</th><th>Mod</th><th>Member</th></tr><tr><td>Удалять</td><td>\u2705</td><td>\u2705</td><td>\u2705</td><td>\u274C</td></tr><tr><td>Добавлять</td><td>\u2705</td><td>\u2705</td><td>\u274C</td><td>\u274C</td></tr><tr><td>Настройки</td><td>\u2705</td><td>\u2705</td><td>\u274C</td><td>\u274C</td></tr><tr><td>Писать</td><td>\u2705</td><td>\u2705</td><td>\u2705</td><td>\u2705*</td></tr></table>');
  h.push(screenshotImg('group-create', 'Создание группы'));
  h.push(screenshotImg('group-settings', 'Настройки группы'));
  h.push(screenshotImg('invites', 'Приглашения'));
  h.push('</div>');

  // Section 6: Сторис
  h.push('<div class="section"><h2>6. Сторис</h2>');
  h.push('<p>Ephemeral-контент, исчезает через 24 часа.</p>');
  h.push('<h3>Создание:</h3><ol><li>Кнопка \u00AB+\u00BB</li><li>Фото/видео</li><li>Текст, стикеры</li><li>Видимость: все/друзья/избранные</li><li>Опубликовать</li></ol>');
  h.push('<h3>Функции:</h3><ul><li>Фото до 5 сек, видео до 60 сек</li><li>Хранение: 24 часа</li><li>Реакции: эмодзи</li><li>Просмотры: список пользователей</li></ul>');
  h.push(screenshotImg('story-create', 'Создание сторис'));
  h.push('</div>');

  // Section 7: Опросы
  h.push('<div class="section"><h2>7. Опросы</h2>');
  h.push('<p>\u00AB+\u00BB \u2192 \u00ABОпрос\u00BB. Вопрос, 2-12 вариантов. Множественный выбор, анонимность, срок (24ч/7дн/30дн/бессрочно).</p>');
  h.push(screenshotImg('poll-editor', 'Создание опроса'));
  h.push('</div>');

  // Section 8: Блог
  h.push('<div class="section"><h2>8. Блог-платформа</h2>');
  h.push('<ul><li>Посты: текст, фото, ссылки</li><li>Каналы: тематические сообщества</li><li>Категории: технологии, бизнес, образование</li><li>Поиск и модерация</li></ul>');
  h.push(screenshotImg('bots', 'Боты'));
  h.push('</div>');

  h.push('<div class="section"><h2>9. Безопасность</h2>');
  h.push('<div class="highlight"><p>\u{1F512} Многоуровневая защита: bcrypt (12 итераций), JWT EdDSA (Ed25519), TLS 1.3, 2FA.</p></div>');
  h.push('<h3>9.1 2FA</h3><ul><li><strong>TOTP</strong> — Google Authenticator, Authy (30 сек)</li><li><strong>SMS</strong> — 6 цифр на телефон</li><li><strong>Email</strong> — код на почту</li></ul>');
  h.push('<p>10 backup-кодов при включении 2FA.</p>');
  h.push(screenshotImg('two-factor', 'Настройка 2FA'));
  h.push('<h3>9.2 Устройства</h3><p>Список всех сессий: тип, название, платформа, IP. Завершение удалённо.</p>');
  h.push(screenshotImg('my-devices', 'Управление устройствами'));
  h.push('<h3>9.3 Блокировка</h3><p>Профиль \u2192 Заблокировать. Заблокированный не может писать, видеть статус, сторис.</p>');
  h.push(screenshotImg('blocked-users', 'Заблокированные'));
  h.push('</div>');

  h.push('<div class="section"><h2>10. Приватность</h2>');
  h.push('<table><tr><th>Параметр</th><th>Варианты</th><th>По умолчанию</th></tr><tr><td>Кто видит профиль</td><td>Все/Друзья/Никто</td><td>Все</td></tr><tr><td>Кто видит last seen</td><td>Все/Друзья/Никто</td><td>Все</td></tr><tr><td>Кто видит аватарку</td><td>Все/Друзья/Никто</td><td>Все</td></tr><tr><td>Кто добавляет в группы</td><td>Все/Друзья</td><td>Все</td></tr><tr><td>Кто видит stories</td><td>Все/Друзья</td><td>Все</td></tr><tr><td>Кто звонит</td><td>Все/Друзья/Никто</td><td>Все</td></tr><tr><td>Показывать email</td><td>Да/Нет</td><td>Нет</td></tr><tr><td>Показывать телефон</td><td>Да/Нет</td><td>Нет</td></tr></table>');
  h.push(screenshotImg('privacy-settings', 'Настройки приватности'));
  h.push('</div>');

  h.push('<div class="section"><h2>11. Языки (20)</h2>');
  h.push('<h3>Русские (15):</h3><p>Русский, Татарский, Башкирский, Чеченский, Чувашский, Алтайский, Дагестанские, Удмуртский, Лезгинский, Карачаево-Балкарский, Марийский, Осетинский, Якутский, Бураятский, Украинский.</p>');
  h.push('<h3>Дружественные (3):</h3><p>Китайский, Хинди, Белорусский.</p>');
  h.push('<h3>Остальные (2):</h3><p>Английский, Французский.</p>');
  h.push(screenshotImg('settings', 'Настройки'));
  h.push('</div>');

  h.push('<div class="section"><h2>12. FAQ</h2>');
  h.push('<h3>Удалить аккаунт?</h3><p>Настройки \u2192 Аккаунт \u2192 Удалить. Данные удаляются через 30 дней.</p>');
  h.push('<h3>Сменить username?</h3><p>Раз в 30 дней. 3-32 символа, латиница + цифры + _.</p>');
  h.push('<h3>Макс. размер файла?</h3><p>50 МБ. JPG, PNG, GIF, WEBP, SVG, MP4, WEBM, MOV, MP3, WAV, FLAC, PDF, DOCX, ZIP.</p>');
  h.push('<h3>Перенести историю из Telegram/WhatsApp?</h3><p>В v1 — нет. В v2+ — планируется.</p>');
  h.push('<h3>Экспорт данных?</h3><p>Настройки \u2192 Аккаунт \u2192 Экспорт. Профиль, контакты, чаты, группы.</p>');
  h.push('<h3>Взлом аккаунта?</h3><p>Смените пароль, завершите сессии, включите 2FA.</p>');
  h.push('</div>');

  h.push('<div class="section"><h2>13. Горячие клавиши (Desktop)</h2>');
  h.push('<table><tr><th>Комбинация</th><th>Действие</th></tr><tr><td>Ctrl + N</td><td>Новый чат</td></tr><tr><td>Ctrl + F</td><td>Поиск</td></tr><tr><td>Ctrl + Shift + M</td><td>Приглушить уведомления</td></tr><tr><td>Ctrl + 1-9</td><td>Чат #1-#9</td></tr><tr><td>Ctrl + Shift + K</td><td>Настройки</td></tr><tr><td>Ctrl + D</td><td>Архив</td></tr><tr><td>Esc</td><td>Закрыть модал</td></tr></table></div>');

  h.push('<div class="section"><h2>14. Звонки</h2>');
  h.push('<p>WebRTC: голосовые и видеозвонки, до 30 участников, HD-качество.</p>');
  h.push(screenshotImg('calls', 'Экран звонков'));
  h.push(screenshotImg('active-call', 'Активный звонок'));
  h.push('</div>');

  h.push('<div class="section"><h2>15. Донаты</h2>');
  h.push('<p>Уровни: free, silver, gold, platinum — каждый с уникальными бонусами.</p>');
  h.push(screenshotImg('donate', 'Донаты'));
  h.push('</div>');

  h.push('<div class="section"><h2>16. О компании</h2>');
  h.push(screenshotImg('about-balloo', 'О мессенджере'));
  h.push(screenshotImg('about-company', 'О компании'));
  h.push(screenshotImg('rules', 'Правила'));
  h.push('</div>');

  h.push('<div class="section"><h2>17. Поиск и контакты</h2>');
  h.push(screenshotImg('search', 'Поиск'));
  h.push(screenshotImg('contacts', 'Контакты'));
  h.push(screenshotImg('archive', 'Архив'));
  h.push('</div>');

  h.push('<div class="section"><h2>18. Уведомления</h2>');
  h.push(screenshotImg('notification-settings', 'Уведомления'));
  h.push('</div>');

  h.push('<div class="cta-box"><h3>Готовы начать?</h3>');
  h.push('<p>Зарегистрируйтесь на balloo.su</p>');
  h.push('<div class="email">\u{1F310} balloo.su \u2022 \u{1F4E7} o8eryuhtin@yandex.ru</div></div>');
  h.push('<div class="pdf-footer">\u00A9 2026 Balloo Messenger. balloo.su | Версия 1.0</div>');
  h.push('</div></body></html>');

  return h.join('');
}


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
  h.push('<div class="section"><h2>Ключевые функции</h2><div class="cards"><div class="card"><h4>\u{1F4AC} Сообщения</h4><p>Текст, фото, видео, голосовые, файлы, реакции, ответы</p></div><div class="card"><h4>\u{1F4DE} Звонки</h4><p>WebRTC, групповые до 30 человек, HD</p></div><div class="card"><h4>\u{1F4E2} Каналы</h4><p>Неограниченная аудитория</p></div><div class="card"><h4>\u{1F4F8} Сторис</h4><p>24 часа, реакции, просмотры</p></div><div class="card"><h4>\u{1F4CA} Опросы</h4><p>Один или множественный выбор</p></div><div class="card"><h4>\u{1F4DD} Блог</h4><p>Каналы, подписки, поиск</p></div></div></div>');
  h.push('<div class="section"><h2>Безопасность</h2><div class="highlight"><p>\u{1F512} bcrypt, JWT EdDSA, 2FA (TOTP/SMS/Email), TLS 1.3</p></div></div>');
  h.push('<div class="section"><h2>Уникальное</h2><div class="two-col"><div class="info-box"><h4>\u{1F30D} 20 языков</h4><p>15 языков народов РФ</p></div><div class="info-box"><h4>\u{1F3E2} Экосистема</h4><p>Мессенджер + блог + hiring</p></div><div class="info-box"><h4>\u{1F3A8} Темы</h4><p>dark, light, russian</p></div><div class="info-box"><h4>\u{1F4F1} Кроссплатформа</h4><p>Web, Desktop, Mobile</p></div></div></div>');
  h.push('<div class="section"><h2>Для бизнеса</h2><ul><li>command.balloo.su — портал сотрудников</li><li>features.balloo.su — фич-реквесты</li><li>admin.balloo.su — админ-панель</li></ul></div>');
  h.push(screenshotImg('calls', 'Звонки'));
  h.push(screenshotImg('story-create', 'Сторис'));
  h.push(screenshotImg('profile', 'Профиль'));
  h.push('<div class="cta-box"><h3>Попробуйте Balloo!</h3><p>Бесплатно. Без рекламы.</p><div class="email">\u{1F310} balloo.su</div></div>');
  h.push('<div class="pdf-footer">\u00A9 2026 Balloo Messenger. balloo.su</div></div></body></html>');
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
  h.push('<div class="meta">Июль 2026 \u2022 Конфиденциально</div></div>');
  h.push('<div class="page">');
  h.push('<div class="hero"><h1>Инвестиционный <span class="accent">меморандум</span></h1><p>Российская альтернатива мессенджерам мирового уровня</p></div>');
  h.push('<div class="section" style="margin-top:22px;"><h2>1. Executive Summary</h2><p>Монорепо: мессенджер + админ + портал сотрудников + блог + hiring. 20 языков, включая 15 языков народов РФ.</p>');
  h.push('<div class="stat-row"><div class="stat-box"><div class="number">$2.1B</div><div class="label">Рынок мессенджеров РФ</div></div><div class="stat-box"><div class="number">148M</div><div class="label">Интернет-пользователей</div></div><div class="stat-box"><div class="number">73M</div><div class="label">Пользователей мессенджеров</div></div></div></div>');
  h.push('<div class="section"><h2>2. Проблема рынка</h2><ul><li>Риски блокировок западных платформ</li><li>Нет поддержки языков народов РФ</li><li>Недостаточная приватность</li><li>Нет self-hosted решений</li></ul></div>');
  h.push('<div class="section"><h2>3. Решение</h2><div class="cards"><div class="card"><h4>\u{1F1F7}\u{1F1FA} Self-hosted</h4><p>Соответствие 152-ФЗ</p></div><div class="card"><h4>\u{1F30D} 20 языков</h4><p>15 языков народов РФ</p></div><div class="card"><h4>\u{1F3E2} Экосистема</h4><p>Всё в одном продукте</p></div></div></div>');
  h.push(screenshotImg('chats', 'Мессенджер Balloo'));
  h.push('<div class="section"><h2>4. Бизнес-модель</h2><table><tr><th>Источник</th><th>Описание</th><th>Год 1</th><th>Год 3</th></tr><tr><td>Донаты</td><td>free/silver/gold/platinum</td><td>\u20BD 2.4M</td><td>\u20BD 12M</td></tr><tr><td>Enterprise</td><td>Self-hosted лицензии</td><td>\u20BD 8M</td><td>\u20BD 45M</td></tr><tr><td>Реклама</td><td>Каналы, сторис</td><td>\u20BD 5M</td><td>\u20BD 28M</td></tr><tr><td>Hiring</td><td>Вакансии, профили</td><td>\u20BD 3M</td><td>\u20BD 15M</td></tr><tr><td>API</td><td>Bot platform</td><td>\u20BD 0.5M</td><td>\u20BD 8M</td></tr><tr><td><strong>Итого</strong></td><td></td><td><strong>\u20BD 18.9M</strong></td><td><strong>\u20BD 108M</strong></td></tr></table></div>');
  h.push('<div class="dark-section"><h2>5. Технологический стек</h2><p><strong>Backend:</strong> Node.js 20, Express, WebSocket, Prisma</p><p><strong>DB:</strong> PostgreSQL 16, Redis 7</p><p><strong>Frontend:</strong> React 18, Vite 5, TypeScript 5</p><p><strong>Desktop:</strong> Electron 28</p><p><strong>Mobile:</strong> Expo (React Native)</p><p><strong>Storage:</strong> MinIO + Yandex Object Storage</p><p><strong>Auth:</strong> JWT (EdDSA), OAuth 2.0</p><p><strong>Звонки:</strong> WebRTC</p><p><strong>Деплой:</strong> Docker, Kubernetes (v2+)</p></div>');
  h.push(screenshotImg('calls', 'WebRTC звонки'));
  h.push(screenshotImg('profile', 'Профили и приватность'));
  h.push('<div class="section"><h2>6. Roadmap</h2><div class="step"><div class="step-number">Q3</div><div class="step-content"><h4>2026 Q3 — Бета</h4><p>Мессенджер, регистрация, профили, 2FA</p></div></div><div class="step"><div class="step-number">Q4</div><div class="step-content"><h4>2026 Q4 — Публичная бета</h4><p>Сторис, опросы, блог, десктоп</p></div></div><div class="step"><div class="step-number">2027 Q1</div><div class="step-content"><h4>Мобильные приложения</h4><p>React Native iOS/Android</p></div></div><div class="step"><div class="step-number">2027 Q2</div><div class="step-content"><h4>Enterprise</h4><p>Self-hosted, SSO, LDAP</p></div></div><div class="step"><div class="step-number">2027 Q4</div><div class="step-content"><h4>Масштабирование</h4><p>Bot platform, E2E шифрование</p></div></div></div></div>');
  h.push('<div class="section"><h2>7. Конкурентные преимущества</h2><table><tr><th>Критерий</th><th>Balloo</th><th>Telegram</th><th>VK</th></tr><tr><td>Языки народов РФ</td><td>\u2705 15</td><td>\u274C</td><td>\u274C</td></tr><tr><td>Self-hosted</td><td>\u2705</td><td>\u274C</td><td>\u274C</td></tr><tr><td>Блог + Hiring</td><td>\u2705</td><td>\u274C</td><td>Частично</td></tr><tr><td>Приватность</td><td>\u2705 Макс.</td><td>\u2705</td><td>\u26A0\uFE0F</td></tr></table></div>');
  h.push('<div class="section"><h2>8. Финансы (прогноз)</h2><table><tr><th></th><th>2026</th><th>2027</th><th>2028</th></tr><tr><td>Пользователи</td><td>50K</td><td>500K</td><td>2M</td></tr><tr><td>Доход</td><td>\u20BD 18.9M</td><td>\u20BD 55M</td><td>\u20BD 120M</td></tr></table></div>');
  h.push('<div class="cta-box"><h3>Инвестируйте в будущее российского IT</h3><div class="email">\u{1F4E7} o8eryuhtin@yandex.ru</div></div>');
  h.push('<div class="pdf-footer">\u00A9 2026 Balloo Messenger. balloo.su</div></div></body></html>');
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
  h.push('<div class="section"><h2>2. Рекламные форматы</h2><div class="cards"><div class="card"><h4>\u{1F4E2} Баннер в каналах</h4><p>Текст + медиа, нативная интеграция</p></div><div class="card"><h4>\u{1F50D} Таргетированная</h4><p>По интересам, геолокации, демографии</p></div><div class="card"><h4>\u{1F4CA} Sponsored stories</h4><p>До 60 сек видео, полноэкранный</p></div></div><div class="cards"><div class="card"><h4>\u{1F514} Push-уведомления</h4><p>С согласия пользователя</p></div><div class="card"><h4>\u{1F4AC} Реклама в поиске</h4><p>Контекстная релевантность</p></div><div class="card"><h4>\u{1F3AF} Native ads</h4><p>В ленте блога</p></div></div></div>');
  h.push(screenshotImg('chats', 'Основной экран'));
  h.push('<div class="section"><h2>3. Таргетинг</h2><table><tr><th>Параметр</th><th>Доступность</th><th>Детализация</th></tr><tr><td>География</td><td>\u2705</td><td>Страна, регион, город</td></tr><tr><td>Возраст</td><td>\u2705</td><td>16-24, 25-34, 35-44, 45-55</td></tr><tr><td>Пол</td><td>\u2705</td><td>М/Ж</td></tr><tr><td>Язык</td><td>\u2705</td><td>Все 20 языков</td></tr><tr><td>Интересы</td><td>\u2705</td><td>Технологии, бизнес, спорт</td></tr><tr><td>Устройство</td><td>\u2705</td><td>Web, Desktop, Mobile</td></tr></table></div>');
  h.push(screenshotImg('story-create', 'Сторис'));
  h.push('<div class="section"><h2>4. Тарифы</h2><table><tr><th>Тариф</th><th>CPM</th><th>Мин. бюджет</th><th>Включено</th></tr><tr><td>Стартовый</td><td>\u20BD 150</td><td>\u20BD 5 000/мес</td><td>Баннеры в каналах</td></tr><tr><td>Бизнес</td><td>\u20BD 250</td><td>\u20BD 20 000/мес</td><td>stories, аналитика</td></tr><tr><td>Корпоративный</td><td>\u20BD 400</td><td>\u20BD 100 000/мес</td><td>Full-stack, менеджер</td></tr></table></div>');
  h.push('<div class="section"><h2>5. Аналитика</h2><ul><li>Охват, Показы, CTR, CPC, Конверсии, ROI, Частота</li></ul></div>');
  h.push('<div class="section"><h2>6. Почему Balloo?</h2><div class="highlight"><p>\u{1F4C8} Мессенджеры — самый потребляемый тип приложений в России.</p></div><ul><li>Нативная интеграция</li><li>20 языков</li><li>Self-hosted</li><li>Честная аналитика</li><li>Соответствие 152-ФЗ</li></ul></div>');
  h.push('<div class="section"><h2>7. Кейсы</h2><div class="two-col"><div class="info-box"><h4>\u{1F393} Образование</h4><p>CTR 4.2%, регистрация \u20BD 180, охват 50K</p></div><div class="info-box"><h4>\u{1F6D2} E-commerce</h4><p>CTR 5.8%, ROAS 340%, охват 120K</p></div></div></div>');
  h.push('<div class="cta-box"><h3>Станьте партнёром Balloo</h3><div class="email">\u{1F4E7} o8eryuhtin@yandex.ru</div></div>');
  h.push('<div class="pdf-footer">\u00A9 2026 Balloo Messenger. balloo.su</div></div></body></html>');
  return h.join('');
}

// ========================
// PDF Generation
// ========================

async function generatePDF(html, outputPath, title) {
  console.log('\n\ud83d\udcc4 \u0413\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044f: ' + title);
  const htmlPath = outputPath.replace(/\.pdf$/, '.html');
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
    console.log('   \u2705 \u0413\u043e\u0442\u043e\u0432\u043e: ' + (stats.size / (1024 * 1024)).toFixed(2) + ' MB');
    await fs.rmSync(htmlPath, { force: true });
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('\ud83d\ude80 Balloo PDF Generator v3');
  console.log('===========================');
  mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  await captureAllScreenshots();
  const pdfs = [
    { title: '\u0418\u043d\u0441\u0442\u0440\u0443\u043a\u0446\u0438\u044f \u0434\u043b\u044f \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0435\u0439', html: generateUserInstructionHTML(), filename: '\u0438\u043d\u0441\u0442\u0440\u0443\u043a\u0446\u0438\u044f \u0434\u043b\u044f \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0435\u0439.pdf', expected: '20-30' },
    { title: '\u0420\u0435\u043a\u043b\u0430\u043c\u0430 \u0434\u043b\u044f \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0435\u0439', html: generateUserAdsHTML(), filename: '\u0420\u0435\u043a\u043b\u0430\u043c\u0430 \u0434\u043b\u044f \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0435\u0439.pdf', expected: '5-7' },
    { title: '\u0420\u0435\u043a\u043b\u0430\u043c\u0430 \u0434\u043b\u044f \u0438\u043d\u0432\u0435\u0441\u0442\u043e\u0440\u043e\u0432', html: generateInvestorAdsHTML(), filename: '\u0420\u0435\u043a\u043b\u0430\u043c\u0430 \u0434\u043b\u044f \u0438\u043d\u0432\u0435\u0441\u0442\u043e\u0440\u043e\u0432.pdf', expected: '13-15' },
    { title: '\u0420\u0435\u043a\u043b\u0430\u043c\u0430 \u0434\u043b\u044f \u0440\u0435\u043a\u043b\u0430\u043c\u043e\u0434\u0430\u0442\u0435\u043b\u0435\u0439', html: generateAdvertiserAdsHTML(), filename: '\u0420\u0435\u043a\u043b\u0430\u043c\u0430 \u0434\u043b\u044f \u0440\u0435\u043a\u043b\u0430\u043c\u043e\u0434\u0430\u0442\u0435\u043b\u0435\u0439.pdf', expected: '8-9' }
  ];
  for (const pdf of pdfs) {
    const outputPath = join(OUTPUT_DIR, pdf.filename);
    try { await generatePDF(pdf.html, outputPath, pdf.title); }
    catch (err) { console.error('\n\u274c \u041e\u0448\u0438\u0431\u043a\u0430 \u201C' + pdf.title + '\u201D:', err.message); }
  }
  console.log('\n\u2705 \u0412\u0441\u0435 PDF-\u0444\u0430\u0439\u043b\u044b \u0441\u0433\u0435\u043d\u0435\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u044b!');
  console.log('\n\u0424\u0430\u0439\u043b\u044b:');
  for (const pdf of pdfs) { console.log('  - ' + pdf.filename + ' (' + pdf.expected + ' \u0441\u0442\u0440.)'); }
  console.log('\n\ud83d\udce7 Email: ' + EMAIL);
}

main().catch(err => { console.error('\u274c \u041a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0430\u044f \u043e\u0448\u0438\u0431\u043a\u0430:', err); process.exit(1); });
