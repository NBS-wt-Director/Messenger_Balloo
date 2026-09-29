#!/usr/bin/env python3
# Вставка недостающих переводов в packages/shared/src/i18n/translations.ts
# (тикет 1790480626).
#
# Заполняются только те языки, где форма хотя бы правдоподобна: тюркские,
# финно-угорские, осетинский, украинский, белорусский, китайский, хинди,
# французский. Чеченский, аварский, даргинский и лезгинский НЕ заполняются:
# надёжной формы у меня нет, а подставлять русский или английский дубль —
# значит имитировать перевод. Они остаются на fallback t() (английская форма),
# вопрос вычитки носителем — В-30 в tickets/active/ВОПРОСЫ_ВЛАДЕЛЬЦУ.md.

import re
import sys

PATH = 'packages/shared/src/i18n/translations.ts'
ORDER = ['ru', 'en', 'tt', 'ba', 'ce', 'cv', 'av', 'dar', 'udm', 'lez', 'kbd',
         'chm', 'os', 'sah', 'bua', 'uk', 'zh', 'hi', 'be', 'fr']

ADD = {
    'app.tagline': {
        'tt': 'Balloo — рус мессенҗеры',
        'ba': 'Balloo — урыҫ мессенжеры',
        'cv': 'Balloo — вырӑс мессенджерӗ',
        'udm': 'Balloo — ӟуч мессенджер',
        'kbd': 'Balloo — урыс мессенджер',
        'chm': 'Balloo — руш мессенджер',
        'os': 'Balloo — уырыссаг мессенджер',
        'sah': 'Balloo — Арассыыйа мессенджера',
        'bua': 'Balloo — ород мессенжер',
        'uk': 'Balloo — російський месенджер',
        'zh': 'Balloo —— 俄罗斯即时通讯软件',
        'hi': 'Balloo — रूसी मैसेंजर',
        'be': 'Balloo — расійскі месенджар',
        'fr': 'Balloo — messagerie russe',
    },
    'menu.themeDark': {
        'tt': 'Караңгы', 'ba': 'Ҡараңғы', 'cv': 'Тĕттĕм', 'udm': 'Тьылес',
        'kbd': 'ПсытӀ', 'chm': 'Шолаҥ', 'os': 'Талынг', 'sah': 'Хараҥа',
        'bua': 'Хара', 'uk': 'Темна', 'zh': '深色', 'hi': 'डार्क',
        'be': 'Цёмная', 'fr': 'Sombre',
    },
    'menu.themeLight': {
        'tt': 'Ачык', 'ba': 'Асыҡ', 'cv': 'Ҫутӑ', 'udm': 'Шӧму',
        'kbd': 'ПхъуантӀэ', 'chm': 'Ош', 'os': 'Рухс', 'sah': 'Сырдыы',
        'bua': 'Сагаан', 'uk': 'Світла', 'zh': '浅色', 'hi': 'लाइट',
        'be': 'Светлая', 'fr': 'Clair',
    },
    'menu.themeRussian': {
        'tt': 'Рус', 'ba': 'Урыҫ', 'cv': 'Вырӑс', 'udm': 'Ӟуч',
        'kbd': 'Урыс', 'chm': 'Руш', 'os': 'Уырыссаг', 'sah': 'Арассыыйа',
        'bua': 'Ород', 'uk': 'Російська', 'zh': '俄式', 'hi': 'रूसी',
        'be': 'Расійская', 'fr': 'Russe',
    },
    'menu.profile': {
        'tt': 'Профиль', 'ba': 'Профиль', 'cv': 'Профиль', 'udm': 'Профиль',
        'kbd': 'Профиль', 'chm': 'Профиль', 'os': 'Профиль', 'sah': 'Профиль',
        'bua': 'Профиль', 'uk': 'Профіль', 'zh': '个人资料', 'hi': 'प्रोफ़ाइल',
        'be': 'Профіль', 'fr': 'Profil',
    },
    'menu.settings': {
        'tt': 'Көйләүләр', 'ba': 'Көйләүҙәр', 'cv': 'Тӑвӑмсем',
        'udm': 'Тыриськонъёс', 'kbd': 'Тегъэувын', 'chm': 'Тӧфештерымаш',
        'os': 'Фæткдæттæн', 'sah': 'Туруоруктар', 'bua': 'Тохиргоо',
        'uk': 'Налаштування', 'zh': '设置', 'hi': 'सेटिंग्स',
        'be': 'Налады', 'fr': 'Paramètres',
    },
    'menu.accounts': {
        'tt': 'Исәпләр', 'ba': 'Иҫәптәр', 'cv': 'Шутсем', 'udm': 'Аккаунтъёс',
        'kbd': 'Аккаунтхэр', 'chm': 'Аккаунт-влак', 'os': 'Аккаунттæ',
        'sah': 'Аккауннар', 'bua': 'Аккаунгууд', 'uk': 'Акаунти',
        'zh': '账户', 'hi': 'खाते', 'be': 'Акаўнты', 'fr': 'Comptes',
    },
    'auth.register': {'fr': "S'inscrire"},
    'profile.username': {'fr': "Nom d'utilisateur"},
    'error.serverError': {'fr': 'Erreur interne du serveur'},
}

NOTE = ('    // Машинные переводы: носителем не вычитаны. Формы тюркских,\n'
        '    // финно-угорских и осетинского подобраны по соседним ключам словаря.\n')


def main():
    src = open(PATH, encoding='utf-8').read()
    head, rest = src.split('export const translations', 1)
    body_start = rest.index('{')
    body = rest[body_start:]

    added = 0
    for key, values in ADD.items():
        m = re.search(r"  '" + re.escape(key) + r"': \{(.*?)\n  \},", body, re.S)
        if not m:
            print(f'НЕ НАЙДЕН ключ {key}', file=sys.stderr)
            sys.exit(1)
        block = m.group(1)
        have = set(re.findall(r'(?:^|[\s{,])([a-z]{2,3}): [\'"]', block))
        todo = {c: v for c, v in values.items() if c not in have}
        if not todo:
            continue

        lines = [f"    {c}: '{v}',"
                 for c, v in sorted(todo.items(), key=lambda x: ORDER.index(x[0]))]
        comment = NOTE if len(todo) > 5 else ''
        new_block = block.rstrip() + '\n' + comment + '\n'.join(lines) + '\n  '
        body = body[:m.start(1)] + new_block + body[m.end(1):]
        added += len(todo)
        print(f'{key}: +{len(todo)}')

    open(PATH, 'w', encoding='utf-8').write(
        head + 'export const translations' + rest[:body_start] + body)
    print('всего добавлено строк:', added)


if __name__ == '__main__':
    main()
