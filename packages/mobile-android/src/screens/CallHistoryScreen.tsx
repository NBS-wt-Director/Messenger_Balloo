// CallHistoryScreen — mobile call history list
// Mockup: mobile/call-history.html (1_08_14)
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';
import { api } from '../services/api';

interface Call { id: string; type: 'incoming'|'outgoing'|'missed'; peerName: string; timestamp: number; duration?: number; video?: boolean }

export default function CallHistoryScreen() {
  const colors = getThemeColors(useUIStore(s => s.theme));
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // GET /api/calls — сервер отвечает { calls: [...], pagination }
  // (packages/server/src/services/callService.ts:64)
  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getCallHistory();
      const list: Call[] = (res?.calls ?? []).map((c: any) => ({
        id: c.id,
        type: c.type === 'incoming' || c.type === 'missed' ? c.type : 'outgoing',
        peerName: c.contactName ?? 'Неизвестный',
        timestamp: Number(c.timestamp) || 0,
        duration: c.duration ? Number(c.duration) : undefined,
      }));
      setCalls(list);
    } catch (e: any) {
      setError(e?.message || 'Не удалось загрузить историю звонков');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const icon = (c: Call) => `${c.video ? '📹' : '📞'} ${c.type === 'missed' ? '❗' : c.type === 'incoming' ? '⬇️' : '⬆️'}`;
  const fmt = (ts: number) => new Date(ts * 1000).toLocaleDateString('ru');

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bgPrimary }]}>
      <Text style={[s.title, { color: colors.textPrimary }]}>📞 История звонков</Text>
      {loading ? <ActivityIndicator color={colors.accent} /> : error ? (
        <View style={{ alignItems: 'center', marginTop: 48, gap: 12 }}>
          <Text style={{ color: '#e53e3e' }}>{error}</Text>
          <TouchableOpacity onPress={load}><Text style={{ color: colors.accent, fontWeight: '600' }}>Повторить</Text></TouchableOpacity>
        </View>
      ) : (
        <FlatList data={calls} keyExtractor={(i) => i.id} ListEmptyComponent={<Text style={[s.empty, { color: colors.textSecondary }]}>Нет звонков</Text>}
          renderItem={({ item }) => (
            <View style={[s.row, { borderBottomColor: colors.border }]}>
              <Text style={{ fontSize: 20 }}>{icon(item)}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{item.peerName}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{fmt(item.timestamp)}{item.duration ? ` · ${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}` : ''}</Text>
              </View>
            </View>
          )} />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({ container: { flex: 1 }, title: { fontSize: 20, fontWeight: '700', padding: 16 }, row: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12, borderBottomWidth: 1 }, empty: { textAlign: 'center', marginTop: 48 } });
