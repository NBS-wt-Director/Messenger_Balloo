# 🎫 Мультитикет: Восстановление проекта Balloo

**Дата:** 2025-08-08  
**Статус:** 🔴 Критический — проект не запускается  
**Размер:** 7 тикетов, ~10 часов работы  
**Приоритет:** P0 (Критический)

---

## 📋 Факты (доказанные)

| # | Факт | Подтверждение |
|---|---|---|
| 1 | В начале сессии в `packages/` было **736 TS/TSX файлов** | Команда `find packages -name "*.ts" | wc -l` → 736 |
| 2 | Файл `packages/server/src/routes/auth.ts` **существовал и содержал OAuth-маршруты** | Прочитан через `read_file` |
| 3 | Файл `packages/server/src/services/authService.ts` **существовал и редактировался** | Прочитан и изменён (добавлен `max` в провайдеры) |
| 4 | Файл `packages/shared/prisma/schema.prisma` **существовал** (1059 строк) | Прочитан через `read_file` |
| 5 | Файл `docker-compose.yml` **существовал** с полной конфигурацией | Прочитан через `read_file` |
| 6 | Сейчас: `packages/` содержит только `shared/` и `web/` | Команда `ls packages/` |
| 7 | Сейчас: `packages/shared/src/` содержит только `config.ts` | Команда `ls packages/shared/src/` |
| 8 | Сейчас: нет `package.json` нигде в проекте | Команда `find . -name "package.json"` → пусто |
| 9 | Сейчас: нет `Dockerfile.server`, `Dockerfile.web` | Команда `ls docker/` |
| 10 | Сейчас: нет `.github/`, `.husky/`, `AGENTS.md`, `README.md` | Команда `ls -la` |
| 11 | Сейчас: нет mockups (только `general_docs/`) | Команда `ls mockups/` |
| 12 | Git-репозиторий инициализирован, но пустой (только 18 файлов) | Команда `git status` |

---

## 🎯 Цель

Восстановить структуру проекта, создать недостающие файлы и подготовить к деплою staging (server + web).

---

## 📝 Тикеты

### Тикет №1: Поиск файлов на компьютере

**Статус:** ⬜ Не начат  
**Приоритет:** 🔴 Критический  
**Время:** 30 мин

**Факты:**
- 736 TS/TSX файлов было в `packages/`
- `auth.ts`, `authService.ts`, `schema.prisma` существовали
- Сейчас: 4 файла

**Задание агенту:**
1. Найти все `package.json` в `/home/ivan/Рабочий стол/проектов/`
2. Найти все `Dockerfile.*` и `docker-compose.yml`
3. Найти все каталоги `packages/{server,desktop,mobile-*/src/}`
4. Найти все `schema.prisma` и `migrations/`
5. Найти все каталоги `mockups/` с узлами (`balloo-su/`, `admin-balloo-su/`)
6. Проверить `git log --all --full-history -- "**/packages/server/**"`
7. Проверить `git reflog` на удалённые коммиты
8. Записать результат в `tickets/step1_findings.md`

**Критерий:** Все файлы найдены или подтверждено отсутствие.

---

### Тикет №2: Проверка Git-истории

**Статус:** ⬜ Не начат  
**Приоритет:** 🔴 Критический  
**Время:** 30 мин

**Факты:**
- Git-репозиторий инициализирован
- В коммите 18 файлов (включая `deploy.sh`, `ensure-env.sh`)
- Нет файлов `package.json`, `Dockerfile.*`, `mockups/`

**Задание агенту:**
1. Выполнить `git log --all --full-history -- "**/package.json"`
2. Выполнить `git log --all --full-history -- "**/packages/server/src/**/*.ts"`
3. Выполнить `git log --all --full-history -- "**/mockups/**"`
4. Выполнить `git log --diff-filter=D --summary -- "**/packages/**"`
5. Выполнить `git reflog` на наличие удалённых коммитов
6. Если файлы были в истории — восстановить через `git checkout <commit> -- <path>`
7. Записать результат в `tickets/step2_git.md`

**Критерий:** Файлы восстановлены из истории или подтверждено отсутствие.

---

### Тикет №3: Восстановление структуры

**Статус:** ⬜ Не начат  
**Приоритет:** 🔴 Критический  
**Время:** 2 часа

**Факты:**
- `packages/` содержит 2 каталога из 6
- `mockups/` пуст (только `general_docs/`)
- `docker/` не содержит `Dockerfile.*`

**Задание агенту:**
1. Если файлы найдены в Тикете 1 — переместить в правильные каталоги
2. Если не найдены — создать структуру с нуля:
   ```bash
   mkdir -p packages/{shared,server,desktop,mobile-android,mobile-ios}/src
   mkdir -p mockups/{shared,balloo-su,admin-balloo-su,command-balloo-su,features-balloo-su,history-balloo-su,download-balloo-su,docs-balloo-su,blog-balloo-su,mobile,desktop,specifity-balloo-su}
   mkdir -p docker/
   ```
