import json

with open('mockups/index_ecrans.json', 'r') as f:
    idx = json.load(f)

all_screens = []
for node in idx['nodes']:
    for s in node['screens']:
        all_screens.append({
            'node': node['id'],
            'node_name': node['name'],
            'id': s['id'],
            'name': s['name'],
            'file': s['file'],
            'status': s['status'],
        })

not_accepted = [s for s in all_screens if s['status'] in ['❌', 'Не принят', 'Создан']]
accepted = [s for s in all_screens if s['status'] == 'Принят']
viewed = [s for s in all_screens if s['status'] == 'Просмотрен']

print(f"Total: {len(all_screens)}")
print(f"Accepted: {len(accepted)}")
print(f"Viewed: {len(viewed)}")
print(f"Not accepted: {len(not_accepted)}")

print("\n=== NOT ACCEPTED ===")
for s in not_accepted:
    print(f"{s['id']} | {s['node_name']} | {s['name']} | {s['status']} | {s['file']}")
