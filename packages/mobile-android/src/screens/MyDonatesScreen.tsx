// MyDonatesScreen — user donation history
// Mockup: mobile/my-donates.html (1_08_20)
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';
import { api } from '../services/api';

interface Donation { id: string; amount: number; date: number; status: string }

const statusLabel = (status: string): { text: string; color: string } => {
  if (status === 'paid') return { text: '✅ Оплачен', color: '#2db84d' };
  if (status === 'rejected' || status === 'failed' || status === 'refunded') return { text: '❌ Отклонён', color: '#e53e3e' };
  return { text: '⏳ Ожидает', color: '#e5a53e' };
};

export default function MyDonatesScreen() {
  const colors = getThemeColors(useUIStore(s => s.theme));
  const [items, setItems] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // GET /api/payments/me/donations — { donations: [...], total, page, limit }
  // (packages/server/src/services/paymentService.ts:473)
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getMyDonations();
      const list: Donation[] = (res?.donations ?? []).map((d: any) => ({
        id: d.id,
        amount: Number(d.amount) || 0,
        date: Number(d.createdAt) || 0,
        status: d.status ?? '',
      }));
      setItems(list);
    } catch (e: any) {
      setError(e?.message || 'Не удалось загрузить донаты');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bgPrimary }]}>
      <Text style={[s.title, { color: colors.textPrimary }]}>💰 Мои донаты</Text>
      {loading ? <ActivityIndicator color={colors.accent} style={{ marginTop: 48 }} /> : error ? (
        <View style={{ alignItems: 'center', marginTop: 48, gap: 12 }}>
          <Text style={{ color: '#e53e3e' }}>{error}</Text>
          <TouchableOpacity onPress={load}><Text style={{ color: colors.accent, fontWeight: '600' }}>Повторить</Text></TouchableOpacity>
        </View>
      ) : (
      <FlatList data={items} keyExtractor={(i) => i.id} ListEmptyComponent={<Text style={[s.empty, { color: colors.textSecondary }]}>Вы ещё не делали донатов</Text>}
        renderItem={({ item }) => {
          const st = statusLabel(item.status);
          return (
          <View style={[s.row, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}><Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{item.amount} ₽</Text><Text style={{ color: colors.textSecondary, fontSize: 12 }}>{new Date(item.date * 1000).toLocaleDateString('ru')}</Text></View>
            <Text style={{ fontSize: 12, color: st.color }}>{st.text}</Text>
          </View>
          );
        }} />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({ container: { flex: 1 }, title: { fontSize: 20, fontWeight: '700', padding: 16 }, row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1 }, empty: { textAlign: 'center', marginTop: 48 } });
