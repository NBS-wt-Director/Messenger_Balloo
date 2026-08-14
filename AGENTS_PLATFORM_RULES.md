# 🔴 ОБЯЗАТЕЛЬНЫЕ ПРАВИЛА ПЛАТФОРМНЫХ ЭКРАНОВ — Balloo Messenger

> **Этот файл — главный стандарт для ВСЕХ мобильных и десктопных экранов.**
> Применяется автоматически при создании любых экранов для mobile/ и desktop/.
> **Нарушение этих правил = пересоздание экрана.**

---

## 🔴 КРИТИЧЕСКИЕ ПРАВИЛА (NEVER VIOLATE)

### 1. Бизнес-логика web — ИСТОЧНИК ПРАВДЫ

**Правило:** При создании экрана для mobile/ или desktop/ **ВСЯ бизнес-логика копируется 1-в-1** из соответствующего web-экрана в balloo-su/.

**Что значит "копировать бизнес-логику 1-в-1":**
- ✅ Те же кнопки и их onclick обработчики
- ✅ Те же window.location.href переходы
- ✅ Те же JavaScript функции (openCall, openModal, switchTab и т.д.)
- ✅ Те же dropdown-пункты с onclick
- ✅ Те же tab-переключатели
- ✅ Те же формы, select, onchange, validation
- ✅ Те же модалки/панели/overlay
- ✅ Те же данные (бейджи, счётчики, статусы)
- ❌ **НЕЛЬЗЯ** удалять функциональность
- ❌ **НЕЛЬЗЯ** упрощать логику
- ❌ **НЕЛЬЗЯ** менять порядок элементов
- ❌ **НЕЛЬЗЯ** менять навигацию

**Примеры копирования:**

**group-create.html:**
```
WEB:  select с 4 типами группы + onchange → corp-note + type-specific
MOBILE: тот же select, тот же onchange, те же блоки (но compact)
DESKTOP: тот же select, тот же onchange, те же блоки (но в одной форме)
```

**stories.html:**
```
WEB:  stories.tray + story-viewer + story-create overlay + RVP кнопки (Написать, Позвонить, Пожаловаться)
MOBILE: stories.tray + story-viewer fullscreen + create overlay (но fullscreen для mobile)
```

**chats.html:**
```
WEB:  dropdown кликабельный + openCall() + openPollEditor() + openStoryCreate() + attach panel
MOBILE: dropdown кликабельный + те же функции + те же переходы
DESKTOP: dropdown кликабельный + те же функции + те же переходы
```

**Как копировать:**
1. Открыть web-экран в balloo-su/
2. Скопировать ВСЮ бизнес-логику (кнопки, onclick, functions, forms)
3. Применить визуальные правила платформы (phone-frame/window-frame)
4. Добавить обязательные элементы (theme/lang toggle)
5. Проверить целостность ссылок

---

### 2. Переключатели тем и языков — ВСЕГДА НА КАЖДОМ ЭКРАНЕ

**Правило:** На **КАЖДОМ** экране mobile/ и desktop/ **ОБЯЗАТЕЛЬНО** должны быть:
- `data-theme-toggle` — переключатель темы (🌙/☀️/🇷🇺)
- `data-lang-toggle` — переключатель языка (🇷🇺 RU)

**Где размещать:**
- **Mobile:** в phone-topbar справа (phone-topbar__right)
- **Desktop:** в titlebar справа (titlebar__right)

**Обязательная структура topbar на КАЖДОМ экране:**

```html
<!-- MOBILE -->
<div class="phone-topbar">
  <span class="phone-topbar__back">←</span>
  <span class="phone-topbar__title">Заголовок</span>
  <div class="phone-topbar__right">
    <span class="topbar__lang" data-lang-toggle>🇷🇺 RU</span>
    <span class="topbar__theme" data-theme-toggle>🌙 Тёмная</span>
  </div>
</div>

<!-- DESKTOP -->
<div class="titlebar">
  <div class="titlebar__left">
    <div class="titlebar__icon">B</div>
    <span class="titlebar__title">Заголовок</span>
  </div>
  <div class="titlebar__right">
    <span class="titlebar__lang" data-lang-toggle>🇷🇺 RU</span>
    <span class="titlebar__theme" data-theme-toggle>🌙 Тёмная</span>
  </div>
  <div class="titlebar__controls">
    <div class="titlebar__btn">─</div>
    <div class="titlebar__btn">▢</div>
    <div class="titlebar__btn titlebar__btn--close">✕</div>
  </div>
</div>
```

