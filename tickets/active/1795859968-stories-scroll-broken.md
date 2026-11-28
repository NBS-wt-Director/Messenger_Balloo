# Тикет 1795859968 — Прокрутка страницы историй (`#/stories`)

**Создан:** 28.11.2026 11:40 (unix 1795859968)
**Статус:** в работе
**Источник:** владелец (чат 28.11.2026): «страница истории без прокрутки. отложим этот баг на следующий этап»

## Цель

Восстановить вертикальную прокрутку на странице историй `balloo.su/#/stories`.
Прокрутка отсутствует полностью — колёсико/трекпад не двигают контент.

## Диагностика

### Исключено (не причина)

1. **`::-webkit-scrollbar { display: none }`** — заменено на `width: 0; height: 0; background: transparent` в 5 файлах (коммит `7dc043f`, 28.11). Это правило скрывает полосу, но **не блокирует** прокрутку. Фикс задеплоен: `HEAD=7dc043f`.
2. **Service Worker кэш** — бандль на проде новый (`index-CWxK1CyE.js`), CSS с новым правилом подтверждён в образах (`index-7hrY2btP.css`, `index-BR9ePEGg.css`).

### Что известно

- Баг проявляется на странице **историй** (`#/stories`), то есть в экране `StoriesScreen` / `StoriesEmptyState` или `StoriesList`.
- Прокрутка отсутствует полностью — не только полоса, но и движение контента.
- Владелец отложил на следующий этап — правки кода **не делаются** до команды.

## Гипотезы причины (в порядке убывания вероятности)

| # | Гипотеза | Как проверить |
|---|---|---|
| H1 | Контейнер `.content` или `.page-container` имеет `overflow: hidden` вместо `auto`/`scroll` | DevTools → Elements → проверить computed `overflow-y` у `.content` и `.page-container` |
| H2 | `.main` (flex-контейнер) имеет `overflow: hidden` и не имеет прокручиваемого потомка | DevTools → `.main { flex:1; overflow:hidden }` — проверить, есть ли потомок с `overflow-y:auto` |
| H3 | `#root` или `body` имеет `overflow: hidden` (global.css:24,34) и весь экран выше viewport | DevTools → `html, body, #root` — `overflow-y`; проверить высоту контента vs `100vh` |
| H4 | JS-обработчик `preventDefault()` на `wheel`/`touch` | DevTools → Elements → `Event Listeners` на `document`/`html`/`.content` — `wheel`, `touchmove` |
| H5 | `height: 100vh` на `.content` без `min-height: 0` в flex-контексте — контент не растягивается | DevTools → `.content` — высота vs `100vh` (если `100vh` и flex — может быть 0) |

## Подзадачи

- [ ] H1. Посмотреть computed `overflow-y` на `.content`, `.page-container`, `.main`, `#root`, `body` — DevTools → Elements → Styles
- [ ] H2. Проверить раскладку: высота `.content` vs `100vh`, есть ли `min-height: 0`, flex-контекст
- [ ] H3. Проверить Event Listeners на `wheel`/`touchmove`
- [ ] H4. Исправить CSS/JS (когда владелец даст команду)
- [ ] H5. Проверить на других узлах (`#/calls`, `#/settings`, `features.balloo.su`) — прокрутка работает?
- [ ] H6. Задеплоить и подтвердить

## Критерии готовности

- [ ] `#/stories` прокручивается колёсиком/трекпадом
- [ ] Полоса прокрутки не видна (требование U2)
- [ ] На других узлах прокрутка не сломалась

## Результат

_(заполняется по завершении)_
