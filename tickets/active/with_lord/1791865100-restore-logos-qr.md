# Тикет 1791865100 — Восстановить assets/logos/product-logo.png, company-logo.png и валидизировать qr_helpus.jpg

**Создан:** 2026-10-13 (unix 1791865100)
**Статус:** в ожидании владельца
**Кто:** Владелец
**Источник:** пользователь, ревизия активов

## Цель

Восстановить недостающие файлы бренд-ассетов в `packages/web/public/assets/logos/` и привести QR-код к стилям приложения, чтобы на проде не было 404.

## Факты

1. В `packages/web/public/assets/logos/` **нет** файлов: `product-logo.png`, `company-logo.png`, `qr_helpus.jpg`.
2. Исходники лежат в корне `assets/logos/` (product-logo 204КБ, company-logo 257КБ, qr_helpus 65КБ).
3. `qr_helpus.jpg` сейчас имеет стиль «фото без обработки» — нужно привести к визуалу приложения (скругления/рамки/фон или оставить как есть, но убедиться в валидности).

## Что сделать

1. Скопировать `assets/logos/product-logo.png` и `assets/logos/company-logo.png` в `packages/web/public/assets/logos/`.
2. Проверить `assets/logos/qr_helpus.jpg`:
   - Если он технически валиден (image/jpeg, корректный заголовок) — просто скопировать в `packages/web/public/assets/logos/`.
   - Если нужно «по стилям приложения» (например, добавить визуальную рамку, фон или обрезать) — обработать в любом редакторе перед копированием.
3. Убедиться, что после копирования `curl http://localhost:5173/assets/logos/product-logo.png` и аналогичные возвращают 200.

## Критерии готовности
- `packages/web/public/assets/logos/` содержит: `product-logo.png`, `company-logo.png`, `qr_helpus.jpg`, `mascot.png`.
- Все файлы отдают 200 на dev-сервере.