**Все экраны mobile/ должны иметь theme/lang toggle:**
- chat.html ✅
- stories.html ✅
- settings.html ✅
- contacts.html ✅
- archive.html ✅
- calls-history.html ✅
- group-create.html ✅
- poll-editor.html ✅
- overview.html ✅

**Все экраны desktop/ должны иметь theme/lang toggle:**
- chat.html ✅
- archive.html ✅
- group-create.html ✅
- overview.html ✅

**Без theme/lang toggle экран НЕ ПРИНИМАЕТСЯ.**

---

### 3. Ссылки между экранами — целостность

**Правило:** Все ссылки между экранами должны работать и вести на правильные страницы.

**Проверка перед созданием экрана:**
1. ✅ Все `onclick="window.location.href='...'"` ведут на существующие файлы
2. ✅ Все tabbar-элементы кликабельны и ведут на правильные экраны
3. ✅ Все кнопки "назад" работают
4. ✅ Все dropdown-пункты кликабельны

**Структура tabbar mobile (ОБЯЗАТЕЛЬНАЯ):**
```html
<div class="phone-tabbar">
  <div class="phone-tabbar__item" onclick="window.location.href='chat.html'">
    <span class="phone-tabbar__icon">💬</span>Чаты
  </div>
  <div class="phone-tabbar__item" onclick="window.location.href='contacts.html'">
    <span class="phone-tabbar__icon">👥</span>Контакты
  </div>
  <div class="phone-tabbar__item" onclick="window.location.href='calls-history.html'">
    <span class="phone-tabbar__icon">📞</span>Звонки
  </div>
  <div class="phone-tabbar__item" onclick="window.location.href='stories.html'">
    <span class="phone-tabbar__icon">📷</span>Сторис
  </div>
  <div class="phone-tabbar__item" onclick="window.location.href='settings.html'">
    <span class="phone-tabbar__icon">⚙</span>Настройки
  </div>
</div>
```

---

## 🟡 ВАЖНЫЕ ПРАВИЛА (SHOULD FOLLOW)

### 4. Визуальные отличия платформ

**Правило:** Бизнес-логика одинакова, но **визуальное оформление** должно отличаться:

| Платформа | Обязательные элементы |
|-----------|----------------------|
| **Mobile** | phone-frame, phone-topbar, phone-tabbar, touch-friendly (min 44px) |
| **Desktop** | window-frame, titlebar, statusbar, hover-эффекты, курсоры |
| **Web** | topbar, sidebar, content, dropdown |

**НЕ менять на мобильных/десктопных:**
- Цвета (CSS переменные из common.css)
- Аватарки-октагоны (clip-path: var(--octagon-clip))
- Пузыри сообщений (clip-path: var(--bubble-sender/receiver))
- Стиль кнопок (btn--primary, btn--secondary и т.д.)

---

### 5. JavaScript-функции

**Правило:** Если на web-экране есть функции (openCall, openModal, switchTab и т.д.), они **КОПИРУЮТСЯ** на мобильную/десктопную версию.

**Что копировать:**
- Все onclick обработчики
- Все функции в `<script>`
- Все data-атрибуты
- Все CSS-анимации и transitions

---

### 6. Адаптивность данных

**Правило:** Если на web-экране есть динамические данные (бейджи, счётчики, статусы), они **КОПИРУЮТСЯ** на все платформы.

**Пример:**
```html
<!-- WEB -->
<span class="badge">3</span>

<!-- MOBILE -->
<span class="badge" style="font-size:9px;">3</span>

<!-- DESKTOP -->
<span class="badge" style="font-size:9px;">3</span>
```

---

## 🔵 АЛГОРИТМ СОЗДАНИЯ ЭКРАНА (STRICT)

При создании экрана для mobile/ или desktop/ **СТРОГО** follow this order:

