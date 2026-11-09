// LegalContacts — единый блок контактов на правовых страницах
// Правило владельца (09.11.2026, тикет 1794211607):
// Контакты
// Оператор: СЗ Оберюхтин Иван Анатольевич
// Email: balu-messanger@rambler.ru

interface LegalContactsProps {
  title?: string;
}

export function LegalContacts({ title = 'Контакты' }: LegalContactsProps) {
  return (
    <div className="card" style={{ marginBottom: 48, borderColor: 'var(--accent)' }}>
      <h2 className="card__title" style={{ marginBottom: 16 }}>{title}</h2>
      <div style={{ fontSize: 14, lineHeight: 1.8 }}>
        <p><strong>Оператор:</strong> СЗ Оберюхтин Иван Анатольевич</p>
        <p><strong>Email:</strong> <a href="mailto:balu-messanger@rambler.ru" style={{ color: 'var(--accent)' }}>balu-messanger@rambler.ru</a></p>
      </div>
    </div>
  );
}
