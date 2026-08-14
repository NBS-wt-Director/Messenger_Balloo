// Channel View Screen — просмотр канала
// Макет: mockups/balloo-su/channel-view.html (на основе chats.html для channel type)
// Функция: 0_01_06 — Просмотр каналов

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/services/api';
import { useChatStore, type MessageWithSender } from '@/store/chatStore';

function ChannelViewScreen() {
  const { chatId } = useParams<{ chatId: string }>();
  const messages = useChatStore((s) => s.messages);
  const activeChat = useChatStore((s) => s.activeChat);
  const setActiveChat = useChatStore((s) => s.setActiveChat);
  const setMessages = useChatStore((s) => s.setMessages);
  const [loading, setLoading] = useState(true);
  const [channelInfo, setChannelInfo] = useState<{
    name: string;
    description: string;
    subscribers: number;
    avatarUrl?: string;
  } | null>(null);

  useEffect(() => {
    if (chatId) {
      setActiveChat(chatId);
      fetchChannel();
    }
  }, [chatId]);

  const fetchChannel = async () => {
    try {
      const data = await api.getChannel(chatId!);
      setChannelInfo({
        name: data.name,
        description: data.description || '',
        subscribers: data.subscribers || 0,
        avatarUrl: data.avatarUrl,
      });
      setMessages(chatId!, data.messages || []);
    } catch (err) {
      console.error('Failed to fetch channel:', err);
    } finally {
      setLoading(false);
    }
  };

  const channelMessages = chatId ? messages[chatId] || [] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="channel-view">
      {/* Channel Header */}
      <div className="channel-header card mb-4">
        <div className="flex items-center gap-4">
          {activeChat?.avatarUrl ? (
            <img
              src={activeChat.avatarUrl}
              alt=""
              className="w-16 h-16"
              style={{
                clipPath: 'var(--octagon-clip)',
                border: '2px solid var(--accent)',
              }}
            />
          ) : (
            <div
              className="w-16 h-16 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #ffd700, #ffaa00)',
                clipPath: 'var(--octagon-clip)',
                fontSize: '28px',
                border: '2px solid var(--accent)',
              }}
            >
              📢
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold">
              {activeChat?.name || channelInfo?.name || 'Канал'}
            </h1>
            <p className="text-sm text-muted">
              {channelInfo?.description || 'Канал Balloo'}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-secondary">
                👥 {channelInfo?.subscribers || '—'} подписчиков
              </span>
              {activeChat?.muted && (
                <span className="chip chip--outline">🔇 Уведомления отключены</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="channel-messages">
        {channelMessages.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <div
              className="w-20 h-20 mx-auto mb-4 flex items-center justify-center"
              style={{
                background: 'var(--surface)',
                clipPath: 'var(--octagon-clip)',
                fontSize: '36px',
              }}
            >
              📢
            </div>
            <p className="text-lg mb-2">Канал пока пуст</p>
            <p className="text-sm">
              Когда администратор опубликует первый пост, он появится здесь
            </p>
          </div>
        ) : (
          channelMessages.map((msg) => (
            <div
              key={msg.id}
              className={`message-bubble message-bubble--channel ${msg.deleted ? 'message-bubble--deleted' : ''}`}
            >
              {msg.deleted ? (
                <p className="text-muted text-sm">[Сообщение удалено]</p>
              ) : (
                <>
                  {/* Sender info for channel */}
                  <div className="message-bubble__header">
                    {msg.sender && (
                      <span className="message-bubble__sender">
                        {msg.sender.displayName || msg.sender.username}
                      </span>
                    )}
                    <span className="message-bubble__time">
                      {new Date(msg.createdAt * 1000).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="message-bubble__content">
                    <p className="message-bubble__text">{msg.content}</p>
                  </div>

                  {/* Attachment */}
                  {msg.attachment && (
                    <div className="message-attachment">
                      {msg.attachment.thumbnail ? (
                        <img
                          src={msg.attachment.thumbnail}
                          alt={msg.attachment.name || 'Attachment'}
                          className="message-attachment__image"
                        />
                      ) : (
                        <div className="message-attachment__file">
                          <span className="text-sm">{msg.attachment.name || 'Файл'}</span>
                          <span className="text-xs text-muted">
                            {msg.attachment.size
                              ? `${(msg.attachment.size / 1024 / 1024).toFixed(1)} МБ`
                              : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reactions */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="message-reactions">
                      {msg.reactions.map((reaction, i) => (
                        <span
                          key={i}
                          className="chip chip--outline"
                          style={{ marginRight: '4px', fontSize: '12px' }}
                        >
                          {reaction.emoji} {msg.reactions!.filter((r) => r.emoji === reaction.emoji).length}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Bottom bar */}
      <div className="channel-footer card mt-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted">
            {activeChat?.role === 'owner' ? (
              <span>📝 Вы — администратор канала</span>
            ) : (
              <span>Подписчики видят ваши посты в реальном времени</span>
            )}
          </div>
          <div className="flex gap-2">
            {activeChat?.role !== 'owner' && (
              <button className="btn btn--primary btn--sm">
                ✓ Подписаться
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChannelViewScreen;
