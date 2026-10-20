// AddDeviceScreen — pair new device via QR/code
// Mockup: mobile/add-device.html (1_08_16)
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';
import { api } from '../services/api';

export default function AddDeviceScreen({ navigation }: any) {
  const colors = getThemeColors(useUIStore(s => s.theme));
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // POST /api/devices/pair/confirm (packages/server/src/routes/devices.ts:37).
  // Сервер ждёт токен из QR-ссылки balloo://pair/<token> — 48 hex-символов,
  // поэтому ввод нормализуется (пробелы/дефисы/регистр).
  const handleConnect = async () => {
    const token = code.replace(/[\s-]/g, '').toLowerCase();
    if (token.length < 4) { setError('Введите код'); return; }
    try {
      setLoading(true);
      setError(null);
      await api.confirmPair(token, 'android', 'Android');
      Alert.alert('Успех', 'Устройство подключено', [
        { text: 'ОК', onPress: () => navigation?.goBack?.() },
      ]);
    } catch (e: any) {
      setError(e?.message || 'Не удалось подключить устройство');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bgPrimary }]}>
      <Text style={[s.title, { color: colors.textPrimary }]}>📱 Добавить устройство</Text>
      <View style={{ padding: 16 }}>
        <View style={[s.qrBox, { borderColor: colors.border }]}><Text style={{ color: colors.textSecondary, fontSize: 48 }}>📷</Text><Text style={{ color: colors.textSecondary, marginTop: 8 }}>Отсканируйте QR-код</Text></View>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginVertical: 16 }}>или введите код вручную</Text>
        <TextInput value={code} onChangeText={(t) => { setCode(t); setError(null); }} editable={!loading} placeholder="XXXX-XXXX" placeholderTextColor={colors.textSecondary} style={[s.input, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]} />
        {error && <Text style={{ color: '#e53e3e', fontSize: 12, marginTop: 8 }}>{error}</Text>}
        <TouchableOpacity style={[s.btn, { backgroundColor: colors.accent, opacity: loading ? 0.6 : 1 }]} onPress={handleConnect} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Подключить</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({ container: { flex: 1 }, title: { fontSize: 20, fontWeight: '700', padding: 16 }, qrBox: { height: 200, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }, input: { padding: 14, borderWidth: 1, borderRadius: 8, fontSize: 18, textAlign: 'center', letterSpacing: 4 }, btn: { marginTop: 16, padding: 14, alignItems: 'center', borderRadius: 8 } });
