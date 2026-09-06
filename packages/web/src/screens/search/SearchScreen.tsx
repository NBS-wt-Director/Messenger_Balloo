// Search Screen — глобальный поиск по чатам, людям, файлам, медиа и ссылкам
// Табы-фильтры, недавние поиски, debounced input

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchStore, type SearchTab } from '@/store/searchStore';
import { SearchTabs, SearchResultItem, EmptyState } from '@/components/search';
import { api } from '@/services/api';

// Типы результатов поиска
interface SearchPerson {
  id: string;
  type: 'person';
  title: string;
  subtitle: string;
  avatarInitials: string;
  messageCount?: number;
}

interface SearchChat {
  id: string;
  type: 'chat';
  title: string;
  subtitle: string;
  avatarInitials: string;
  messageCount?: number;
}

interface SearchFile {
  id: string;
  type: 'file';
  title: string;
  subtitle: string;
  icon: string;
  size?: string;
  source?: string;
}

interface SearchMedia {
  id: string;
  type: 'media';
  title: string;
  subtitle: string;
  icon: string;
  size?: string;
  source?: string;
}

interface SearchLink {
  id: string;
  type: 'link';
  title: string;
  subtitle: string;
  icon: string;
  source?: string;
}

type SearchResult = SearchPerson | SearchChat | SearchFile | SearchMedia | SearchLink;

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
  const [allResults, setAllResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Load search results from API
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setAllResults([]);
      return;
    }

    setLoading(true);
    api.searchUsers(debouncedQuery)
      .then((users) => {
        const people: SearchPerson[] = (users || []).map((u: any) => ({
          id: u.id,
          type: 'person' as const,
          title: u.displayName || u.username,
          subtitle: `${u.status === 'online' ? 'Онлайн' : 'Был(а) недавно'} • ${u.role || 'Пользователь'}`,
          avatarInitials: (u.displayName || u.username || '?')
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2),
        }));
        setAllResults(people);
        setLoading(false);
      })
      .catch(() => {
        setAllResults([]);
        setLoading(false);
      });
  }, [debouncedQuery]);

  const filteredResults = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return [];
    }
    const q = debouncedQuery.toLowerCase();
    return allResults.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q)
    );
  }, [debouncedQuery, allResults]);

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
