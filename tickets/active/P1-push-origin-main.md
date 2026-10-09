# P1 — push origin main (работа81026)

**Приоритет:** 1 (высший — перед деплоем)
**Создана:** 2026-10-08
**Источник:** тикет работа81026.md, подзадача 4.2

## Цель

Выложить локальную main на origin/main (локальная main опережает origin на 16 коммитов).

## Факты

- `git rev-list --left-right --count origin/main...HEAD` → `0 / 16`
- `git status --porcelain` → 1 изменённый файл: `работа81026.md`
- Коммиты локальные, ещё не на origin

## Команды

```bash
cd "/home/ivan/Рабочий стол/проекты/balloo"
git push origin main
git rev-parse --short HEAD
```

## Критерий готовности

- `git ls-remote origin main` показывает тот же хэш, что `git rev-parse HEAD`
- `git log --oneline origin/main..HEAD` → пустой (ни одного локального коммита)

## Как отмечать этапы

- После push: записать хэш в «Результат»
- Если конфликт: записать ошибку в «Проблемы» → перейти к следующей задаче

## Результат
