#!/usr/bin/env python3
"""Сверка клиентских вызовов /api/* с таблицей маршрутов Express.

Таблица сервера — scripts/server_routes.txt: её даёт тест
packages/server/src/__tests__/dump-routes.test.ts, обходящий РЕАЛЬНУЮ таблицу
маршрутов запущенного приложения (не текст файлов).

Метод клиента определяется по блоку вызова request(...): окно от строки с
путём до начала следующего свойства объекта api.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SERVER_ROUTES_FILE = os.path.join(ROOT, 'scripts', 'server_routes.txt')

CLIENT_DIRS = {
    'web': 'packages/web/src',
    'mobile': 'packages/mobile-android/src',
    'desktop': 'packages/desktop/src',
}

RE_PATH = re.compile(r"""['\"`](/api/[^'\"`\n]*)['\"`]""")
RE_METHOD = re.compile(r"""method:\s*['\"](\w+)['\"]""")
# shorthand-вызовы: api.get/post/put/patch/delete('/api/...')
RE_SHORTHAND = re.compile(r"""\bapi\.(get|post|put|patch|delete)\s*(?:<[^()]*>)?\(""")
# начало следующего свойства объекта api: "  name: (" или "  name:"
RE_NEXT_PROP = re.compile(r"^  [A-Za-z_]\w*\s*[:=]")
# const API_BASE = '/api/...' — объявление префикса, не вызов
RE_CONST_DECL = re.compile(
    r"^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*['\"`](/api/[^'\"`]*)['\"`]")
# использование префикса: `${API_BASE}/status`
RE_CONST_TEMPLATE = re.compile(r"""['\"`]\$\{(\w+)\}(/[^'\"`\n]*)['\"`]?""")
# использование префикса как аргумента: fetch(LOG_ENDPOINT, ...)
RE_CONST_ARG = re.compile(r"""(?:fetch|request)\s*(?:<[^()]*>)?\(\s*(\w+)\s*[,)]""")


def norm(path: str) -> str:
    p = path.split('?')[0]
    p = re.sub(r"\$\{[^}]*\}", '*', p)
    # вложенные шаблоны (${q ? `&x=${v}` : ''}) — всё, что осталось после '${',
    # это конкатенация query-строки, а не путь
    p = p.split('${')[0]
    p = re.sub(r':[A-Za-z0-9_]+', '*', p)
    p = re.sub(r'/+', '/', p)
    p = re.sub(r'/+$', '', p)
    return p or '/'


def client_methods(lines, idx):
    """Возвращает множество методов для пути на строке idx.

    1. shorthand api.get/post/put/patch/delete(...) в окне -2..+6 — берём его;
    2. иначе ищем literal `method: 'X'` до начала следующего свойства объекта;
    3. иначе GET (request() по умолчанию).
    """
    lo, hi = max(0, idx - 2), min(len(lines), idx + 7)
    short = set()
    for j in range(lo, hi):
        m = RE_SHORTHAND.search(lines[j])
        if m:
            short.add(m.group(1).upper())
    if short:
        return short

    window = []
    for j in range(idx, len(lines)):
        if j > idx and RE_NEXT_PROP.match(lines[j]):
            break
        window.append(lines[j])
        if j - idx > 12:
            break
    m = RE_METHOD.search('\n'.join(window))
    return {m.group(1).upper()} if m else {'GET'}


def extract_client_calls():
    calls = {}
    for client, rel in CLIENT_DIRS.items():
        base = os.path.join(ROOT, rel)
        if not os.path.isdir(base):
            continue
        for dirpath, dirs, files in os.walk(base):
            dirs[:] = [d for d in dirs if d != 'node_modules']
            if '__tests__' in dirpath:
                continue
            for fn in files:
                if not fn.endswith(('.ts', '.tsx')):
                    continue
                full = os.path.join(dirpath, fn)
                lines = open(full, encoding='utf-8').read().splitlines()
                # словарь const NAME = '/api/...' для разворота ${NAME}/path
                consts = {}
                for ln in lines:
                    m = RE_CONST_DECL.match(ln)
                    if m:
                        consts[m.group(1)] = m.group(2)
                for i, line in enumerate(lines):
                    # служебные сравнения ('/api/auth/'.startsWith) — не вызовы
                    if 'startsWith(' in line or 'endsWith(' in line or 'includes(' in line:
                        continue
                    # объявление константы: const API_BASE = '/api/...' — не вызов
                    if RE_CONST_DECL.match(line):
                        continue
                    # соберем raw-пути из строки
                    raw_paths = RE_PATH.findall(line)
                    # разворот ${CONST}/subpath
                    for m in RE_CONST_TEMPLATE.finditer(line):
                        const_name = m.group(1)
                        rest = m.group(2)
                        if '${' not in rest and const_name in consts:
                            raw_paths.append(consts[const_name] + rest)
                    # fetch(LOG_ENDPOINT, ...) / request(LOG_ENDPOINT, ...)
                    for m in RE_CONST_ARG.finditer(line):
                        arg_name = m.group(1)
                        if arg_name in consts:
                            raw_paths.append(consts[arg_name])
                    for raw in raw_paths:
                        path = norm(raw)
                        for method in client_methods(lines, i):
                            key = (method, path)
                            calls.setdefault(key, set()).add(
                                f"{client}:{os.path.relpath(full, ROOT)}:{i+1}")
    return calls


def load_server_routes():
    routes = set()
    with open(SERVER_ROUTES_FILE, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            m = re.match(r'^(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD) (\S+)$', line)
            if m:
                routes.add((m.group(1), norm(m.group(2))))
    return routes


def main():
    if not os.path.exists(SERVER_ROUTES_FILE):
        print('Нет scripts/server_routes.txt — сначала: npx jest dump-routes')
        return 2

    calls = extract_client_calls()
    server = load_server_routes()

    missing = {k: v for k, v in calls.items() if k not in server}

    print(f'Клиентских путей (уник. метод+путь): {len(calls)}')
    print(f'Серверных маршрутов: {len(server)}')
    print(f'НЕ СОВПАДАЕТ: {len(missing)}')
    print()
    for (method, path), locs in sorted(missing.items()):
        src = sorted(locs)[0]
        print(f'  {method:6} {path:52} {src}')

    return 1 if missing else 0


if __name__ == '__main__':
    sys.exit(main())
