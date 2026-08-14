// Balloo Messenger — Mobile Knowledge Base Screen
// Categories, search, knowledge pages list

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';
import { api } from '../services/api';

interface KnowledgePage {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  categoryName?: string;
  version: number;
  updatedAt: number;
}

interface KnowledgeCategory {
  id: string;
  name: string;
  slug: string;
  pageCount?: number;
}

interface KnowledgeScreenProps {
  navigation: any;
}

export default function KnowledgeScreen({ navigation }: KnowledgeScreenProps) {
  const [pages, setPages] = useState<KnowledgePage[]>([]);
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const theme = useUIStore((s) => s.theme);
  const colors = getThemeColors(theme);

  const fetchData = useCallback(async () => {
    try {
      const [pagesData, categoriesData] = await Promise.all([
        api.getKnowledgePages(),
        api.getKnowledgeCategories(),
      ]);
      setPages(pagesData || []);
      setCategories(categoriesData || []);
    } catch (error: any) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handlePagePress = (page: KnowledgePage) => {
    navigation.navigate('KnowledgePage', { pageId: page.id, pageTitle: page.title });
  };

  const filteredPages = pages.filter((p) => {
    if (activeCategory && p.categoryId !== activeCategory) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q);
  });

  const stripHtml = (html: string): string => {
    return html.replace(/<[^>]*>/g, '').substring(0, 100);
  };

  const renderPageItem = ({ item }: { item: KnowledgePage }) => (
    <TouchableOpacity
      style={[styles.pageCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
      onPress={() => handlePagePress(item)}
      activeOpacity={0.7}
    >
      <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>{item.title}</Text>
      <Text style={[styles.pageExcerpt, { color: colors.textSecondary }]} numberOfLines={2}>
        {stripHtml(item.content)}
      </Text>
      <View style={styles.pageMeta}>
        {item.categoryName && (
          <Text style={[styles.pageCategory, { color: colors.accent }]}>{item.categoryName}</Text>
        )}
        <Text style={[styles.pageVersion, { color: colors.textTertiary }]}>v{item.version}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryChip = ({ item }: { item: KnowledgeCategory }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        {
          backgroundColor: activeCategory === item.id ? colors.accentLight : colors.bgTertiary,
          borderColor: activeCategory === item.id ? colors.accent : colors.border,
        },
      ]}
      onPress={() => setActiveCategory(activeCategory === item.id ? null : item.id)}
    >
      <Text
        style={[
          styles.categoryChipText,
          { color: activeCategory === item.id ? colors.accent : colors.textSecondary },
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Search */}
      <View style={[styles.searchSection, { borderBottomColor: colors.border }]}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
          placeholder="🔍 Поиск в базе знаний..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Categories strip */}
      {categories.length > 0 && (
        <View style={[styles.categoriesStrip, { borderBottomColor: colors.border }]}>
          <FlatList
            horizontal
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={renderCategoryChip}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
            ListHeaderComponent={
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: activeCategory === null ? colors.accentLight : colors.bgTertiary,
                    borderColor: activeCategory === null ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => setActiveCategory(null)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: activeCategory === null ? colors.accent : colors.textSecondary },
                  ]}
                >
                  Все
                </Text>
              </TouchableOpacity>
            }
          />
        </View>
      )}

      {/* Pages list */}
      <FlatList
        data={filteredPages}
        keyExtractor={(item) => item.id}
        renderItem={renderPageItem}
        contentContainerStyle={styles.pagesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? 'Ничего не найдено' : 'Нет страниц в базе знаний'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchSection: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  searchInput: {
    padding: 10,
    fontSize: 13,
    borderRadius: 8,
  },
  categoriesStrip: {
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  categoriesList: { paddingHorizontal: 12, gap: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryChipText: { fontSize: 13, fontWeight: '600' },
  pagesList: { padding: 12, gap: 10 },
  pageCard: { padding: 14, borderWidth: 1, borderRadius: 8, gap: 6 },
  pageTitle: { fontSize: 15, fontWeight: '700' },
  pageExcerpt: { fontSize: 13, lineHeight: 18 },
  pageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  pageCategory: { fontSize: 11, fontWeight: '600' },
  pageVersion: { fontSize: 11 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, textAlign: 'center' },
});