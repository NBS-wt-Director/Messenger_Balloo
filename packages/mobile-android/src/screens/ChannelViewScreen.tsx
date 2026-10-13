// Balloo Messenger — Mobile Channel View Screen
// Channel info, posts list, subscribe/unsubscribe, pinned posts

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { useChatStore, Message } from '../store/chatStore';
import { api } from '../services/api';
import Avatar from '../components/Avatar';
import MessageBubble from '../components/MessageBubble';

interface ChannelViewScreenProps {
  navigation: any;
  route: any;
}

interface ChannelInfo {
  id: string;
  name: string;
  description: string;
  avatarUrl?: string;
  subscriberCount: number;
  isSubscribed: boolean;
  posts: Array<{
    id: string;
    content: string;
    senderName: string;
    senderAvatar?: string;
    createdAt: number;
    isPinned: boolean;
    reactions?: string[];
    attachments?: Array<{ url: string; type: string }>;
  }>;
}

export default function ChannelViewScreen({ navigation, route }: ChannelViewScreenProps) {
  const { channelId, channelName } = route.params;
  const theme = useUIStore((s) => s.theme);
  const colors = getThemeColors(theme);
  const { addChat, updateChat } = useChatStore();
  const currentUserId = useAuthStore((s) => s.user?.id || 'current-user');
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  const loadChannel = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getChannel(channelId);
      setChannel(data);
      // Add to chat list as channel type
      addChat({
        id: channelId,
        type: 'channel',
        name: data.name,
        avatarUrl: data.avatarUrl,
        lastMessage: data.posts[0]?.content || '',
        lastMessageAt: data.posts[0]?.createdAt,
        unreadCount: 0,
        isPinned: data.posts.some((p: any) => p.isPinned),
        isMuted: false,
      });
    } catch {
      // Сервер недоступен — оставляем локальные данные
    } finally {
      setLoading(false);
    }
  }, [channelId, addChat]);

  useEffect(() => {
    loadChannel();
  }, [loadChannel]);

  const handleSubscribe = useCallback(async () => {
    if (!channel || subscribing) return;
    setSubscribing(true);
    try {
      if (channel.isSubscribed) {
        await api.unsubscribeFromChannel(channelId);
        setChannel((prev) =>
          prev
            ? {
                ...prev,
                isSubscribed: false,
                subscriberCount: prev.subscriberCount - 1,
              }
            : null
        );
        Alert.alert('Подписка отменена', `Вы отписались от "${channel.name}"`);
      } else {
        await api.subscribeToChannel(channelId);
        setChannel((prev) =>
          prev
            ? {
                ...prev,
                isSubscribed: true,
                subscriberCount: prev.subscriberCount + 1,
              }
            : null
        );
        Alert.alert('Подписка оформлена', `Вы подписались на "${channel.name}"`);
      }
    } catch {
      Alert.alert('Ошибка', 'Не удалось изменить подписку');
    } finally {
      setSubscribing(false);
    }
  }, [channel, channelId, subscribing]);

  const handleShare = () => {
    Alert.alert('Поделиться', 'Ссылка скопирована');
  };

  const handleMute = () => {
    Alert.alert('Уведомления', 'Уведомления отключены');
  };

  const renderPost = ({ item }: { item: any }) => {
    const bubble: Message = {
      id: item.id,
      chatId: channelId,
      senderId: item.senderId || 'channel',
      senderName: item.senderName,
      senderAvatar: item.senderAvatar,
      type: 'text',
      content: item.content,
      createdAt: item.createdAt,
      status: 'sent',
      reactions: item.reactions,
    };
    return (
      <View style={[styles.postItem, item.isPinned && styles.pinnedPost]}>
        {item.isPinned && (
          <View style={[styles.pinnedBadge, { backgroundColor: colors.accentLight }]}>
            <Text style={[styles.pinnedText, { color: colors.accent }]}>📌 Закреплено</Text>
          </View>
        )}
        <MessageBubble
          message={bubble}
          isSender={item.senderId === currentUserId}
          onReply={() => {}}
          onReact={() => {}}
        />
      </View>
    );
  };

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
      {/* Channel header */}
      <View style={[styles.channelHeader, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.headerBtn, { color: colors.accent }]}>←</Text>
        </TouchableOpacity>
        <Avatar name={channel?.name || channelName} size="xs" bordered />
        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: colors.textPrimary }]}>{channel?.name || channelName}</Text>
          <Text style={[styles.headerStatus, { color: colors.textSecondary }]}>
            {channel?.subscriberCount || 0} подписчиков
          </Text>
        </View>
        <TouchableOpacity onPress={handleMute}>
          <Text style={[styles.headerBtn, { color: colors.textSecondary }]}>🔔</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare}>
          <Text style={[styles.headerBtn, { color: colors.textSecondary }]}>📤</Text>
        </TouchableOpacity>
      </View>

      {/* Description */}
      {channel?.description && (
        <View style={[styles.descriptionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>{channel.description}</Text>
        </View>
      )}

      {/* Subscribe button */}
      <View style={styles.subscribeBar}>
        <TouchableOpacity
          style={[
            styles.subscribeButton,
            {
              backgroundColor: channel?.isSubscribed ? colors.bgTertiary : colors.accent,
            },
          ]}
          onPress={handleSubscribe}
          disabled={subscribing}
        >
          {subscribing ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : (
            <Text style={[styles.subscribeText, { color: channel?.isSubscribed ? colors.textPrimary : colors.textInverse }]}>
              {channel?.isSubscribed ? '✓ Подписан' : 'Подписаться'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Posts list */}
      <FlatList
        data={channel?.posts || []}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.postsList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📢</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Канал пуст</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Сообщения появятся после публикации
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 8,
    borderBottomWidth: 1,
  },
  headerBtn: { fontSize: 18, padding: 4 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 15, fontWeight: '700' },
  headerStatus: { fontSize: 11 },
  descriptionCard: {
    margin: 8,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  descriptionText: { fontSize: 13, lineHeight: 18 },
  subscribeBar: {
    padding: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'transparent',
  },
  subscribeButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeText: { fontSize: 14, fontWeight: '700' },
  postsList: {
    padding: 8,
  },
  postItem: {
    marginBottom: 8,
  },
  pinnedPost: {
    marginBottom: 4,
  },
  pinnedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  pinnedText: { fontSize: 10, fontWeight: '600' },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 260 },
});
