// Balloo Messenger — Mobile Blog Screen
// Blog feed with posts, categories, channels

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';
import { api } from '../services/api';
import Avatar from '../components/Avatar';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  channelId?: string;
  channelName?: string;
  createdAt: number;
  views: number;
  status: string;
}

interface BlogChannel {
  id: string;
  name: string;
  description: string;
  avatarUrl?: string;
  postCount: number;
  followers: number;
}

interface BlogScreenProps {
  navigation: any;
}

export default function BlogScreen({ navigation }: BlogScreenProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [channels, setChannels] = useState<BlogChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const theme = useUIStore((s) => s.theme);
  const colors = getThemeColors(theme);

  const fetchData = useCallback(async () => {
    try {
      const [postsData, channelsData] = await Promise.all([
        api.getBlogPosts(),
        api.getBlogChannels(),
      ]);
      setPosts(postsData || []);
      setChannels(channelsData || []);
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

  const handlePostPress = (post: BlogPost) => {
    navigation.navigate('BlogPost', { postId: post.id, postTitle: post.title });
  };

  const handleChannelPress = (channel: BlogChannel) => {
    setActiveChannel(channel.id === activeChannel ? null : channel.id);
  };

  const filteredPosts = activeChannel
    ? posts.filter((p) => p.channelId === activeChannel)
    : posts;

  const formatDate = (ts: number): string => {
    const date = new Date(ts * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Сегодня';
    if (days === 1) return 'Вчера';
    if (days < 7) return `${days}д назад`;
    return date.toLocaleDateString('ru-RU');
  };

  const stripHtml = (html: string): string => {
    return html.replace(/<[^>]*>/g, '').substring(0, 120);
  };

  const renderPostItem = ({ item }: { item: BlogPost }) => (
    <TouchableOpacity
      style={[styles.postCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
      onPress={() => handlePostPress(item)}
      activeOpacity={0.7}
    >
      <Text style={[styles.postTitle, { color: colors.textPrimary }]} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={[styles.postExcerpt, { color: colors.textSecondary }]} numberOfLines={2}>
        {stripHtml(item.content)}
      </Text>
      <View style={styles.postMeta}>
        <View style={styles.postAuthor}>
          <Avatar
            name={item.authorName || 'Автор'}
            avatarUrl={item.authorAvatar}
            size="xs"
          />
          <Text style={[styles.postAuthorName, { color: colors.textTertiary }]} numberOfLines={1}>
            {item.authorName || 'Автор'}
          </Text>
        </View>
        <View style={styles.postStats}>
          <Text style={[styles.postDate, { color: colors.textTertiary }]}>
            {formatDate(item.createdAt)}
          </Text>
          <Text style={[styles.postViews, { color: colors.textTertiary }]}>
            👁 {item.views || 0}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderChannel = ({ item }: { item: BlogChannel }) => (
    <TouchableOpacity
      style={[
        styles.channelChip,
        {
          backgroundColor: activeChannel === item.id ? colors.accentLight : colors.bgTertiary,
          borderColor: activeChannel === item.id ? colors.accent : colors.border,
        },
      ]}
      onPress={() => handleChannelPress(item)}
    >
      <Text
        style={[
          styles.channelChipText,
          { color: activeChannel === item.id ? colors.accent : colors.textSecondary },
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
      {/* Channels strip */}
      {channels.length > 0 && (
        <View style={[styles.channelsStrip, { borderBottomColor: colors.border }]}>
          <FlatList
            horizontal
            data={channels}
            keyExtractor={(item) => item.id}
            renderItem={renderChannel}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.channelsList}
            ListHeaderComponent={
              <TouchableOpacity
                style={[
                  styles.channelChip,
                  {
                    backgroundColor: activeChannel === null ? colors.accentLight : colors.bgTertiary,
                    borderColor: activeChannel === null ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => setActiveChannel(null)}
              >
                <Text
                  style={[
                    styles.channelChipText,
                    { color: activeChannel === null ? colors.accent : colors.textSecondary },
                  ]}
                >
                  Все
                </Text>
              </TouchableOpacity>
            }
          />
        </View>
      )}

      {/* Posts list */}
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderPostItem}
        contentContainerStyle={styles.postsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Нет постов в блоге
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
  channelsStrip: {
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  channelsList: { paddingHorizontal: 12, gap: 8 },
  channelChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  channelChipText: { fontSize: 13, fontWeight: '600' },
  postsList: { padding: 12, gap: 12 },
  postCard: { padding: 14, borderWidth: 1, borderRadius: 8, gap: 8 },
  postTitle: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  postExcerpt: { fontSize: 13, lineHeight: 18 },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  postAuthor: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  postAuthorName: { fontSize: 11 },
  postStats: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  postDate: { fontSize: 11 },
  postViews: { fontSize: 11 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, textAlign: 'center' },
});