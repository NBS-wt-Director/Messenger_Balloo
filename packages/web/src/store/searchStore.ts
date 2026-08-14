// Search Store — Zustand
// Query, activeTab, results, recent searches

import { create } from 'zustand';

export type SearchTab = 'all' | 'chats' | 'people' | 'files' | 'media' | 'links';
export type SearchResultType = 'chat' | 'person' | 'file' | 'media' | 'link';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  avatarUrl?: string;
  avatarInitials?: string;
  icon?: string;
  size?: string;
  source?: string;
  messageCount?: number;
  highlight?: string;
}

export interface RecentSearch {
  id: string;
  query: string;
  timestamp: number;
}

interface SearchState {
  // Query & tab
  query: string;
  activeTab: SearchTab;

  // Results
  results: SearchResult[];
  recentSearches: RecentSearch[];

  // Loading state
  isLoading: boolean;
  hasSearched: boolean;

  // Global search modal
  showGlobalSearch: boolean;

  // Actions
  setQuery: (query: string) => void;
  setActiveTab: (tab: SearchTab) => void;
  setResults: (results: SearchResult[]) => void;
  setLoading: (isLoading: boolean) => void;
  setShowGlobalSearch: (show: boolean) => void;

  // Recent searches
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;

  // Reset
  reset: () => void;
}

export const useSearchStore = create<SearchState>()((set, get) => ({
  query: '',
  activeTab: 'all',
  results: [],
  recentSearches: [],
  isLoading: false,
  hasSearched: false,
  showGlobalSearch: false,

  setQuery: (query) => set({ query }),

  setActiveTab: (activeTab) => set({ activeTab }),

  setResults: (results) => set({ results }),

  setLoading: (isLoading) => set({ isLoading }),

  setShowGlobalSearch: (showGlobalSearch) => set({ showGlobalSearch }),

  addRecentSearch: (query) => {
    if (!query.trim()) return;
    const recentSearches = get().recentSearches;
    // Remove if already exists
    const filtered = recentSearches.filter((r) => r.query !== query);
    // Add to top, limit to 10
    const newSearches = [
      { id: crypto.randomUUID(), query, timestamp: Date.now() },
      ...filtered,
    ].slice(0, 10);
    set({ recentSearches: newSearches });
  },

  clearRecentSearches: () => set({ recentSearches: [] }),

  reset: () =>
    set({
      query: '',
      activeTab: 'all',
      results: [],
      hasSearched: false,
      isLoading: false,
      showGlobalSearch: false,
    }),
}));
