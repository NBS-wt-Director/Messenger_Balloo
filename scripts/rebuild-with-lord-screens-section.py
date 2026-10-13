#!/usr/bin/env python3
"""Раздел 4 «Приёмка макетов» в with_lord/СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md.

Источник строк — tickets/active/with_lord/_screens_data.txt (эталон, 75 экранов).
MVP1-узлы (00,01,05,06,08,09) — первой таблицей по одной строке на макет,
остальные узлы — второй таблицей в конце раздела. Остальные разделы файла не меняются.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = ROOT / "tickets/active/with_lord/_screens_data.txt"
TARGET = ROOT / "tickets/active/with_lord/СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md"

MVP1_NODES = {"00", "01", "05", "06", "08", "09"}


def parse():
    """Заголовки узлов и строки экранов. Формат данных фиксированный:
    'у_NN|Название|кол-во|NN' и '  1_xx_yy|Название|путь.html'."""
    nodes = []  # (node_id, node_title, [(screen_id, title, path)])
    for raw in DATA.read_text(encoding="utf-8").splitlines():
        if raw.startswith("у_"):
            parts = raw.split("|")
            if len(parts) != 4:
                sys.exit(f"Неизвестный формат заголовка узла: {raw!r}")
            nodes.append((parts[3], parts[1], []))
        elif raw.startswith("  1_"):
            parts = raw.strip().split("|")
            if len(parts) != 3 or not nodes:
                sys.exit(f"Неизвестный формат строки экрана: {raw!r}")
            nodes[-1][2].append((parts[0], parts[1], parts[2]))
        elif raw.strip():
            sys.exit(f"Неизвестная строка в данных: {raw!r}")
    if not nodes:
        sys.exit("Данные пусты — правку не делаю")
    return nodes


def table(nodes):
    rows = ["| № | ID | Экран | Файл макета | Открыть | Дата принятия | Комментарий |",
            "|---|---|---|---|---|---|---|"]
    total = 0
    for idx, (node_id, node_title, screens) in enumerate(nodes, start=1):
        rows.append(f"| **4.{idx}** | | **у_{node_id} {node_title}** | "
                    f"`{screens[0][2].split('/')[0]}/` | | | |" if screens else
                    f"| **4.{idx}** | | **у_{node_id} {node_title}** | | | | |")
        for screen_id, title, path in screens:
            rows.append(f"| | `{screen_id}` | {title} | `mockups/{path}` | "
                        f"[открыть](../../../mockups/{path}) | | |")
            total += 1
    return rows, total


def main():
    nodes = parse()
    mvp1 = [n for n in nodes if n[0] in MVP1_NODES]
    other = [n for n in nodes if n[0] not in MVP1_NODES]
    if not mvp1 or not other:
        sys.exit(f"Разбиение пустое: mvp1={len(mvp1)}, other={len(other)}")

    mvp1_rows, mvp1_total = table(mvp1)
    other_rows, other_total = table(other)

    section = [
        "## 4. Приёмка макетов — 75 экранов в статусе «Просмотрен»",
        "",
        "**Зачем:** 79 экранов были просмотрены, 4 приняты (В-9..В-12), осталось **75**.",
        "**Как:** открыть строку таблицы (колонка «Открыть»), принять или отклонить.",
        "**Одна строка = один макет.** Источник строк — "
        "`tickets/active/with_lord/_screens_data.txt` (этот же список в "
        "`mockups/DECOMPILE.md` §1.4).",
        "",
        "**Состав MVP1** (`PROJECT_DOCUMENTATION.md` §17): `balloo.su` + `api.balloo.su` +",
        "`history.balloo.su` + `download.balloo.su` + desktop (win/linux) + Android.",
        f"**Сначала — таблица A (MVP1, {mvp1_total} макетов), затем таблица B "
        f"(вне MVP1, {other_total} макетов).**",
        "",
        f"### 4A. Макеты MVP1 — {mvp1_total} строк, принимать первыми",
        "",
        *mvp1_rows,
        "",
        f"### 4B. Макеты вне MVP1 — {other_total} строк, принимать после 4A",
        "",
        *other_rows,
        "",
    ]
    new_section = "\n".join(section)

    text = TARGET.read_text(encoding="utf-8")
    start = text.find("## 4. Приёмка макетов")
    end = text.find("\n## 5. ")
    if start == -1 or end == -1 or end < start:
        sys.exit("Границы раздела 4 не найдены — правку не делаю")

    old = text[start:end]
    old_screens = len(re.findall(r"^\| \| `1_", new_section, re.M))
    if old_screens != mvp1_total + other_total:
        sys.exit(f"Строк экранов {old_screens}, ожидалось {mvp1_total + other_total}")

    TARGET.write_text(text[:start] + new_section + text[end:], encoding="utf-8")
    print(f"OK: mvp1={mvp1_total}, other={other_total}, "
          f"rows_written={old_screens}, old_section_chars={len(old)}")


if __name__ == "__main__":
    main()
