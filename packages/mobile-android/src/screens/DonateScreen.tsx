// DonateScreen — support Balloo via donation
// Mockup: mobile/donate.html (1_08_17)
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';
import { api } from '../services/api';

const tiers = [
  { amount: 50, label: '50 ₽', color: '#40916c' },
  { amount: 150, label: '150 ₽', color: '#2db84d' },
  { amount: 500, label: '500 ₽', color: '#1565c0' },
  { amount: 1000, label: '1000 ₽', color: '#7c3aed' },
];

// Ответ POST /api/payments/donate (packages/server/src/services/paymentService.ts:138)
interface DonationResult {
  donationId?: string;
  mode?: 'anonymous' | 'yookassa';
  paymentUrl?: string;
  sbpInfo?: { qrUrl?: string; phoneNumber?: string; phoneName?: string };
  message?: string;
}

export default function DonateScreen() {
  const colors = getThemeColors(useUIStore(s => s.theme));
  const [selected, setSelected] = useState(500);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DonationResult | null>(null);

  const handlePay = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const res: DonationResult = await api.createDonation({ amount: selected });
      setResult(res);
      // ЮKassa: сервер вернул redirect-ссылку на платёжную страницу
      if (res?.mode === 'yookassa' && res.paymentUrl) {
        Linking.openURL(res.paymentUrl).catch(() => setError('Не удалось открыть страницу оплаты'));
      }
    } catch (e: any) {
      setError(e?.message || 'Не удалось создать платёж');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bgPrimary }]}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={[s.title, { color: colors.textPrimary }]}>💚 Поддержать Balloo</Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 24 }}>Ваш вклад помогает развивать мессенджер</Text>
        <View style={s.tiers}>
          {tiers.map((t) => (
            <TouchableOpacity key={t.amount} style={[s.tier, { borderColor: colors.border, backgroundColor: selected === t.amount ? t.color + '33' : 'transparent' }]} onPress={() => setSelected(t.amount)}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: selected === t.amount ? t.color : colors.textPrimary }}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[s.btn, { backgroundColor: colors.accent, opacity: loading ? 0.6 : 1 }]} onPress={handlePay} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Оплатить {selected} ₽</Text>}
        </TouchableOpacity>
        {error && <Text style={{ color: '#e53e3e', fontSize: 12, textAlign: 'center', marginTop: 12 }}>{error}</Text>}
        {result && (
          <View style={[s.result, { borderColor: colors.border, backgroundColor: colors.bgSecondary }]}>
            <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{result.mode === 'yookassa' ? 'Переход к оплате' : 'Реквизиты для перевода'}</Text>
            {!!result.message && <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6 }}>{result.message}</Text>}
            {!!result.sbpInfo?.phoneNumber && (
              <Text style={{ color: colors.textPrimary, fontSize: 13, marginTop: 6 }}>{result.sbpInfo.phoneName}: {result.sbpInfo.phoneNumber}</Text>
            )}
            {!!result.paymentUrl && (
              <TouchableOpacity onPress={() => Linking.openURL(result.paymentUrl!)}>
                <Text style={{ color: colors.accent, fontSize: 13, marginTop: 6 }}>Открыть страницу оплаты</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 12 }}>ЮKassa · Безопасная оплата</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({ container: { flex: 1 }, scroll: { padding: 16 }, title: { fontSize: 20, fontWeight: '700', textAlign: 'center' }, tiers: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },   tier: { width: '45%', padding: 20, borderRadius: 12, borderWidth: 2, alignItems: 'center' }, btn: { marginTop: 24, padding: 16, alignItems: 'center', borderRadius: 8 }, result: { marginTop: 16, padding: 14, borderWidth: 1, borderRadius: 10 } });
