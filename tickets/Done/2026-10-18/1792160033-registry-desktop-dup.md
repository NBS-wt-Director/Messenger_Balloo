# Тикет 1792160033 — Реестр: удалить дубль desktop/register из у_09 (решение 1.2.9=б)

**Создан:** 16.10.2026 (unix 1792160033)
**Статус:** в работе
**Источник:** решение владельца 1.2.9=б (16.10.2026) — DOC верен (21), JSON лишний

## Цель

Удалить дублирующую запись `1_01_03 balloo-su/register.html` из узла у_09 в `mockups/index_ecrans.json`. Счётчик desktop станет 21.

## Живое состояние (проверено 16.10.2026)

```
у_09 desktop в JSON: 22 записи
```
Дублирующая запись:
```
1_01_03 | Регистрация | balloo-su/register.html
```
Это ссылка на `balloo-su/register.html` — основной экран регистрации в у_01. По правилу AGENTS.md «Общие экраны»: узел должен ссылаться через `used_by`, а не дублировать запись.

Диск: `mockups/desktop/login.html` и `mockups/desktop/register.html` **уже перенесены в `trash/`** (решение 1.2.8).

## Подзадачи

- [x] 1. Найдена запись `1_01_03` в у_09.
- [x] 2. Удалена (из у_01 не тронута).
- [x] 3. Проверка: у_09 = 21 экран.
- [x] 4. total_screens = 167.

**Команда проверки:**
```bash
python3 << 'EOF'
import json
d=json.load(open('mockups/index_ecrans.json'))
u09 = [n for n in d['nodes'] if n['id']=='у_09'][0]
dups = [s for s in u09['screens'] if s.get('id','').startswith('1_01_')]
print('dups in у_09:', dups if dups else 'none ✅')
print('у_09 count:', len(u09['screens']))
print('total_screens:', d.get('total_screens'))
EOF
```

## Критерии готовности

- `у_09` содержит 21 экран (без `1_01_03`).
- `total_screens` = 167 (или пересчитан).
- `mockups/index.html` обновлён.

## Проблемы и решения

_Заполняется по ходу._

## Результат

Дубль `1_01_03` удалён из у_09. у_09 = 21 экран, total_screens = 167.

```python
# Проверка
python3 -c "import json; d=json.load(open('mockups/index_ecrans.json')); u09=[n for n in d['nodes'] if n['id']=='у_09'][0]; print(len(u09['screens']))"
# → 21
```
