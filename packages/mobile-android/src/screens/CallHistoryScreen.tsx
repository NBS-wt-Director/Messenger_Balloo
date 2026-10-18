// CallHistoryScreen — mobile call history list
// Mockup: mobile/call-history.html (1_08_14)
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';

interface Call { id: string; type: 'incoming'|'outgoing'|'missed'; peerName: string; timestamp: number; duration?: number; video?: boolean }

export default function CallHistoryScreen() {
  const colors = getThemeColors(useUIStore(s => s.theme));
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(false); }, []);

  const icon = (c: Call) => `${c.video ? '📹' : '📞'} ${c.type === 'missed' ? '❗' : c.type === 'incoming' ? '⬇️' : '⬆️'}`;
  const fmt = (ts: number) => new Date(ts * 1000).toLocaleDateString('ru');

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bg }]}>
      <Text style={[s.title, { color: colors.text }]}>📞 История звонков</Text>
      {loading ? <ActivityIndicator color={colors.accent} /> : (
        <FlatList data={calls} keyExtractor={(i) => i.id} ListEmptyComponent={<Text style={[s.empty, { color: colors.muted }]}>Нет звонков</Text>}
          renderItem={({ item }) => (
            <View style={[s.row, { borderBottomColor: colors.border }]}>
              <Text style={{ fontSize: 20 }}>{icon(item)}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{item.peerName}</Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>{fmt(item.timestamp)}{item.duration ? ` · ${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}` : ''}</Text>
              </View>
            </View>
          )} />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({ container: { flex: 1 }, title: { fontSize: 20, fontWeight: '700', padding: 16 }, row: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12, borderBottomWidth: 1 }, empty: { textAlign: 'center', marginTop: 48 } });
