// Balloo Messenger — Mobile Stories Screen
// Stories feed with rings, progress bar, reactions
// Horizontal scroll for user stories, tap to view full-screen story

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import Avatar from '../components/Avatar';

interface StoriesScreenProps {
  navigation: any;
}

interface StoryUser {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  stories: Array<{
    id: string;
    mediaUrl: string;
    type: 'image' | 'video' | 'text';
    createdAt: number;
    content?: string;
    reactions: Array<{ userId: string; emoji: string }>;
    viewed: boolean;
  }>;
  hasNewStories: boolean;
}

export default function StoriesScreen({ navigation }: StoriesScreenProps) {
  const theme = useUIStore((s) => s.theme);
  const colors = getThemeColors(theme);
  const currentUserId = useAuthStore((s) => s.user?.id || 'current-user');
  const [users, setUsers] = useState<StoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingStory, setViewingStory] = useState<{ user: StoryUser; storyIndex: number } | null>(null);
  const [viewingProgress, setViewingProgress] = useState(0);
  const progressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadStories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getStoriesFeed();
      setUsers(data);
    } catch {
      // Сервер недоступен
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  const handleViewStory = useCallback((user: StoryUser, storyIndex: number) => {
    setViewingStory({ user, storyIndex });
    setViewingProgress(0);
  }, []);

  useEffect(() => {
    if (viewingStory) {
      const storyDuration = 5000; // 5 seconds per story
      const interval = 50; // update every 50ms
      const steps = storyDuration / interval;
      let currentStep = 0;

      progressTimer.current = setInterval(() => {
        currentStep++;
        setViewingProgress((currentStep / steps) * 100);

        if (currentStep >= steps) {
          // Move to next story or close
          const nextIndex = viewingStory.storyIndex + 1;
          if (nextIndex < viewingStory.user.stories.length) {
            handleViewStory(viewingStory.user, nextIndex);
            api.markStoryViewed(viewingStory.user.stories[viewingStory.storyIndex].id);
          } else {
            // Close viewer
            setViewingStory(null);
            setViewingProgress(0);
          }
        }
      }, interval);

      return () => {
        if (progressTimer.current) clearInterval(progressTimer.current);
      };
    }
  }, [viewingStory, handleViewStory]);

  const handleReaction = useCallback((storyId: string, emoji: string) => {
    api.addStoryReaction(storyId, emoji);
  }, []);

  const handleCreateStory = () => {
    navigation.navigate('StoryCreate');
  };

  const renderStoryUser = ({ item: user }: { item: StoryUser }) => {
    const hasUnviewed = user.stories.some((s) => !s.viewed);
    const hasStories = user.stories.length > 0;

    return (
      <TouchableOpacity
        style={styles.storyUserContainer}
        onPress={() => hasStories && handleViewStory(user, 0)}
      >
        <View style={[styles.avatarWrapper, hasUnviewed && styles.unviewedRing]}>
          <Avatar name={user.displayName} size="lg" status={user.stories[0]?.type === 'text' ? 'online' : undefined} bordered />
          {user.id === currentUserId && (
            <View style={[styles.createBadge, { backgroundColor: colors.accent }]}>
              <Text style={styles.createBadgeText}>+</Text>
            </View>
          )}
        </View>
        <Text style={[styles.storyUserName, { color: colors.textPrimary }]} numberOfLines={1}>
          {user.id === currentUserId ? 'Ваша история' : user.displayName.split(' ')[0]}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderStoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.storyItem}
      onPress={() => {
        if (item.type === 'image' || item.type === 'video') {
          navigation.navigate('MediaViewer', { mediaUrl: item.mediaUrl, type: item.type });
        }
      }}
    >
      <View style={[styles.storyIcon, { backgroundColor: colors.bgTertiary }]}>
        <Text style={styles.storyIconText}>
          {item.type === 'image' ? '🖼' : item.type === 'video' ? '🎥' : '📝'}
        </Text>
      </View>
      {item.viewed && (
        <View style={[styles.viewedBadge, { backgroundColor: colors.textTertiary }]}>
          <Text style={styles.viewedBadgeText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Истории</Text>
        <TouchableOpacity onPress={handleCreateStory}>
          <Text style={[styles.createBtn, { color: colors.accent }]}>+ Создать</Text>
        </TouchableOpacity>
      </View>

      {/* Stories users horizontal scroll */}
      <FlatList
        horizontal
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderStoryUser}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📸</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Нет историй</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Истории ваших контактов появятся здесь
            </Text>
          </View>
        }
      />

      {/* Per-user stories grid */}
      <View style={styles.storiesGrid}>
        {users.map((user) =>
          user.stories.length > 0 ? (
            <View key={user.id} style={styles.userStoriesSection}>
              <View style={styles.userStoriesHeader}>
                <Avatar name={user.displayName} size="sm" bordered />
                <Text style={[styles.userStoriesName, { color: colors.textPrimary }]}>{user.displayName}</Text>
              </View>
              <FlatList
                horizontal
                data={user.stories}
                keyExtractor={(item) => item.id}
                renderItem={renderStoryItem}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storiesRow}
              />
            </View>
          ) : null
        )}
      </View>

      {/* Full-screen story viewer modal */}
      {viewingStory && (
        <Modal
          visible={!!viewingStory}
          transparent
          animationType="fade"
          onRequestClose={() => setViewingStory(null)}
        >
          <View style={styles.fullScreenContainer}>
            {/* Progress bar */}
            <View style={styles.progressBarContainer}>
              {viewingStory.user.stories.map((_, idx) => (
                <View key={idx} style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: idx < viewingStory.storyIndex
                          ? '100%'
                          : idx === viewingStory.storyIndex
                          ? `${viewingProgress}%`
                          : '0%',
                        backgroundColor: colors.accent,
                      },
                    ]}
                  />
                </View>
              ))}
            </View>

            {/* User info */}
            <View style={styles.fullScreenHeader}>
              <Avatar name={viewingStory.user.displayName} size="xs" bordered />
              <View style={styles.fullScreenUserInfo}>
                <Text style={[styles.fullScreenUserName, { color: colors.textPrimary }]}>
                  {viewingStory.user.displayName}
                </Text>
                <Text style={[styles.fullScreenTime, { color: colors.textSecondary }]}>
                  {new Date(viewingStory.user.stories[viewingStory.storyIndex].createdAt * 1000).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setViewingStory(null)}>
                <Text style={[styles.closeBtn, { color: colors.textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Story content */}
            <TouchableOpacity
              style={styles.fullScreenContent}
              activeOpacity={1}
              onPress={() => {
                // Move to next story
                if (progressTimer.current) clearInterval(progressTimer.current);
                const nextIndex = viewingStory.storyIndex + 1;
                if (nextIndex < viewingStory.user.stories.length) {
                  handleViewStory(viewingStory.user, nextIndex);
                } else {
                  setViewingStory(null);
                }
              }}
            >
              <Text style={styles.fullScreenStoryText}>
                {viewingStory.user.stories[viewingStory.storyIndex].type === 'text'
                  ? viewingStory.user.stories[viewingStory.storyIndex].content || 'История'
                  : '🖼 Изображение'}
              </Text>
            </TouchableOpacity>

            {/* Reactions bar */}
            <View style={styles.reactionsBar}>
              {['❤️', '👍', '😂', '🔥'].map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.reactionBtn}
                  onPress={() => {
                    const story = viewingStory.user.stories[viewingStory.storyIndex];
                    if (story) handleReaction(story.id, emoji);
                  }}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  createBtn: { fontSize: 14, fontWeight: '600' },
  storiesList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  storyUserContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  unviewedRing: {
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#2db84d',
    padding: 2,
  },
  createBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  storyUserName: { fontSize: 11, marginTop: 4, maxWidth: 64, textAlign: 'center' },
  storiesGrid: {
    paddingHorizontal: 12,
  },
  userStoriesSection: {
    marginBottom: 16,
  },
  userStoriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  userStoriesName: { fontSize: 14, fontWeight: '600' },
  storiesRow: {
    gap: 8,
  },
  storyItem: {
    width: 60,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  storyIcon: {
    width: 60,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyIconText: { fontSize: 24 },
  viewedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewedBadgeText: { fontSize: 8, color: '#fff' },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 260 },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  progressBarContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 3,
  },
  progressBarBg: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 1,
  },
  fullScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  fullScreenUserInfo: { flex: 1 },
  fullScreenUserName: { fontSize: 14, fontWeight: '600' },
  fullScreenTime: { fontSize: 11 },
  closeBtn: { fontSize: 20, fontWeight: '700', padding: 4 },
  fullScreenContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fullScreenStoryText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  reactionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  reactionBtn: {
    padding: 8,
  },
  reactionEmoji: { fontSize: 28 },
});
