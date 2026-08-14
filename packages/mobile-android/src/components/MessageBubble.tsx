// Balloo Messenger — Mobile Message Bubble Component
// Sender/receiver message bubbles with reactions, replies, attachments

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';
import { Message } from '../store/chatStore';

interface MessageBubbleProps {
  message: Message;
  isSender: boolean;
  onReply?: (message: Message) => void;
  onReact?: (message: Message) => void;
  onCopy?: (message: Message) => void;
  onForward?: (message: Message) => void;
  onReport?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  senderName?: string;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'sending': return '◌';
    case 'sent': return '✓';
    case 'delivered': return '✓✓';
    case 'read': return '✓✓';
    case 'error': return '⚠';
    default: return '';
  }
}

export default function MessageBubble({
  message,
  isSender,
  onReply,
  onReact,
  onCopy,
  onForward,
  onReport,
  onDelete,
  onEdit,
  senderName,
}: MessageBubbleProps) {
  const theme = useUIStore((s) => s.theme);
  const colors = getThemeColors(theme);

  const bubbleBg = isSender ? colors.bubbleSender : colors.bubbleReceiver;
  const bubbleText = isSender ? colors.bubbleSenderText : colors.bubbleReceiverText;

  return (
    <View style={[styles.container, isSender ? styles.senderContainer : styles.receiverContainer]}>
      {/* Reply preview */}
      {message.replyToId && (
        <View style={[styles.replyPreview, { borderLeftColor: colors.accent }]}>
          <Text style={[styles.replyAuthor, { color: colors.accent }]}>
            {senderName || 'Ответ'}
          </Text>
          <Text style={[styles.replyText, { color: colors.textTertiary }]} numberOfLines={1}>
            {message.content}
          </Text>
        </View>
      )}

      {/* Bubble */}
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: bubbleBg,
          },
          isSender ? styles.bubbleSender : styles.bubbleReceiver,
        ]}
      >
        {/* Message type indicators */}
        {message.type === 'image' && (
          <Text style={[styles.mediaIndicator, { color: bubbleText }]}>🖼 Фото</Text>
        )}
        {message.type === 'file' && (
          <Text style={[styles.mediaIndicator, { color: bubbleText }]}>📎 Файл</Text>
        )}
        {message.type === 'voice' && (
          <View style={styles.voiceContainer}>
            <Text style={[styles.voiceIcon, { color: bubbleText }]}>🎤</Text>
            <View style={[styles.voiceBar, { backgroundColor: isSender ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)' }]}>
              {[6, 12, 18, 9, 22, 15, 6, 12, 9, 18, 6].map((h, i) => (
                <View
                  key={i}
                  style={[
                    styles.voiceBarSegment,
                    {
                      height: h,
                      backgroundColor: i >= 4 && i <= 6 ? colors.accent : bubbleText,
                      opacity: 0.6,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.voiceDuration, { color: bubbleText, opacity: 0.7 }]}>0:14</Text>
          </View>
        )}
        {message.type === 'poll' && (
          <View style={[styles.pollContainer, { borderLeftColor: colors.accent }]}>
            <Text style={[styles.pollQuestion, { color: bubbleText }]}>📊 Опрос</Text>
            <Text style={[styles.pollText, { color: bubbleText, opacity: 0.8 }]}>Голосование</Text>
          </View>
        )}

        {/* Message content */}
        <Text style={[styles.messageText, { color: bubbleText }]}>
          {message.content}
        </Text>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <View style={styles.reactions}>
            {message.reactions.map((r, i) => (
              <TouchableOpacity key={i} style={[styles.reaction, { backgroundColor: isSender ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]}>
                <Text style={styles.reactionText}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Actions bar */}
        <View style={styles.actions}>
          {onReply && (
            <TouchableOpacity onPress={() => onReply(message)}>
              <Text style={[styles.actionIcon, { color: bubbleText, opacity: 0.6 }]}>↩</Text>
            </TouchableOpacity>
          )}
          {onCopy && (
            <TouchableOpacity onPress={() => onCopy(message)}>
              <Text style={[styles.actionIcon, { color: bubbleText, opacity: 0.6 }]}>📋</Text>
            </TouchableOpacity>
          )}
          {onReact && (
            <TouchableOpacity onPress={() => onReact(message)}>
              <Text style={[styles.actionIcon, { color: bubbleText, opacity: 0.6 }]}>😊</Text>
            </TouchableOpacity>
          )}
          {onForward && (
            <TouchableOpacity onPress={() => onForward(message)}>
              <Text style={[styles.actionIcon, { color: bubbleText, opacity: 0.6 }]}>📤</Text>
            </TouchableOpacity>
          )}
          {isSender && onEdit && (
            <TouchableOpacity onPress={() => onEdit(message)}>
              <Text style={[styles.actionIcon, { color: bubbleText, opacity: 0.6 }]}>✏</Text>
            </TouchableOpacity>
          )}
          {onReport && (
            <TouchableOpacity onPress={() => onReport(message)}>
              <Text style={[styles.actionIcon, { color: bubbleText, opacity: 0.6 }]}>🚩</Text>
            </TouchableOpacity>
          )}
          {isSender && onDelete && (
            <TouchableOpacity onPress={() => onDelete(message)}>
              <Text style={[styles.actionIcon, { color: colors.danger, opacity: 0.7 }]}>🗑</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status + Time */}
      <View style={[styles.meta, isSender ? styles.senderMeta : styles.receiverMeta]}>
        {isSender && (
          <Text style={[
            styles.status,
            { color: message.status === 'read' ? colors.accent : colors.textTertiary },
          ]}>
            {getStatusIcon(message.status)}
          </Text>
        )}
        <Text style={[styles.time, { color: colors.textTertiary }]}>
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    maxWidth: '80%',
  },
  senderContainer: {
    alignSelf: 'flex-end',
  },
  receiverContainer: {
    alignSelf: 'flex-start',
  },
  replyPreview: {
    padding: 4,
    borderLeftWidth: 2,
    marginBottom: 2,
  },
  replyAuthor: {
    fontSize: 10,
    fontWeight: '600',
  },
  replyText: {
    fontSize: 10,
  },
  bubble: {
    padding: 8,
  },
  bubbleSender: {
    // Sender bubble style
  },
  bubbleReceiver: {
    // Receiver bubble style
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  mediaIndicator: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  voiceIcon: {
    fontSize: 16,
  },
  voiceBar: {
    flex: 1,
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    paddingHorizontal: 4,
  },
  voiceBarSegment: {
    width: 2,
  },
  voiceDuration: {
    fontSize: 10,
  },
  pollContainer: {
    padding: 6,
    borderLeftWidth: 2,
    marginBottom: 4,
  },
  pollQuestion: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  pollText: {
    fontSize: 11,
  },
  reactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    marginTop: 4,
  },
  reaction: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  reactionText: {
    fontSize: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    opacity: 0.8,
  },
  actionIcon: {
    fontSize: 12,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  senderMeta: {
    justifyContent: 'flex-end',
  },
  receiverMeta: {
    justifyContent: 'flex-start',
  },
  status: {
    fontSize: 10,
  },
  time: {
    fontSize: 10,
  },
});