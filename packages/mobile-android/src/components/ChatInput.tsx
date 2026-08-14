// Balloo Messenger — Mobile Chat Input Component
// Text input with attachments, emoji, voice, send button

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';

interface ChatInputProps {
  onSend: (text: string) => void;
  onAttach: () => void;
  onEmoji: () => void;
  onPoll: () => void;
  onVoice: () => void;
  placeholder?: string;
  replyTo?: { author: string; text: string } | null;
  onCancelReply?: () => void;
}

export default function ChatInput({
  onSend,
  onAttach,
  onEmoji,
  onPoll,
  onVoice,
  placeholder = 'Сообщение...',
  replyTo,
  onCancelReply,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const theme = useUIStore((s) => s.theme);
  const colors = getThemeColors(theme);

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText('');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Reply preview */}
      {replyTo && (
        <View style={[styles.replyPanel, { backgroundColor: colors.bgGlass, borderTopColor: colors.border }]}>
          <TouchableOpacity onPress={onCancelReply}>
            <Text style={[styles.replyCancel, { color: colors.textTertiary }]}>✕</Text>
          </TouchableOpacity>
          <View style={styles.replyContent}>
            <Text style={[styles.replyAuthor, { color: colors.accent }]}>
              {replyTo.author}
            </Text>
            <Text style={[styles.replyText, { color: colors.textTertiary }]} numberOfLines={1}>
              {replyTo.text}
            </Text>
          </View>
        </View>
      )}

      {/* Input area */}
      <View style={[styles.inputArea, { backgroundColor: colors.bgSecondary, borderTopColor: colors.border }]}>
        <TouchableOpacity onPress={onAttach} style={styles.inputBtn}>
          <Text style={[styles.inputBtnText, { color: colors.textSecondary }]}>📎</Text>
        </TouchableOpacity>

        <TextInput
          style={[
            styles.inputField,
            {
              backgroundColor: colors.bgTertiary,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={4000}
        />

        <TouchableOpacity onPress={onEmoji} style={styles.inputBtn}>
          <Text style={[styles.inputBtnText, { color: colors.textSecondary }]}>😊</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onPoll} style={styles.inputBtn}>
          <Text style={[styles.inputBtnText, { color: colors.textSecondary }]}>📊</Text>
        </TouchableOpacity>

        {text.trim() ? (
          <TouchableOpacity onPress={handleSend} style={styles.inputBtn}>
            <Text style={[styles.inputBtnText, { color: colors.accent, fontSize: 18 }]}>➤</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onVoice} style={styles.inputBtn}>
            <Text style={[styles.inputBtnText, { color: colors.textSecondary }]}>🎤</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  replyPanel: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 8,
    borderTopWidth: 1,
    gap: 6,
  },
  replyCancel: {
    fontSize: 14,
    padding: 2,
  },
  replyContent: {
    flex: 1,
  },
  replyAuthor: {
    fontSize: 11,
    fontWeight: '600',
  },
  replyText: {
    fontSize: 11,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    gap: 4,
  },
  inputBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBtnText: {
    fontSize: 16,
  },
  inputField: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    borderWidth: 1,
    borderRadius: 16,
    maxHeight: 80,
    lineHeight: 18,
  },
});