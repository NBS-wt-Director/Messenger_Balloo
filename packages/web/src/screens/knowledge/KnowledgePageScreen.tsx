// Knowledge Page Screen — просмотр страницы базы знаний
// Соответствует макету: mockups/command-balloo-su/knowledge-base.md

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/shared/Button';
import { Chip } from '@/components/shared/Chip';

interface KnowledgePageData {
  id: string;
  title: string;
  content: string;
  category: { name: string; icon: string; id: string };
  author: string;
  updatedAt: string;
  version: number;
  isOfficial: boolean;
  relatedPages: { id: string; title: string }[];
}

const PAGE_MOCK: KnowledgePageData = {
  id: '1',
  title: 'Регистрация и вход в Balloo',
  content: `Эта страница поможет вам создать аккаунт в Balloo и войти в систему.

## Создание аккаунта

Для регистрации вам понадобится:
- Действующий адрес электронной почты
- Придуманный пароль (минимум 8 символов)
- Желаемое имя пользователя

### Шаг 1: Переход на страницу регистрации

Откройте Balloo и нажмите кнопку "Регистрация" на экране входа.

### Шаг 2: Заполнение формы

Введите ваш email, придумайте пароль и укажите имя пользователя. Имя пользователя должно быть уникальным — оно будет использоваться для поиска вас другими пользователями.

### Шаг 3: Подтверждение email

После регистрации вам на почту придёт письмо со ссылкой подтверждения. Перейдите по ссылке, чтобы активировать аккаунт.

## Вход в систему

### По email

Введите email и пароль, указанные при регистрации.

### Через OAuth

Balloo поддерживает вход через:
- Яндекс ID
- VK ID
- Mail.ru ID

Нажмите на иконку нужного провайдера и авторизуйтесь.

> **Совет:** Если вы используете устройство впервые, отметьте "Запомнить устройство", чтобы не вводить код 2FA при каждом входе.

## Двухфакторная аутентификация

Рекомендуем включить 2FA для дополнительной защиты:
1. Откройте **Настройки** → **Безопасность**
2. Нажмите "Включить 2FA"
3. Отсканируйте QR-код в вашем TOTP-приложении
4. Сохраните резервные коды в безопасном месте`,
  category: { name: 'Начало работы', icon: '🚀', id: 'getting-started' },
  author: 'Администрация',
  updatedAt: '15 июля 2026',
  version: 3,
  isOfficial: true,
  relatedPages: [
    { id: '2', title: 'Настройка профиля и аватарки' },
    { id: '4', title: 'Настройка 2FA для безопасности' },
  ],
};

export function KnowledgePageScreen() {
  const navigate = useNavigate();
  const [page] = useState<KnowledgePageData>(PAGE_MOCK);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const handleEdit = () => {
    navigate(`/knowledge/edit/${page.id}`);
  };

  const handleRelatedClick = (pageId: string) => {
    navigate(`/knowledge/page/${pageId}`);
  };

  const handleBack = () => {
    navigate('/knowledge');
  };

  // Render markdown-like content
  const renderContent = () => {
    const lines = page.content.split('\n');
    const elements: React.ReactNode[] = [];
    let inList = false;

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('## ')) {
        if (inList) { elements.push(<ul key={`close-${index}`} style={{ marginBottom: '12px' }} />); inList = false; }
        const id = `section-${index}`;
        elements.push(
          <button
            key={id}
            onClick={() => toggleSection(id)}
            style={{
              fontSize: '17px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '24px 0 12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: 0,
            }}
          >
            <span style={{ transition: 'transform 0.2s', transform: expandedSections[id] ? 'rotate(90deg)' : 'rotate(0deg)' }}>
              ▶
            </span>
            {trimmed.slice(3)}
          </button>
        );
      } else if (trimmed.startsWith('### ')) {
        if (inList) { elements.push(<ul key={`close-${index}`} style={{ marginBottom: '12px' }} />); inList = false; }
        elements.push(
          <h4 key={`h3-${index}`} style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '16px 0 8px' }}>
            {trimmed.slice(4)}
          </h4>
        );
      } else if (trimmed.startsWith('> ')) {
        if (inList) { elements.push(<ul key={`close-${index}`} style={{ marginBottom: '12px' }} />); inList = false; }
        elements.push(
          <blockquote
            key={`bq-${index}`}
            style={{
              borderLeft: '3px solid var(--accent)',
              padding: '12px 16px',
              background: 'var(--bg-tertiary)',
              margin: '12px 0',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              lineHeight: '1.6',
            }}
          >
            {trimmed.slice(2)}
          </blockquote>
        );
      } else if (trimmed.startsWith('- ')) {
        if (!inList) {
          elements.push(<ul key={`open-${index}`} style={{ marginBottom: '12px', paddingLeft: '24px' }} />);
          inList = true;
        }
        elements.push(
          <li key={`li-${index}`} style={{ marginBottom: '4px', fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
            {trimmed.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
          </li>
        );
      } else if (trimmed === '') {
        if (inList) { elements.push(<ul key={`close-${index}`} style={{ marginBottom: '12px' }} />); inList = false; }
      } else {
        if (inList) { elements.push(<ul key={`close-${index}`} style={{ marginBottom: '12px' }} />); inList = false; }
        elements.push(
          <p key={`p-${index}`} style={{ marginBottom: '12px', fontSize: '14px', lineHeight: '1.7', color: 'var(--text-primary)' }}>
            {trimmed}
          </p>
        );
      }
    });

    if (inList) { elements.push(<ul key="close-final" style={{ marginBottom: '12px' }} />); }

    return elements;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--bg-tertiary)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={handleBack}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              ← Назад
            </button>
            <div
              style={{
                width: '36px',
                height: '36px',
                background: '#3b82f6',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              📚
            </div>
            <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
              {page.category.icon} {page.category.name}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" size="sm" onClick={handleEdit} style={{ fontSize: '13px' }}>
              ✏️ Редактировать
            </Button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <span style={{ cursor: 'pointer', color: 'var(--accent)' }} onClick={handleBack}>База знаний</span>
              <span>→</span>
              <span>{page.category.icon} {page.category.name}</span>
              <span>→</span>
              <span style={{ color: 'var(--text-secondary)' }}>{page.title}</span>
            </div>

            {/* Page title */}
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: '1.3' }}>
              {page.title}
            </h1>

            {/* Meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <Chip variant="default" style={{ fontSize: '12px' }}>
                {page.category.icon} {page.category.name}
              </Chip>
              {page.isOfficial && (
                <Chip variant="accent" style={{ fontSize: '12px' }}>Официальная</Chip>
              )}
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {page.author} · {page.updatedAt}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                v{page.version}
              </span>
            </div>

            {/* Page content */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                padding: '24px',
                lineHeight: '1.8',
                fontSize: '15px',
                color: 'var(--text-primary)',
              }}
            >
              {renderContent()}
            </div>

            {/* Related pages */}
            <div style={{ marginTop: '32px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                Связанные страницы
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {page.relatedPages.map((related) => (
                  <div
                    key={related.id}
                    onClick={() => handleRelatedClick(related.id)}
                    style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                      fontSize: '14px',
                      color: 'var(--accent)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                  >
                    → {related.title}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
