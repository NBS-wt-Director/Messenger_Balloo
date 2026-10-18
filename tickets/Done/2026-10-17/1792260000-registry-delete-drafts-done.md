# Тикет 1792160031 — Реестр: удалить черновики и дубли файлов

**Создан:** 16.10.2026 (unix 1792160031)
**Закрыт:** 17.10.2026 (unix 1792260000)
**Статус:** ✅ готов → закрыт
**Источник:** аудит → Н-14

## Результат

**Выполнено 16.10.2026 (подтверждено 17.10.2026):**

- ✅ 3 черновика удалены: `_mobile_attachments.html`, `_mobile_overview.html`, `_mobile_report.html`
- ✅ 7 дублей перенесены в `trash/`
- ✅ `trash/` добавлен в `.gitignore`
- ✅ Решение владельца 1.2.8 подтверждено

**Команда проверки:**
```bash
$ find mockups/ -name "_*.html" | wc -l
0
$ ls trash/ -R
trash/admin-balloo-su/login.html
trash/desktop/login.html
trash/desktop/register.html
trash/download-balloo-su/donate.html
trash/features-balloo-su/donate.html
trash/history-balloo-su/donate.html
trash/specifity-balloo-su/rules.html
```

**Связанные тикеты:** `1792160028` (дубли в JSON — Н-01,02,03,10,11,12), `1792160033` (desktop дубль в JSON).
