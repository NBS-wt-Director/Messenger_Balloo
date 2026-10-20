// EmptyChatScreen — empty state for new/empty chat
// Mockup: mobile/empty-chat.html (1_08_24), задание: mobile/empty-chat.md
// Тикет 1792311347: экран по макету не обращается к API (web EmptyChatState
// читает контакты только в варианте с их списком, здесь его нет) — поэтому здесь
// только состояние и переходы к действиям: файл, голосовое, опрос.
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';

export default function EmptyChatScreen({ navigation, route }: any) {
  const colors = getThemeColors(useUIStore(s => s.theme));
  const chatId: string | undefined = route?.params?.chatId;

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontSize: 64, marginBottom: 16 }}>💬</Text>
        <Text style={[s.title, { color: colors.textPrimary }]}>Чат пуст</Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 8 }}>
          Начните общение! Отправьте первое сообщение или прикрепите файл.
        </Text>

        <View style={s.actions}>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: colors.accent }]}
            onPress={() => navigation?.navigate?.('ChatAttachments', { chatId })}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>📎 Прикрепить файл</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: colors.accent }]}
            onPress={() => navigation?.navigate?.('VoiceRecord', { chatId })}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>🎤 Голосовое сообщение</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.border }]}
            onPress={() => navigation?.navigate?.('PollEditor', { chatId })}
          >
            <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>📊 Опрос / Квиз</Text>
          </TouchableOpacity>
        </View>

        <View style={[s.hint, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 13 }}>Совет:</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
            Удерживайте кнопку микрофона для быстрой записи голосового сообщения
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 18, fontWeight: '700' },
  actions: { width: '100%', gap: 10, marginTop: 24 },
  actionBtn: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center' },
  hint: { width: '100%', padding: 14, borderRadius: 8, borderWidth: 1, marginTop: 24 },
});
