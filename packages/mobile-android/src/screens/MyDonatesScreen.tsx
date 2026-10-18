// MyDonatesScreen — user donation history
// Mockup: mobile/my-donates.html (1_08_20)
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';

interface Donation { id: string; amount: number; date: number; status: string }

export default function MyDonatesScreen() {
  const colors = getThemeColors(useUIStore(s => s.theme));
  const [items, setItems] = useState<Donation[]>([]);
  useEffect(() => {}, []);
  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bg }]}>
      <Text style={[s.title, { color: colors.text }]}>💰 Мои донаты</Text>
      <FlatList data={items} keyExtractor={(i) => i.id} ListEmptyComponent={<Text style={[s.empty, { color: colors.muted }]}>Вы ещё не делали донатов</Text>}
        renderItem={({ item }) => (
          <View style={[s.row, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}><Text style={{ color: colors.text, fontWeight: '600' }}>{item.amount} ₽</Text><Text style={{ color: colors.muted, fontSize: 12 }}>{new Date(item.date * 1000).toLocaleDateString('ru')}</Text></View>
            <Text style={{ fontSize: 12, color: item.status === 'paid' ? '#2db84d' : '#e53e3e' }}>{item.status === 'paid' ? '✅ Оплачен' : '⏳ Ожидает'}</Text>
          </View>
        )} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({ container: { flex: 1 }, title: { fontSize: 20, fontWeight: '700', padding: 16 }, row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1 }, empty: { textAlign: 'center', marginTop: 48 } });
