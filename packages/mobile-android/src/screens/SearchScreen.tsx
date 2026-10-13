// Balloo Messenger — Mobile Search Screen
// Global search: chats, contacts, messages, channels
// Filters, results grouped by category

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';
import { api } from '../services/api';
import Avatar from '../components/Avatar';

interface SearchScreenProps {
  navigation: any;
}

interface SearchResult {
  chats: Array<{ id: string; name: string; avatarUrl?: string; type: 'direct' | 'group' | 'channel' }>;
  contacts: Array<{ id: string; displayName: string; username: string; avatarUrl?: string; online?: boolean }>;
  messages: Array<{ id: string; chatId: string; chatName: string; content: string; senderName: string; createdAt: number }>;
  channels: Array<{ id: string; name: string; description: string; subscriberCount: number; avatarUrl?: string }>;
}

const FILTERS = [
  { key: 'chats', label: '💬 Чаты', active: true },
  { key: 'contacts', label: '👥 Контакты', active: true },
  { key: 'messages', label: '📝 Сообщения', active: true },
  { key: 'channels', label: '📢 Каналы', active: true },
] as const;

export default function SearchScreen({ navigation }: SearchScreenProps) {
  const theme = useUIStore((s) => s.theme);
  const colors = getThemeColors(theme);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [filters, setFilters] = useState<Record<string, boolean>>({
    chats: true,
    contacts: true,
    messages: true,
    channels: true,
  });
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults(null);
      setHasSearched(false);
      return;
    }
    setSearching(true);
    setHasSearched(true);
    try {
      const data = await api.globalSearch(query, filters);
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setSearching(false);
    }
  }, [query, filters]);

  const handleFilterToggle = (key: string) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleResultPress = (type: string, item: any) => {
    if (type === 'chats') {
      navigation.navigate('ChatView', { chatId: item.id, chatName: item.name });
    } else if (type === 'contacts') {
      navigation.navigate('Profile', { userId: item.id, userName: item.displayName });
    } else if (type === 'messages') {
      navigation.navigate('ChatView', { chatId: item.chatId, chatName: item.chatName });
    } else if (type === 'channels') {
      navigation.navigate('ChannelView', { channelId: item.id, channelName: item.name });
    }
  };

  const renderFilter = (filter: { key: string; label: string; active: boolean }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        {
          backgroundColor: filters[filter.key] ? colors.accent : colors.bgTertiary,
        },
      ]}
      onPress={() => handleFilterToggle(filter.key)}
    >
      <Text style={[styles.filterText, { color: filters[filter.key] ? colors.textInverse : colors.textPrimary }]}>
        {filter.label}
      </Text>
    </TouchableOpacity>
  );

  const renderChatResult = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.resultItem, { borderBottomColor: colors.borderLight }]}
      onPress={() => handleResultPress('chats', item)}
    >
      <Avatar name={item.name} size="sm" status={item.type === 'direct' ? undefined : undefined} bordered />
      <View style={styles.resultInfo}>
        <Text style={[styles.resultTitle, { color: colors.textPrimary }]}>{item.name}</Text>
        <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>
          {item.type === 'direct' ? 'Личный чат' : item.type === 'group' ? 'Группа' : 'Канал'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderContactResult = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.resultItem, { borderBottomColor: colors.borderLight }]}
      onPress={() => handleResultPress('contacts', item)}
    >
      <Avatar name={item.displayName} size="sm" status={item.online ? 'online' : undefined} bordered />
      <View style={styles.resultInfo}>
        <Text style={[styles.resultTitle, { color: colors.textPrimary }]}>{item.displayName}</Text>
        <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>@{item.username}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderMessageResult = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.resultItem, { borderBottomColor: colors.borderLight }]}
      onPress={() => handleResultPress('messages', item)}
    >
      <View style={[styles.messageIcon, { backgroundColor: colors.accentLight }]}>
        <Text style={[styles.messageIconText, { color: colors.accent }]}>💬</Text>
      </View>
      <View style={styles.resultInfo}>
        <Text style={[styles.resultTitle, { color: colors.textPrimary }]}>{item.chatName}</Text>
        <Text style={[styles.resultSubtitle, { color: colors.textSecondary }, styles.resultSnippet]} numberOfLines={2}>
          {item.content}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderChannelResult = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.resultItem, { borderBottomColor: colors.borderLight }]}
      onPress={() => handleResultPress('channels', item)}
    >
      <Avatar name={item.name} size="sm" bordered />
      <View style={styles.resultInfo}>
        <Text style={[styles.resultTitle, { color: colors.textPrimary }]}>{item.name}</Text>
        <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>
          {item.subscriberCount} подписчиков
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderSection = (title: string, data: any[], renderItem: any, keyPrefix: string) => {
    if (!filters[keyPrefix] || !data.length) return null;
    return (
      <View key={keyPrefix} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          scrollEnabled={false}
          ListEmptyComponent={
            <Text style={[styles.emptyResult, { color: colors.textTertiary }]}>Не найдено</Text>
          }
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.border }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Поиск"
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          autoFocus
        />
        {query ? (
          <TouchableOpacity onPress={() => { setQuery(''); setResults(null); setHasSearched(false); }}>
            <Text style={[styles.clearBtn, { color: colors.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filters */}
      <View style={[styles.filterBar, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.border }]}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => renderFilter(item)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {/* Results */}
      {hasSearched && !searching && results && (
        <View style={styles.resultsContainer}>
          {renderSection('Чаты', results.chats || [], renderChatResult, 'chats')}
          {renderSection('Контакты', results.contacts || [], renderContactResult, 'contacts')}
          {renderSection('Сообщения', results.messages || [], renderMessageResult, 'messages')}
          {renderSection('Каналы', results.channels || [], renderChannelResult, 'channels')}

          {!results.chats?.length && !results.contacts?.length && !results.messages?.length && !results.channels?.length && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Ничего не найдено</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Попробуйте изменить запрос или фильтры
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Loading */}
      {searching && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      )}

      {/* Empty state (before search) */}
      {!hasSearched && !searching && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Поиск</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Найдите чаты, контакты, сообщения и каналы
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 8,
    borderBottomWidth: 1,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 8 },
  clearBtn: { fontSize: 16, padding: 4 },
  filterBar: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  filterList: { paddingHorizontal: 8 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  filterText: { fontSize: 12, fontWeight: '600' },
  resultsContainer: { flex: 1 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', paddingHorizontal: 12, paddingVertical: 8 },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  resultInfo: { flex: 1 },
  resultTitle: { fontSize: 15, fontWeight: '600' },
  resultSubtitle: { fontSize: 12 },
  resultSnippet: { marginTop: 2 },
  messageIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageIconText: { fontSize: 18 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 260 },
  emptyResult: { fontSize: 13, textAlign: 'center', padding: 16 },
});