3. Если исходники `server/src/`, `desktop/src/` отсутствуют — создать минимальные заглушки
4. Записать результат в `tickets/step3_structure.md`

**Критерий:** Структура `packages/` и `mockups/` восстановлена.

---

### Тикет №4: Создание package.json

**Статус:** ⬜ Не начат  
**Приоритет:** 🔴 Критический  
**Время:** 1 час

**Факты:**
- Ни один `package.json` не существует
- Без него `pnpm install` невозможен

**Задание агенту:**
1. Создать корневой `package.json` с workspaces
2. Создать `pnpm-workspace.yaml`
3. Создать `package.json` для каждого пакета:
   - `packages/shared/package.json`
   - `packages/server/package.json`
   - `packages/web/package.json`
   - `packages/desktop/package.json`
   - `packages/mobile-android/package.json`
   - `packages/mobile-ios/package.json`
4. Создать `.env.example` с обязательными переменными
5. Записать результат в `tickets/step4_package_json.md`

**Критерий:** Все 7 `package.json` созданы.

---

### Тикет №5: Восстановление документации

**Статус:** ⬜ Не начат  
**Приоритет:** 🟡 Средний  
**Время:** 1 час

**Факты:**
- В `docs/` только 2 файла из 7 (`06-`, `07-`)
- Отсутствуют `00-`..`05-*.md`
- Нет `AGENTS.md`, `README.md`

**Задание агенту:**
1. Проверить наличие `AGENTS.md`, `README.md` в проекте
2. Проверить наличие файлов `docs/00-`..`05-*.md`
3. Если файлы найдены в другом месте — переместить
4. Если не найдены — создать минимальные версии на основе того, что есть в `docs/06-` и `docs/07-`
5. Проверить наличие файлов в `tickets/`
6. Записать результат в `tickets/step5_docs.md`

**Критерий:** Все файлы документации восстановлены или созданы заново.

---

### Тикет №6: Проверка путей

**Статус:** ⬜ Не начат  
**Приоритет:** 🟡 Средний  
**Время:** 1 час

**Факты:**
- Пути в документации могут не соответствовать реальности
- В `docs/07-server-setup-guide.md` есть пути к `scripts/`

**Задание агенту:**
1. Прочитать `docs/06-devops-infrastructure.md` и `docs/07-server-setup-guide.md`
2. Найти все пути к файлам (например, `packages/server/src/`, `mockups/balloo-su/`)
3. Проверить, существуют ли эти пути
4. Исправить несоответствия в файлах документации
5. Записать результат в `tickets/step6_paths.md`

**Критерий:** Все пути в документации исправлены.

---

### Тикет №7: Итоговая проверка

**Статус:** ⬜ Не начат  
**Приоритет:** 🟡 Средний  
**Время:** 1 час

**Факты:**
- Проект не может быть запущен
- Нет `pnpm install`, `pnpm build`, `pnpm test`

**Задание агенту:**
1. Проверить наличие всех необходимых файлов:
   - `package.json`, `pnpm-workspace.yaml`
   - `packages/*/package.json`
   - `docker/Dockerfile.server`, `docker/Dockerfile.web`
   - `docker-compose.yml`
2. Проверить, что `pnpm install` проходит
3. Проверить, что `pnpm build` проходит
4. Проверить Docker: `docker compose build`
5. Создать `tickets/final_report.md` с итогами
6. Записать результат в `tickets/step7_final.md`

**Критерий:** Проект готов к деплою staging.

---

## 📊 Статус тикетов

| # | Тикет | Статус | Результат |
|---|---|---|---|
| 1 | Поиск файлов | ⬜ Не начат | |
| 2 | Git-история | ✅ Завершён | Git отсутствует, восстановление невозможно |
| 3 | Структура | ⬜ Не начат | |
| 4 | package.json | ⬜ Не начат | |
| 5 | Документация | ⬜ Не начат | |
| 6 | Пути | ⬜ Не начат | |
| 7 | Итог | ⬜ Не начат | |

---

## 🚀 Команды запуска

```
прочитай документ: tickets/multiticket_restore.md и выполни команду: выполнить тикет №1
прочитай документ: tickets/multiticket_restore.md и выполни команду: выполнить тикет №2
прочитай документ: tickets/multiticket_restore.md и выполни команду: выполнить тикет №3
прочитай документ: tickets/multiticket_restore.md и выполни команду: выполнить тикет №4
прочитай документ: tickets/multiticket_restore.md и выполни команду: выполнить тикет №5
прочитай документ: tickets/multiticket_restore.md и выполни команду: выполнить тикет №6
прочитай документ: tickets/multiticket_restore.md и выполни команду: выполнить тикет №7
```