```
1. Найти соответствующий web-экран в balloo-su/
2. Скопировать ВСЮ бизнес-логику:
   - Все кнопки и их onclick
   - Все window.location.href
   - Все <script> функции
   - Все dropdown-пункты
   - Все tab-переключатели
   - Все формы и их action
   - Все модалки/панели
3. Добавить обязательные элементы:
   - data-theme-toggle в topbar/titlebar
   - data-lang-toggle в topbar/titlebar
4. Применить визуальные правила платформы:
   - Mobile: phone-frame, phone-topbar, phone-tabbar
   - Desktop: window-frame, titlebar, statusbar
5. Проверить целостность ссылок:
   - Все onclick работают
   - Все window.location.href ведут на существующие файлы
   - Tabbar элементы кликабельны
6. Добавить комментарии <!-- КОПИЯ WEB: ... --> где логика скопирована
```

---

## 📊 ЧЕКЛИСТ ПЕРЕД ФИНАЛИЗАЦИЕЙ

- [ ] Бизнес-логика скопирована 1-в-1 из web-версии
- [ ] data-theme-toggle присутствует в topbar/titlebar
- [ ] data-lang-toggle присутствует в topbar/titlebar
- [ ] Все onclick обработчики работают
- [ ] Все window.location.href ведут на существующие файлы
- [ ] Tabbar элементы кликабельны (mobile)
- [ ] Titlebar/Statusbar присутствует (desktop)
- [ ] CSS переменные из common.css используются
- [ ] Аватарки-октагоны сохранены (clip-path: var(--octagon-clip))
- [ ] Пузыри сообщений без скруглений (clip-path: var(--bubble-sender/receiver))
- [ ] Нет удалённой функциональности
- [ ] Нет упрощений логики
- [ ] Добавлены комментарии <!-- КОПИЯ WEB: ... -->

---

## 🚨 ШТРАФЫ ЗА НАРУШЕНИЕ

Если экран создан без соблюдения этих правил:
1. **Бизнес-логика нарушена** → пересоздать экран
2. **Нет переключателя темы/языка** → добавить и перепроверить
3. **Ссылки не работают** → исправить все window.location.href

---

## 📝 ПРИМЕР ПРАВИЛЬНОГО ЭКРАНА

```html
<!DOCTYPE html>
<html lang="ru" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mobile — Название</title>
  <link rel="stylesheet" href="../assets/common.css">
</head>
<body>
  <div class="phone-frame">
    <div class="phone-frame__notch"></div>
    <div class="phone-frame__statusbar">...</div>
    <div class="phone-frame__screen">
      <!-- КОПИЯ WEB: topbar -->
      <div class="phone-topbar">
        <span class="phone-topbar__back">←</span>
        <span class="phone-topbar__title">Заголовок</span>
        <div class="phone-topbar__right">
          <span class="topbar__lang" data-lang-toggle>🇷🇺 RU</span>
          <span class="topbar__theme" data-theme-toggle>🌙 Тёмная</span>
        </div>
      </div>

      <!-- КОПИЯ WEB: весь контент и логика -->
      ...

      <!-- КОПИЯ WEB: tabbar -->
      <div class="phone-tabbar">
        <div class="phone-tabbar__item" onclick="window.location.href='chat.html'">
          <span class="phone-tabbar__icon">💬</span>Чаты
        </div>
        ...
      </div>
    </div>
  </div>
  <script src="../assets/common.js"></script>
  <!-- КОПИЯ WEB: все функции из <script> -->
  <script>
    // openCall, openModal, switchTab — всё как в web
  </script>
</body>
</html>
```

---

## 📁 ГДЕ ХРАНИТСЯ ДОКУМЕНТАЦИЯ

- **AGENTS.md** (в корне) — главный AGENTS.md проекта (структура, дизайн-система, нумерация)
- **AGENTS_PLATFORM_RULES.md** (в корне) — ЭТОТ ФАЙЛ — правила платформенных экранов
- **mockups/AGENTS_PLATFORM_RULES.md** (дубликат) — копия для быстрого доступа

---

**Последнее обновление:** 2026-07-20
**Автор:** Koda AI + User
**Статус:** ✅ ОБЯЗАТЕЛЕН К ПРИМЕНЕНИЮ
**Синонимы:** Platform Rules, Mobile/Desktop Standards, Business Logic Copying
