# Тикет 1795369073 — Тема «Наша» на экранах не соответствует принятому макету

**Создан:** 22.11.2026 (unix 1795369073)
**Статус:** в работе
**Источник:** приёмка H2, владелец: «где градиенты, малахитовые контейнеры с золотыми
рамками? медные буквы?»

## Причина (доказано сравнением CSS 22.11.2026)

Токены темы в `packages/web/src/styles/themes.css:135-210` **совпадают** с эталоном
`mockups/assets/common.css:93-132` (gold #c9a227, gold border-strong, градиент флага).
Расхождение — в применении:

1. **`--surface` не определена ни в одной теме**, но используется в inline-стилях
   6 экранов (CreateGroup, CreateChannel, GroupSettings, ChannelSettings, FileViewer —
   19 мест). `background: var(--surface)` = прозрачный → контейнеров нет.
2. **Золотые рамки (border-strong) теряются**: в мокапе `--border-strong` на
   `.topbar__dropdown, .message__bubble(receiver), .message__header, .input-hint,
   .btn--secondary, .card--hover:hover, .card:hover, .right-menu, .toast,
   .slide-panel(+bottom), .context-menu, .reaction-float, .emoji-panel,
   .attachment-item:hover, .account-detail-card:hover, .onboarding__dot,
   .story-avatar--viewed, scrollbar-thumb` — приложение использует border-strong
   только в 6 селекторах (grep-диффик приложен в «Результат»).
3. Градиент фона есть (`--app-bg`, ticket 1794575221), но прозрачные контейнеры
   из п.1 looked «чернота без стекла».

## Решение

1. `themes.css`: определить `--surface: var(--bg-glass)` во всех трёх темах
   (в мокапе аналог этих карточек — `.card` = bg-glass + blur).
2. Довести селекторы приложения до эталона: где мокап использует `--border-strong` —
   в приложении тоже `--border-strong` (в dark/light это тонкая светлая рамка,
   в «Нашей» — золото; значения переменных менять НЕ нужно, они эталонные).
3. Проверить `.card--hover`/`.card:hover` (в приложении hover-рамки нет вовсе).

## Подзадачи

- [x] 1. themes.css: `--surface: var(--bg-glass)` во все три темы
- [x] 2. design-system.css: `.card:hover`/`.card--hover:hover` → border-strong (как в макете); `.onboarding__dot` → border-strong
- [x] 3. Проверки: web tsc 0 + vitest 53/393 + vite build ✓ (визуальная приёмка — владелец)
- [x] 4. Деплой web — батчи F2/G3, 23.11.2026: бандль `index-BMWJl9HD.js`
      (=8090=домен) (док-во: тик. `1795357403`, раздел «Батчи C3–G3»)

## Результат

```text
themes.css:  --surface: var(--bg-glass)  в dark, light, russian
design-system.css:
  .card { transition: ... }
  .card:hover        { border-color: var(--border-strong); box-shadow; translateY(-1px) }
  .card--hover:hover { border-color: var(--border-strong); translateY(-2px) }
  .onboarding__dot   { background: var(--border-strong) }   (было --bg-elevated)
```

Уже соответствовали макету (не менялись): `.btn--secondary`, `.message__bubble(receiver)`,
`.message__header`, `.input-hint`, `.emoji-panel`, `.topbar__dropdown`, `.right-menu`
(все на `var(--border-strong)`).

Селекторы макета, которых в приложении нет вовсе (реализованы иначе/отсутствуют):
`.toast`, `.slide-panel`, `.context-menu`, `.reaction-float`, `.attachment-item`,
`.account-detail-card`, `.story-avatar--viewed`, `::-webkit-scrollbar-thumb`
(у приложения своя `--scrollbar-thumb`).

## Критерии готовности

- на «Нашей» теме: карточки/панели/меню/тосты с золотой рамкой, стеклянные
  фоновые контейнеры, фон с флаговым градиентом;
- dark/light не меняются (border-strong там — текущие нейтральные значения);
- скриншоты приёмки — владелец.

## Результат

(заполняется по ходу)
