#!/usr/bin/env python3
"""P37: единый подвал на 6 blog-экранах (blog.balloo.su).

Структура каждой return-ветки blog-экранов:
    <div>                      <- корень ветки (идёт строкой перед <BlogTopBar)
      <BlogTopBar ... />
      <div className="main">   <- контентная область (.main/.content из chat.css)
        ...
      </div>                   <- закрывает .main
    </div>
Правки:
  1. корень ветки -> <div className="page-with-footer"> (flex-колонка 100vh);
  2. после закрытия .main вставляется <AppFooter /> (sibling, как в PageChrome);
  3. добавляется импорт AppFooter.
Идемпотентно; падает, если число вставок не совпало с числом корней.
"""
import re
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[1] / 'packages' / 'web' / 'src' / 'screens' / 'blog-landing'

FILES = [
    'BlogLandingScreen.tsx',
    'BlogLandingPostScreen.tsx',
    'BlogCategoryScreen.tsx',
    'BlogChannelScreen.tsx',
    'BlogSearchScreen.tsx',
    'BlogSubscribeScreen.tsx',
]

ROOT_OPEN = re.compile(r'^(?P<ind>[ ]+)<div(?: className="(?P<cls>[^"]*)")?>$')
IMPORT_LINE = "import { AppFooter } from '@/components/chrome/AppFooter';"


def find_div_close(text: str, open_pos: int) -> int:
    """Индекс '</div>', закрывающего <div ...> на open_pos (балансированный обход)."""
    depth = 0
    i = open_pos
    while i < len(text):
        if text.startswith('<div', i):
            j = i + 4
            closed = False
            while j < len(text):
                if text.startswith('/>', j):
                    closed = True
                    break
                if text[j] == '>':
                    break
                j += 1
            i = j if closed else j + 1
            if not closed:
                depth += 1
            continue
        if text.startswith('</div>', i):
            depth -= 1
            if depth == 0:
                return i
            i += 6
            continue
        i += 1
    raise RuntimeError('не найден закрывающий </div>')


errors = []
for name in FILES:
    path = BASE / name
    src = path.read_text(encoding='utf-8')
    if 'AppFooter' in src:
        print(f'{name}: уже есть AppFooter — пропуск')
        continue

    lines = src.split('\n')

    # 1) корни веток: <div>, сразу за которым <BlogTopBar
    roots = []
    for i, line in enumerate(lines):
        m = ROOT_OPEN.match(line)
        if not m or i + 1 >= len(lines) or '<BlogTopBar' not in lines[i + 1]:
            continue
        cls = m.group('cls')
        if not cls:
            lines[i] = f'{m.group("ind")}<div className="page-with-footer">'
        elif 'page-with-footer' not in cls:
            lines[i] = f'{m.group("ind")}<div className="{cls} page-with-footer">'
        roots.append(i)
    if not roots:
        errors.append(f'{name}: корни с <BlogTopBar> не найдены')
        continue

    text = '\n'.join(lines)

    # 2) после закрывающего </div> блока .main вставляем <AppFooter />
    closes = []
    for m in re.finditer(r'<div className="main">', text):
        close_idx = find_div_close(text, m.start())
        # indent = отступ строки, содержащей этот </div> (= отступ открывающего .main)
        line_start = text.rfind('\n', 0, close_idx) + 1
        ind = text[line_start:close_idx]
        if not ind.isspace():
            ind = '      '
        closes.append((close_idx + len('</div>'), ind))
    for pos, ind in sorted(closes, reverse=True):
        text = text[:pos] + f'\n{ind}<AppFooter />' + text[pos:]

    # 3) импорт
    anchor = "import { BlogTopBar } from './BlogTopBar';"
    if anchor not in text:
        errors.append(f'{name}: не найден импорт BlogTopBar')
        continue
    text = text.replace(anchor, f'{IMPORT_LINE}\n{anchor}', 1)

    if len(roots) != len(closes):
        errors.append(f'{name}: корней {len(roots)}, блоков .main {len(closes)}')
        continue

    path.write_text(text, encoding='utf-8')
    print(f'{name}: веток {len(roots)}, подволов {len(closes)}')

if errors:
    print('\nОШИБКИ (файлы не записаны):')
    for e in errors:
        print('  ' + e)
    sys.exit(1)
print('\nГотово')