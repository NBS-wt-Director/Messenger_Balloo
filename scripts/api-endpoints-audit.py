#!/usr/bin/env python3
"""Аудит API-эндпоинтов: сверяет пути, которые вызывают клиенты,
с маршрутами, которые реально регистрирует сервер (Express).

Извлекает:
  - клиенты: литералы '/api/...' и шаблонные ` /api/... ` в services/api.ts
    (web, mobile-android) и в экранах desktop;
  - сервер: mount-префиксы из routes/index.ts (router.use('/api/x', ...))
    и router.<method>('<path>') внутри каждого файла routes/*.ts.

Шаблонные сегменты ${...} и :id нормализуются в '*', чтобы сравнение было
по структуре пути.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------------------------------------------------------------
# 1. Клиентские вызовы
# ---------------------------------------------------------------
CLIENT_DIRS = {
    'web': 'packages/web/src',
    'mobile': 'packages/mobile-android/src',
    'desktop': 'packages/desktop/src',
}

# все вызовы request(...) с '/api/...' или `/api/...`
RE_LITERAL = re.compile(r"""['\"](/api/[^'\"\n]*)['\"]""")
RE_TEMPLATE = re.compile(r"""`(/api/[^`\n]*)`""")
RE_METHOD = re.compile(r"method:\s*['\"](\w+)['\"]")


def norm(path: str) -> str:
    """Нормализация: query-строку отбрасываем, ${...} и :seg -> '*'."""
    path = path.split('?')[0].split('$')[0]
    # шаблоны вида ${chatId} уже обрезаны split('$'), но хвост после них:
    # '`/api/chats/${chatId}/attachments`' -> '/api/chats/' — режем по ${
    path = re.sub(r'/+$', '', path)
    return path


def client_path_full(raw: str) -> str:
    """Нормализация с сохранением структуры: ${...} и :seg -> '*segment'."""
    p = raw.split('?')[0]
    p = re.sub(r"\$\{[^}]*\}", '*', p)
    p = re.sub(r'/+$', '', p)
    return p


def extract_client_calls():
    calls = set()
    for client, rel_dir in CLIENT_DIRS.items():
        base = os.path.join(ROOT, rel_dir)
        if not os.path.isdir(base):
            continue
        for dirpath, _dirs, files in os.walk(base):
            if 'node_modules' in dirpath or '__tests__' in dirpath:
                continue
            for fn in files:
                if not fn.endswith(('.ts', '.tsx')):
                    continue
                full = os.path.join(dirpath, fn)
                src = open(full, encoding='utf-8').read()
                lines = src.splitlines()
                for i, line in enumerate(lines):
                    found = RE_LITERAL.findall(line) + RE_TEMPLATE.findall(line)
                    for raw in found:
                        if not raw.startswith('/api/'):
                            continue
                        method = 'GET'
                        ctx = '\n'.join(lines[i:i + 5])
                        m = RE_METHOD.search(ctx)
                        if m:
                            method = m.group(1).upper()
                        calls.add((client, method, client_path_full(raw)))
    return calls


# ---------------------------------------------------------------
# 2. Серверные маршруты
# ---------------------------------------------------------------
RE_USE = re.compile(r"router\.use\(\s*['\"](/api/[^'\"]*)['\"]\s*,\s*(\w+)")
RE_ROUTE = re.compile(r"router\.(get|post|put|patch|delete)\(\s*['\"]([^'\"]*)['\"]")


def extract_server_routes():
    routes = set()
    idx = os.path.join(ROOT, 'packages/server/src/routes/index.ts')
    src = open(idx, encoding='utf-8').read()
    mounts = dict()  # переменная роутера -> префикс
    for prefix, var in RE_USE.findall(src):
        mounts[var] = prefix

    routes_dir = os.path.join(ROOT, 'packages/server/src/routes')
    for fn in os.listdir(routes_dir):
        if not fn.endswith('.ts') or fn == 'index.ts':
            continue
        var = fn[:-3] + 'Router'  # chats.ts -> chatsRouter
        prefix = mounts.get(var)
        if prefix is None:
            # пробуем найти mount по другому имени переменной
            prefix = find_mount_for_file(fn, src)
        full = os.path.join(routes_dir, fn)
        rsrc = open(full, encoding='utf-8').read()
        for method, path in RE_ROUTE.findall(rsrc):
            p = path if path != '/' else ''
            p = re.sub(r':[A-Za-z0-9_]+', '*', p)
            p = re.sub(r'/+$', '', p)
            if prefix is None:
                continue
            pref = re.sub(r':[A-Za-z0-9_]+', '*', prefix)
            fullpath = (pref + p) or '/'
            fullpath = re.sub(r'/+$', '', fullpath) or '/'
            routes.add((method.upper(), fullpath))
    return routes, mounts


def find_mount_for_file(filename, index_src):
    base = filename[:-3]
    # ищем import { router as XRouter } from './base' и router.use('/api/..', XRouter)
    imp = re.search(r"import\s*\{\s*router as (\w+)\s*\}\s*from\s*['\"]\./" + re.escape(base) + "['\"]", index_src)
    if not imp:
        return None
    var = imp.group(1)
    m = re.search(r"router\.use\(\s*['\"](/api/[^'\"]*)['\"]\s*,\s*" + re.escape(var), index_src)
    return m.group(1) if m else None


# ---------------------------------------------------------------
# 3. Сверка
# ---------------------------------------------------------------
def client_matches_server(client_method, client_path, server_routes):
    """Клиентский путь может быть обрезан на ${...}: сравниваем по префикс-структуре."""
    for method, spath in server_routes:
        if method != client_method:
            continue
        # нормализуем серверный путь: '*' совпадает с любым сегментом
        csegs = client_path.split('/')
        ssegs = spath.split('/')
        if len(csegs) != len(ssegs):
            continue
        ok = True
        for c, s in zip(csegs, ssegs):
            if s == '*':
                continue
            if c == '*':
                continue
            if c != s:
                ok = False
                break
        if ok:
            return True
    return False


def main():
    calls = extract_client_calls()
    server_routes, mounts = extract_server_routes()

    print(f"Клиентских вызовов: {len(calls)}")
    print(f"Серверных маршрутов: {len(server_routes)}")
    print()

    missing = []
    for client, method, path in sorted(calls):
        if not client_matches_server(method, path, server_routes):
            missing.append((client, method, path))

    if missing:
        print("=== Клиент вызывает, а сервер НЕ регистрирует ===")
        for client, method, path in missing:
            print(f"  [{client}] {method} {path}")
    else:
        print("Все клиентские вызовы имеют серверный маршрут.")

    # Обратная сверка: серверные маршруты с mount-префиксом, которых нет ни в
    # одном клиенте (информационно, не ошибка)
    print()
    print(f"Всего несоответствий: {len(missing)}")
    return 1 if missing else 0


if __name__ == '__main__':
    sys.exit(main())
