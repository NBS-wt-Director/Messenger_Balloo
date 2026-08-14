// Search Screen — глобальный поиск по чатам, людям, файлам, медиа и ссылкам
// Табы-фильтры, недавние поиски, debounced input

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchStore, type SearchTab } from '@/store/searchStore';
import { SearchTabs, SearchResultItem, EmptyState } from '@/components/search';

// Mock data for demo purposes
const MOCK_RECENT = [
  {
    id: '1',
    type: 'person',
    title: 'Мария Андреева',
    subtitle: 'Чат • 12 сообщений',
    avatarInitials: 'МА',
    messageCount: 12,
  },
  {
    id: '2',
    type: 'chat',
    title: 'Команда разработки',
    subtitle: 'Группа • 156 сообщений',
    avatarInitials: 'РД',
    messageCount: 156,
  },
  {
    id: '3',
    type: 'file',
    title: 'Макеты_v2.pdf',
    subtitle: 'Файл • 2.4 МБ • Из чата с М. Андреевой',
    icon: '📄',
    size: '2.4 МБ',
    source: 'Чат с М. Андреевой',
  },
  {
    id: '4',
    type: 'media',
    title: 'Демо_звонка.mp4',
    subtitle: 'Видео • 15 МБ • Из группы "Команда разработки"',
    icon: '🎬',
    size: '15 МБ',
    source: 'Группа "Команда разработки"',
  },
];

const MOCK_PEOPLE = [
  { id: 'p1', type: 'person', title: 'Иван Петров', subtitle: 'Разработчик • Онлайн', avatarInitials: 'ИП' },
  { id: 'p2', type: 'person', title: 'Елена Сидорова', subtitle: 'Дизайнер • Был(а) 5 мин назад', avatarInitials: 'ЕС' },
  { id: 'p3', type: 'person', title: 'Алексей Козлов', subtitle: 'Менеджер • Онлайн', avatarInitials: 'АК' },
];

const MOCK_CHATS = [
  { id: 'c1', type: 'chat', title: 'Личные сообщения', subtitle: 'Личный чат • 45 сообщений', avatarInitials: 'ЛС', messageCount: 45 },
  { id: 'c2', type: 'chat', title: 'Отдел дизайна', subtitle: 'Группа • 230 сообщений', avatarInitials: 'ОД', messageCount: 230 },
];

const MOCK_FILES = [
  { id: 'f1', type: 'file', title: 'Отчёт_Q2.docx', subtitle: 'Документ • 1.2 МБ • 3 дня назад', icon: '📄', size: '1.2 МБ', source: 'Чат "Личные сообщения"' },
  { id: 'f2', type: 'file', title: 'Презентация.pptx', subtitle: 'Презентация • 5.8 МБ • 1 неделю назад', icon: '📊', size: '5.8 МБ', source: 'Чат "Отдел дизайна"' },
];

const MOCK_MEDIA = [
  { id: 'm1', type: 'media', title: 'Скриншот_экрана.png', subtitle: 'Изображение • 2.1 МБ • Вчера', icon: '🖼️', size: '2.1 МБ', source: 'Чат "Личные сообщения"' },
  { id: 'm2', type: 'media', title: 'Голосовое_сообщение.ogg', subtitle: 'Аудио • 0.5 МБ • 2 дня назад', icon: '🎙️', size: '0.5 МБ', source: 'Чат "Команда разработки"' },
];

const MOCK_LINKS = [
  { id: 'l1', type: 'link', title: 'Документация Balloo API', subtitle: 'docs.balloo.su • 2 дня назад', icon: '🔗', source: 'Чат "Команда разработки"' },
  { id: 'l2', type: 'link', title: 'Figma — Макеты v3', subtitle: 'figma.com/file/... • 5 дней назад', icon: '🔗', source: 'Чат "Отдел дизайна"' },
];

const tabDataMap: Record<string, any> = {
  all: [...MOCK_RECENT],
  chats: MOCK_CHATS,
  people: MOCK_PEOPLE,
  files: MOCK_FILES,
  media: MOCK_MEDIA,
  links: MOCK_LINKS,
};

const tabEmojis: Record<string, string> = {
  all: '🔍',
  chats: '💬',
  people: '👤',
  files: '📎',
  media: '🎬',
  links: '🔗',
};

function SearchScreen() {
  const {
    query,
    activeTab,
    results,
    recentSearches,
    isLoading,
    setQuery,
    setActiveTab,
    setResults,
    setLoading,
  } = useSearchStore();

  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const filteredResults = useMemo(() => {
    let data: typeof MOCK_RECENT;
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      const allData = Object.values(tabDataMap).flat();
      data = allData.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q)
      );
    } else {
      data = tabDataMap[activeTab];
    }
    return data;
  }, [debouncedQuery, activeTab]);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      setLoading(true);
      const timer = setTimeout(() => {
        setLoading(false);
        setResults(filteredResults as any);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setResults(filteredResults as any);
    }
  }, [debouncedQuery, filteredResults, setActiveTab, setLoading, setResults]);

  const handleResultClick = useCallback((id: string) => {
    const result = results.find((r: any) => r.id === id);
    if (!result) return;
    switch (result.type) {
      case 'person':
        window.location.hash = '#/profile/ivan';
        break;
      case 'chat':
        window.location.hash = '#/chat/chat-id-placeholder';
        break;
      case 'file':
      case 'media':
        break;
      case 'link':
        break;
    }
  }, [results]);

  const showRecent = !debouncedQuery.trim() && activeTab === 'all';
  const showResults = showRecent || filteredResults.length > 0;
  const showEmpty = !showRecent && !showResults && !isLoading;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-primary)',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '800px',
          width: '100%',
          margin: '0 auto',
          padding: '24px 20px',
          overflow: 'hidden',
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '0',
            }}
          >
            <span style={{ fontSize: '18px', flexShrink: 0 }}>🔍</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по чатам, людям, файлам, медиа..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '16px',
                padding: '0',
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '0',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <SearchTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div style={{ flex: 1, overflowY: 'auto', marginTop: '8px' }}>
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
              <div className="spinner" />
            </div>
          )}

          {showRecent && !isLoading && (
            <div>
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                  marginTop: '8px',
                  paddingLeft: '4px',
                }}
              >
                Недавние
              </div>
              {recentSearches.length > 0 && (
                <div style={{ marginBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                  {recentSearches.slice(0, 5).map((rs) => (
                    <div
                      key={rs.id}
                      onClick={() => setQuery(rs.query)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ fontSize: '16px', opacity: 0.5 }}>🕐</span>
                      <span style={{ flex: 1, fontSize: '14px', color: 'var(--text-primary)' }}>{rs.query}</span>
                    </div>
                  ))}
                </div>
              )}
              {results.map((result) => (
                <SearchResultItem key={result.id} result={result} onClick={handleResultClick} />
              ))}
            </div>
          )}

          {showResults && !showRecent && !isLoading && (
            <div>
              {debouncedQuery.trim() && (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', paddingLeft: '4px' }}>
                  Найдено: {filteredResults.length}
                </div>
              )}
              {filteredResults.map((result) => (
                <SearchResultItem key={result.id} result={result} onClick={handleResultClick} />
              ))}
            </div>
          )}

          {showEmpty && <EmptyState tab={activeTab} emoji={tabEmojis[activeTab]} />}
        </div>
      </div>
    </div>
  );
}

export default SearchScreen;
