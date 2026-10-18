// DonateScreen — support Balloo via donation
// Mockup: mobile/donate.html (1_08_17)
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';

const tiers = [
  { amount: 50, label: '50 ₽', color: '#40916c' },
  { amount: 150, label: '150 ₽', color: '#2db84d' },
  { amount: 500, label: '500 ₽', color: '#1565c0' },
  { amount: 1000, label: '1000 ₽', color: '#7c3aed' },
];

export default function DonateScreen() {
  const colors = getThemeColors(useUIStore(s => s.theme));
  const [selected, setSelected] = useState(500);
  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={[s.title, { color: colors.text }]}>💚 Поддержать Balloo</Text>
        <Text style={{ color: colors.muted, textAlign: 'center', marginBottom: 24 }}>Ваш вклад помогает развивать мессенджер</Text>
        <View style={s.tiers}>
          {tiers.map((t) => (
            <TouchableOpacity key={t.amount} style={[s.tier, { borderColor: colors.border, backgroundColor: selected === t.amount ? t.color + '33' : 'transparent' }]} onPress={() => setSelected(t.amount)}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: selected === t.amount ? t.color : colors.text }}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[s.btn, { backgroundColor: colors.accent }]}>
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Оплатить {selected} ₽</Text>
        </TouchableOpacity>
        <Text style={{ color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 12 }}>ЮKassa · Безопасная оплата</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({ container: { flex: 1 }, scroll: { padding: 16 }, title: { fontSize: 20, fontWeight: '700', textAlign: 'center' }, tiers: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, tier: { flex: '0 0 45%', padding: 20, borderRadius: 12, borderWidth: 2, alignItems: 'center' }, btn: { marginTop: 24, padding: 16, alignItems: 'center', borderRadius: 8 } });
