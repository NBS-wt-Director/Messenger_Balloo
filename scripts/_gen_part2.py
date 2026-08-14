#!/usr/bin/env python3
"""Добавляет HTML-генераторы к generate-pdfs.js"""
import os

OUTPUT = '/home/ivan/Рабочий стол/проекты/balloo/scripts/generate-pdfs.js'

# Helper: write JS string using array.push pattern
def push_line(h, line):
    # Escape single quotes and backslashes for JS string
    escaped = line.replace('\\', '\\\\').replace("'", "\\'")
    h.append("  h.push('" + escaped + "');")

code = """

function generateUserInstructionHTML() {
  const logo = dataURI('product-logo.png');
  const mascot = dataURI('mascot.png');
  var h = [];
  h.push('<!DOCTYPE html><html><head><meta charset="utf-8"><style>' + COMMON_CSS + '</style></head><body>');
  h.push('<div class="cover">');
  h.push(imgTag(mascot, 'mascot-img'));
  h.push('<h1>Balloo <span class="accent">Messenger</span></h1>');
  h.push('<div class="subtitle">Полная инструкция для пользователей</div>');
  h.push('<div class="meta">Версия 1.0 \\u2022 Июль 2026</div>');
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
  h.push('<p>Balloo \\u2014 это современный российский мессенджер нового поколения, объединяющий мгновенный обмен сообщениями, голосовые и видеозвонки, сторис, блог-платформу, базу знаний для компаний и систему найма.</p>');
  h.push('<p>Проект создан для российского и СНГ-рынка с поддержкой 20 языков, включая 15 языков народов Российской Федерации.</p>');
  h.push('<div class="cards"><div class="card"><h4>\\u{1F4AC} Мгновенные сообщения</h4><p>Текст, фото, видео, голосовые, файлы до 50 МБ, реакции, ответы, закрепление, редактирование</p></div><div class="card"><h4>\\u{1F465} Группы и каналы</h4><p>Группы до 200 000 участников, каналы, роли, модерация</p></div><div class="card"><h4>\\u{1F4DE} Звонки</h4><p>Голосовые и видеозвонки через WebRTC, групповые до 30 человек, HD-качество</p></div></div></div>');

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
  h.push('<div class="cards"><div class="card"><h4>\\u{1F465} Группа</h4><p>До 200 000 участников. Все могут писать сообщения.</p></div><div class="card"><h4>\\u{1F4E2} Канал</h4><p>Неограниченная аудитория. Только админы пишут.</p></div><div class="card"><h4>\\u{1F517} Invite-ссылки</h4><p>Лимит использований, срок действия</p></div></div>');
  h.push('<h3>5.1 Роли</h3><table><tr><th>Действие</th><th>Owner</th><th>Admin</th><th>Mod</th><th>Member</th></tr><tr><td>Удалять</td><td>\\u2705</td><td>\\u2705</td><td>\\u2705</td><td>\\u274C</td></tr><tr><td>Добавлять</td><td>\\u2705</td><td>\\u2705</td><td>\\u274C</td><td>\\u274C</td></tr><tr><td>Настройки</td><td>\\u2705</td><td>\\u2705</td><td>\\u274C</td><td>\\u274C</td></tr><tr><td>Писать</td><td>\\u2705</td><td>\\u2705</td><td>\\u2705</td><td>\\u2705*</td></tr></table>');
  h.push(screenshotImg('group-create', 'Создание группы'));
  h.push(screenshotImg('group-settings', 'Настройки группы'));
  h.push(screenshotImg('invites', 'Приглашения'));
  h.push('</div>');

  // Section 6: Сторис
  h.push('<div class="section"><h2>6. Сторис</h2>');
  h.push('<p>Ephemeral-контент, исчезает через 24 часа.</p>');
  h.push('<h3>Создание:</h3><ol><li>Кнопка \\u00AB+\\u00BB</li><li>Фото/видео</li><li>Текст, стикеры</li><li>Видимость: все/друзья/избранные</li><li>Опубликовать</li></ol>');
  h.push('<h3>Функции:</h3><ul><li>Фото до 5 сек, видео до 60 сек</li><li>Хранение: 24 часа</li><li>Реакции: эмодзи</li><li>Просмотры: список пользователей</li></ul>');
  h.push(screenshotImg('story-create', 'Создание сторис'));
  h.push('</div>');

  // Section 7: Опросы
  h.push('<div class="section"><h2>7. Опросы</h2>');
  h.push('<p>\\u00AB+\\u00BB \\u2192 \\u00ABОпрос\\u00BB. Вопрос, 2-12 вариантов. Множественный выбор, анонимность, срок (24ч/7дн/30дн/бессрочно).</p>');
  h.push(screenshotImg('poll-editor', 'Создание опроса'));
  h.push('</div>');

  // Section 8: Блог
  h.push('<div class="section"><h2>8. Блог-платформа</h2>');
  h.push('<ul><li>Посты: текст, фото, ссылки</li><li>Каналы: тематические сообщества</li><li>Категории: технологии, бизнес, образование</li><li>Поиск и модерация</li></ul>');
  h.push(screenshotImg('bots', 'Боты'));
  h.push('</div>');

  # Section 9: Безопасность
  h.push('<div class="section"><h2>9. Безопасность</h2>');
  h.push('<div class="highlight"><p>\\u{1F512} Многоуровневая защита: bcrypt (12 итераций), JWT EdDSA (Ed25519), TLS 1.3, 2FA.</p></div>');
  h.push('<h3>9.1 2FA</h3><ul><li><strong>TOTP</strong> — Google Authenticator, Authy (30 сек)</li><li><strong>SMS</strong> — 6 цифр на телефон</li><li><strong>Email</strong> — код на почту</li></ul>');
  h.push('<p>10 backup-кодов при включении 2FA.</p>');
  h.push(screenshotImg('two-factor', 'Настройка 2FA'));
  h.push('<h3>9.2 Устройства</h3><p>Список всех сессий: тип, название, платформа, IP. Завершение удалённо.</p>');
  h.push(screenshotImg('my-devices', 'Управление устройствами'));
  h.push('<h3>9.3 Блокировка</h3><p>Профиль \\u2192 Заблокировать. Заблокированный не может писать, видеть статус, сторис.</p>');
  h.push(screenshotImg('blocked-users', 'Заблокированные'));
  h.push('</div>');

  # Section 10: Приватность
  h.push('<div class="section"><h2>10. Приватность</h2>');
  h.push('<table><tr><th>Параметр</th><th>Варианты</th><th>По умолчанию</th></tr><tr><td>Кто видит профиль</td><td>Все/Друзья/Никто</td><td>Все</td></tr><tr><td>Кто видит last seen</td><td>Все/Друзья/Никто</td><td>Все</td></tr><tr><td>Кто видит аватарку</td><td>Все/Друзья/Никто</td><td>Все</td></tr><tr><td>Кто добавляет в группы</td><td>Все/Друзья</td><td>Все</td></tr><tr><td>Кто видит stories</td><td>Все/Друзья</td><td>Все</td></tr><tr><td>Кто звонит</td><td>Все/Друзья/Никто</td><td>Все</td></tr><tr><td>Показывать email</td><td>Да/Нет</td><td>Нет</td></tr><tr><td>Показывать телефон</td><td>Да/Нет</td><td>Нет</td></tr></table>');
  h.push(screenshotImg('privacy-settings', 'Настройки приватности'));
  h.push('</div>');

  # Section 11: Языки
  h.push('<div class="section"><h2>11. Языки (20)</h2>');
  h.push('<h3>Русские (15):</h3><p>Русский, Татарский, Башкирский, Чеченский, Чувашский, Алтайский, Дагестанские, Удмуртский, Лезгинский, Карачаево-Балкарский, Марийский, Осетинский, Якутский, Бураятский, Украинский.</p>');
  h.push('<h3>Дружественные (3):</h3><p>Китайский, Хинди, Белорусский.</p>');
  h.push('<h3>Остальные (2):</h3><p>Английский, Французский.</p>');
  h.push(screenshotImg('settings', 'Настройки'));
  h.push('</div>');

  # Section 12: FAQ
  h.push('<div class="section"><h2>12. FAQ</h2>');
  h.push('<h3>Удалить аккаунт?</h3><p>Настройки \\u2192 Аккаунт \\u2192 Удалить. Данные удаляются через 30 дней.</p>');
  h.push('<h3>Сменить username?</h3><p>Раз в 30 дней. 3-32 символа, латиница + цифры + _.</p>');
  h.push('<h3>Макс. размер файла?</h3><p>50 МБ. JPG, PNG, GIF, WEBP, SVG, MP4, WEBM, MOV, MP3, WAV, FLAC, PDF, DOCX, ZIP.</p>');
  h.push('<h3>Перенести историю из Telegram/WhatsApp?</h3><p>В v1 — нет. В v2+ — планируется.</p>');
  h.push('<h3>Экспорт данных?</h3><p>Настройки \\u2192 Аккаунт \\u2192 Экспорт. Профиль, контакты, чаты, группы.</p>');
  h.push('<h3>Взлом аккаунта?</h3><p>Смените пароль, завершите сессии, включите 2FA.</p>');
  h.push('</div>');

  # Section 13: Горячие клавиши
  h.push('<div class="section"><h2>13. Горячие клавиши (Desktop)</h2>');
  h.push('<table><tr><th>Комбинация</th><th>Действие</th></tr><tr><td>Ctrl + N</td><td>Новый чат</td></tr><tr><td>Ctrl + F</td><td>Поиск</td></tr><tr><td>Ctrl + Shift + M</td><td>Приглушить уведомления</td></tr><tr><td>Ctrl + 1-9</td><td>Чат #1-#9</td></tr><tr><td>Ctrl + Shift + K</td><td>Настройки</td></tr><tr><td>Ctrl + D</td><td>Архив</td></tr><tr><td>Esc</td><td>Закрыть модал</td></tr></table></div>');

  # Section 14: Звонки
  h.push('<div class="section"><h2>14. Звонки</h2>');
  h.push('<p>WebRTC: голосовые и видеозвонки, до 30 участников, HD-качество.</p>');
  h.push(screenshotImg('calls', 'Экран звонков'));
  h.push(screenshotImg('active-call', 'Активный звонок'));
  h.push('</div>');

  # Section 15: Донаты
  h.push('<div class="section"><h2>15. Донаты</h2>');
  h.push('<p>Уровни: free, silver, gold, platinum — каждый с уникальными бонусами.</p>');
  h.push(screenshotImg('donate', 'Донаты'));
  h.push('</div>');

  # Section 16: О компании
  h.push('<div class="section"><h2>16. О компании</h2>');
  h.push(screenshotImg('about-balloo', 'О мессенджере'));
  h.push(screenshotImg('about-company', 'О компании'));
  h.push(screenshotImg('rules', 'Правила'));
  h.push('</div>');

  # Section 17: Поиск
  h.push('<div class="section"><h2>17. Поиск и контакты</h2>');
  h.push(screenshotImg('search', 'Поиск'));
  h.push(screenshotImg('contacts', 'Контакты'));
  h.push(screenshotImg('archive', 'Архив'));
  h.push('</div>');

  # Section 18: Уведомления
  h.push('<div class="section"><h2>18. Уведомления</h2>');
  h.push(screenshotImg('notification-settings', 'Уведомления'));
  h.push('</div>');

  # CTA
  h.push('<div class="cta-box"><h3>Готовы начать?</h3>');
  h.push('<p>Зарегистрируйтесь на balloo.su</p>');
  h.push('<div class="email">\\u{1F310} balloo.su \\u2022 \\u{1F4E7} o8eryuhtin@yandex.ru</div></div>');
  h.push('<div class="pdf-footer">\\u00A9 2026 Balloo Messenger. balloo.su | Версия 1.0</div>');
  h.push('</div></body></html>');

  return h.join('');
}
"""

with open(OUTPUT, 'a', encoding='utf-8') as f:
    f.write(code)

print("Part 2 (instruction HTML) appended")
