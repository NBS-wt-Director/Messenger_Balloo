// ArchiveScreen — archived chats
// Mockup: mobile/archive.html (1_08_21)
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';

interface ArchChat { id: string; name: string; lastMsg: string; time: number }

export default function ArchiveScreen({ navigation }: any) {
  const colors = getThemeColors(useUIStore(s => s.theme));
  const [chats, setChats] = useState<ArchChat[]>([]);
  useEffect(() => {}, []);
  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bg }]}>
      <Text style={[s.title, { color: colors.text }]}>📁 Архив чатов</Text>
      <FlatList data={chats} keyExtractor={(i) => i.id} ListEmptyComponent={<Text style={[s.empty, { color: colors.muted }]}>Архив пуст</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={[s.row, { borderBottomColor: colors.border }]} onPress={() => navigation?.navigate?.('ChatView', { chatId: item.id })}>
            <View style={{ flex: 1 }}><Text style={{ color: colors.text, fontWeight: '600' }}>{item.name}</Text><Text style={{ color: colors.muted, fontSize: 12 }} numberOfLines={1}>{item.lastMsg}</Text></View>
          </TouchableOpacity>
        )} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({ container: { flex: 1 }, title: { fontSize: 20, fontWeight: '700', padding: 16 }, row: { padding: 14, borderBottomWidth: 1 }, empty: { textAlign: 'center', marginTop: 48 } });
