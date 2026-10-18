// EmptyChatScreen — empty state for new/empty chat
// Mockup: mobile/empty-chat.html (1_08_24)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';

export default function EmptyChatScreen() {
  const colors = getThemeColors(useUIStore(s => s.theme));
  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bg }]}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontSize: 64, marginBottom: 16 }}>💬</Text>
        <Text style={[s.title, { color: colors.text }]}>Начните переписку</Text>
        <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 8 }}>Отправьте первое сообщение, чтобы начать чат</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({ container: { flex: 1 }, title: { fontSize: 18, fontWeight: '700' } });
