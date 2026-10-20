// ArchiveScreen — archived chats
// Mockup: mobile/archive.html (1_08_21)
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';
import { api } from '../services/api';

interface ArchChat { id: string; name: string; lastMsg: string; time: number; unread: number }

export default function ArchiveScreen({ navigation }: any) {
  const colors = getThemeColors(useUIStore(s => s.theme));
  const [chats, setChats] = useState<ArchChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // GET /api/archive — сервер отвечает { chats: [...] }
  // (packages/server/src/services/archiveService.ts:39)
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getArchived();
      const list: ArchChat[] = (res?.chats ?? []).map((c: any) => ({
        id: c.id,
        name: c.name ?? 'Без названия',
        lastMsg: c.lastMessage ?? '',
        time: Number(c.lastMessageTime) || 0,
        unread: Number(c.unreadCount) || 0,
      }));
      setChats(list);
    } catch (e: any) {
      setError(e?.message || 'Не удалось загрузить архив');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bgPrimary }]}>
      <Text style={[s.title, { color: colors.textPrimary }]}>📁 Архив чатов</Text>
      {loading ? <ActivityIndicator color={colors.accent} style={{ marginTop: 48 }} /> : error ? (
        <View style={{ alignItems: 'center', marginTop: 48, gap: 12 }}>
          <Text style={{ color: '#e53e3e' }}>{error}</Text>
          <TouchableOpacity onPress={load}><Text style={{ color: colors.accent, fontWeight: '600' }}>Повторить</Text></TouchableOpacity>
        </View>
      ) : (
      <FlatList data={chats} keyExtractor={(i) => i.id} ListEmptyComponent={<Text style={[s.empty, { color: colors.textSecondary }]}>Архив пуст</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={[s.row, { borderBottomColor: colors.border }]} onPress={() => navigation?.navigate?.('ChatView', { chatId: item.id })}>
            <View style={{ flex: 1 }}><Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{item.name}</Text><Text style={{ color: colors.textSecondary, fontSize: 12 }} numberOfLines={1}>{item.lastMsg}</Text></View>
            {item.unread > 0 && <Text style={{ color: colors.accent, fontSize: 12 }}>{item.unread}</Text>}
          </TouchableOpacity>
        )} />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({ container: { flex: 1 }, title: { fontSize: 20, fontWeight: '700', padding: 16 }, row: { padding: 14, borderBottomWidth: 1 }, empty: { textAlign: 'center', marginTop: 48 } });
