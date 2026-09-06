// Balloo Messenger — Mobile Chat View Screen
// Messages, input, chat header, WebSocket integration

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { useChatStore, Message } from '../store/chatStore';
import { api } from '../services/api';
import { wsService } from '../services/ws';
import MessageBubble from '../components/MessageBubble';
import ChatInput from '../components/ChatInput';
import Avatar from '../components/Avatar';

interface ChatViewScreenProps {
  navigation: any;
  route: any;
}

// Маппинг сообщения сервера → модель store
function mapServerMessage(m: any): Message {
  return {
    id: m.id,
    chatId: m.chatId,
    senderId: m.senderId,
    senderName: m.sender?.displayName || m.sender?.username || 'Пользователь',
    senderAvatar: m.sender?.avatarUrl,
    type: m.type || 'text',
    content: m.content || '',
    replyToId: m.replyToId,
    createdAt: Number(m.createdAt) || Math.floor(Date.now() / 1000),
    status: m.status === 'sending' ? 'sending' : 'sent',
    reactions: m.reactions,
    attachments: m.attachments,
  };
}

export default function ChatViewScreen({ navigation, route }: ChatViewScreenProps) {
  const { chatId, chatName } = route.params;
  const theme = useUIStore((s) => s.theme);
  const colors = getThemeColors(theme);
  const { messages, setActiveChat, addMessage, setMessages, updateMessage } = useChatStore();
  const currentUserId = useAuthStore((s) => s.user?.id || 'current-user');
  const flatListRef = useRef<FlatList>(null);
  const [replyTo, setReplyTo] = useState<{ author: string; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const chatMessages = messages[chatId] || [];

  // Загрузка истории сообщений через API
  const loadMessages = useCallback(async () => {
    try {
      const data = await api.getMessages(chatId);
      const list: any[] = Array.isArray(data) ? data : data?.messages || [];
      setMessages(chatId, list.map(mapServerMessage));
    } catch {
      // Сервер недоступен — оставляем кэшированные сообщения
    } finally {
      setLoading(false);
    }
  }, [chatId, setMessages]);

  useEffect(() => {
    setActiveChat(chatId);
    wsService.joinRoom(chatId);
    loadMessages();

    // Listen for new messages
    const unsubscribe = wsService.on('message.new', (payload: any) => {
      if (payload.chatId === chatId) {
        useChatStore.getState().addMessage(chatId, mapServerMessage(payload));
      }
    });

    // Listen for typing
    const unsubscribeTyping = wsService.on('typing.start', (payload: any) => {
      if (payload.chatId === chatId) {
        // Update typing indicator
      }
    });

    return () => {
      unsubscribe();
      unsubscribeTyping();
      wsService.leaveRoom(chatId);
    };
  }, [chatId, setActiveChat, loadMessages]);

  const handleSend = useCallback(
    async (text: string) => {
      const tempId = `temp-${Date.now()}`;
      // Optimistic message
      const message: Message = {
        id: tempId,
        chatId,
        senderId: currentUserId,
        senderName: 'Я',
        type: 'text',
        content: text,
        createdAt: Math.floor(Date.now() / 1000),
        status: 'sending',
        replyToId: undefined,
      };
      addMessage(chatId, message);
      setReplyTo(null);
      setSending(true);

      try {
        // Отправка через REST API (основной канал)
        const sent = await api.sendMessage(chatId, {
          type: 'text',
          content: text,
          replyToId: undefined,
        });
        // Заменяем optimistic-сообщение на подтверждённое сервером
        updateMessage(chatId, tempId, mapServerMessage(sent));
      } catch {
        // Fallback: отправка через WebSocket
        updateMessage(chatId, tempId, { status: 'error' });
        wsService.send('message.send', { chatId, content: text });
      } finally {
        setSending(false);
      }
    },
    [chatId, currentUserId, addMessage, updateMessage]
  );

  const handleAttach = () => {
    Alert.alert('Прикрепить', 'Выберите тип вложения', [
      { text: '🖼 Фото' },
      { text: '🎥 Видео' },
      { text: '📄 Документ' },
      { text: '📎 Файл' },
      { text: 'Отмена', style: 'cancel' },
    ]);
  };

  const handleEmoji = () => {
    Alert.alert('Эмодзи', 'Панель эмодзи');
  };

  const handlePoll = () => {
    Alert.alert('Интерактив', 'Создать опрос/квиз');
  };

  const handleVoice = () => {
    Alert.alert('Голосовое', 'Запись голосового сообщения');
  };

  const handleReply = (message: Message) => {
    setReplyTo({ author: message.senderName, text: message.content });
  };

  const handleReact = (message: Message) => {
    Alert.alert('Реакция', 'Выберите реакцию');
  };

  const handleChatMenu = () => {
    Alert.alert(chatName, 'Действия с чатом', [
      { text: '📎 Вложения чата' },
      { text: '📌 Закрепить чат' },
      { text: '🔇 Заглушить' },
      { text: '📦 В архив' },
      { text: '📤 Экспорт в PDF' },
      { text: '🚫 Заблокировать', style: 'destructive' },
      { text: 'Отмена', style: 'cancel' },
    ]);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble
      message={item}
      isSender={item.senderId === currentUserId}
      onReply={handleReply}
      onReact={handleReact}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Chat header */}
      <View style={[styles.chatHeader, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.headerBtn, { color: colors.accent }]}>←</Text>
        </TouchableOpacity>
        <Avatar
          name={chatName}
          size="xs"
          status="online"
          bordered
        />
        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: colors.textPrimary }]}>{chatName}</Text>
          <Text style={[styles.headerStatus, { color: colors.accent }]}>в сети</Text>
        </View>
        <TouchableOpacity onPress={() => Alert.alert('Звонок', 'Аудиозвонок')}>
          <Text style={[styles.headerBtn, { color: colors.textSecondary }]}>📞</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Alert.alert('Звонок', 'Видеозвонок')}>
          <Text style={[styles.headerBtn, { color: colors.textSecondary }]}>📹</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleChatMenu}>
          <Text style={[styles.headerBtn, { color: colors.textSecondary }]}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={chatMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          inverted={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            loading ? (
              <View style={styles.emptyChat}>
                <ActivityIndicator size="large" color={colors.accent} />
              </View>
            ) : (
              <View style={styles.emptyChat}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Чат пуст</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Начните общение! Отправьте первое сообщение
                </Text>
              </View>
            )
          }
        />

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          onAttach={handleAttach}
          onEmoji={handleEmoji}
          onPoll={handlePoll}
          onVoice={handleVoice}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  chatHeader: {
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
  messagesList: {
    padding: 8,
    flexGrow: 1,
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 260 },
});