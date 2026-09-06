// Balloo Messenger — Mobile Chat List Screen
// Scrollable list of chats with swipe actions, search, new chat

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';
import { useChatStore, Chat } from '../store/chatStore';
import { api } from '../services/api';
import Avatar from '../components/Avatar';

interface ChatListScreenProps {
  navigation: any;
}

function formatTime(ts: number): string {
  const date = new Date(ts * 1000);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  if (days === 1) return 'Вчера';
  if (days < 7) return `${days}д`;
  return `${date.getDate()}.${date.getMonth() + 1}`;
}

function getStatusColor(status: string | undefined, colors: any): string {
  switch (status) {
    case 'online': return colors.online;
    case 'away': return colors.away;
    case 'busy': return colors.busy;
    default: return colors.offline;
  }
}

export default function ChatListScreen({ navigation }: ChatListScreenProps) {
  const theme = useUIStore((s) => s.theme);
  const colors = getThemeColors(theme);
  const { chats, setChats, setActiveChat, removeChat } = useChatStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Загрузка чатов с сервера
  const fetchChats = useCallback(async () => {
    try {
      const data = await api.getChats();
      const list: any[] = Array.isArray(data) ? data : data?.chats || [];
      const mapped: Chat[] = list.map((c) => ({
        id: c.id,
        type:
          c.type === 'group' || c.type === 'channel' ? c.type : 'direct',
        name: c.name || 'Чат',
        avatarUrl: c.avatarUrl,
        lastMessage: c.lastMessage?.content ?? c.lastMessageContent,
        lastMessageAt: Number(c.lastMessageAt ?? c.lastRead ?? 0) || undefined,
        unreadCount: Number(c.unread ?? c.unreadCount ?? 0),
        isPinned: !!c.pinned,
        isMuted: !!c.muted,
        online: false,
      }));
      setChats(mapped);
    } catch {
      // Сервер недоступен — показываем кэшированные чаты из store
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setChats]);

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [fetchChats])
  );

  const handleChatPress = (chat: Chat) => {
    setActiveChat(chat.id);
    navigation.navigate('ChatView', { chatId: chat.id, chatName: chat.name });
  };

  const handleChatLongPress = (chat: Chat) => {
    Alert.alert(
      chat.name,
      'Выберите действие',
      [
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => removeChat(chat.id),
        },
        { text: 'Закрепить', onPress: () => {} },
        { text: 'Заглушить', onPress: () => {} },
        { text: 'В архив', onPress: () => {} },
        { text: 'Отмена', style: 'cancel' },
      ]
    );
  };

  const handleNewChat = () => {
    Alert.alert('Новый чат', 'Поиск человека...');
  };

  const renderChatItem = ({ item }: { item: Chat }) => (
    <TouchableOpacity
      style={[styles.chatItem, { borderBottomColor: colors.border }]}
      onPress={() => handleChatPress(item)}
      onLongPress={() => handleChatLongPress(item)}
      activeOpacity={0.7}
    >
      <Avatar
        name={item.name}
        avatarUrl={item.avatarUrl}
        size="sm"
        status={item.online ? 'online' : 'offline'}
        bordered
      />
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={[styles.chatName, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.lastMessageAt && item.lastMessageAt > 0 && (
            <Text style={[styles.chatTime, { color: colors.textTertiary }]}>
              {formatTime(item.lastMessageAt!)}
            </Text>
          )}
        </View>
        <View style={styles.chatPreview}>
          <Text style={[styles.chatMsg, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.lastMessage || 'Нет сообщений'}
          </Text>
          {item.unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: item.isMuted ? colors.textTertiary : colors.unread }]}>
              <Text style={styles.unreadText}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Чаты</Text>
        <TouchableOpacity onPress={handleNewChat}>
          <Text style={[styles.headerAction, { color: colors.accent }]}>✏</Text>
        </TouchableOpacity>
      </View>

      {/* Chat list */}
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        contentContainerStyle={chats.length === 0 ? styles.emptyContainer : undefined}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchChats(); }} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Нет чатов</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Начните общение! Нажмите ✏, чтобы создать новый чат
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  headerAction: { fontSize: 20 },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  chatInfo: { flex: 1 },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  chatName: { fontSize: 15, fontWeight: '600', flex: 1 },
  chatTime: { fontSize: 11, marginLeft: 8 },
  chatPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatMsg: { fontSize: 13, flex: 1 },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 260 },
});