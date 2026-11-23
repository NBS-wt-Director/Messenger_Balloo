# Тикет 1795369074 — sw.js: попытка кэшировать POST → Uncaught TypeError в консоли

**Создан:** 22.11.2026 (unix 1795369074)
**Статус:** в работе
**Источник:** консоль владельца при приёмке H2

## Симптом

```text
sw.js:210 Uncaught (in promise) TypeError: Failed to execute 'put' on 'Cache':
Request method 'POST' is unsupported
    at apiFirst (sw.js:210)
```

## Причина

`packages/web/public/sw.js`: `apiFirst()` (строки 203-215) и `cacheFirst()`
(167-182) кладут ответ в Cache без проверки метода. `Cache.put` принимает только GET.

## Решение

В обеих стратегиях кэшировать только `request.method === 'GET'`.

## Подзадачи

- [x] 1. sw.js: guard `request.method === 'GET'` в apiFirst и cacheFirst
- [x] 2. Проверка: sw.js — статический файл (копируется как есть), сборку не требует
- [x] 3. Деплой web — батчи F2/G3, 23.11.2026: в образе `sw.js` guard
      `method === 'GET'` = 2 (док-во: тик. `1795357403`, раздел «Батчи C3–G3»)

## Результат

`packages/web/public/sw.js`: в `apiFirst()` и `cacheFirst()` добавлено условие
`request.method === 'GET'` перед `cache.put(...)` — POST больше не пытается
кэшироваться, `Uncaught TypeError` уходит из консоли.
