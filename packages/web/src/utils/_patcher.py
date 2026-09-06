import re

path = '/home/ivan/Рабочий стол/проекты/balloo/tickets/deploy-ready.md'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# === NEW TICKETS ===
new_tickets = '''
#### Тикет №2: JWT токены — localStorage → httpOnly cookie

**Статус:** ...
