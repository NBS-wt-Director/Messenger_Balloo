// MyDevicesScreen — list of user devices
// Mockup: mobile/my-devices.html (1_08_15)
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';
import { api } from '../services/api';

interface Device { id: string; name: string; platform: string; lastActive: number; current: boolean }

export default function MyDevicesScreen({ navigation }: any) {
  const colors = getThemeColors(useUIStore(s => s.theme));
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // GET /api/devices — сервер отвечает { devices: [...] }
  // (packages/server/src/services/deviceService.ts:34)
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMyDevices();
      const list: Device[] = (data?.devices ?? []).map((d: any) => ({
        id: d.id,
        name: d.name ?? 'Без названия',
        platform: d.type ?? d.platform ?? '',
        lastActive: Number(d.lastActive) || 0,
        current: !!d.isCurrent,
      }));
      setDevices(list);
    } catch (e: any) {
      setError(e?.message || 'Не удалось загрузить устройства');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRevoke = (device: Device) => {
    Alert.alert('Отключить устройство?', device.name, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Отключить',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.removeDevice(device.id);
            setDevices((prev) => prev.filter((d) => d.id !== device.id));
          } catch (e: any) {
            Alert.alert('Ошибка', e?.message || 'Не удалось отключить устройство');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bgPrimary }]}>
      <Text style={[s.title, { color: colors.textPrimary }]}>💻 Мои устройства</Text>
      {loading ? <ActivityIndicator color={colors.accent} style={{ marginTop: 32 }} /> : error ? (
        <View style={{ alignItems: 'center', marginTop: 48, gap: 12 }}>
          <Text style={{ color: '#e53e3e' }}>{error}</Text>
          <TouchableOpacity onPress={load}><Text style={{ color: colors.accent, fontWeight: '600' }}>Повторить</Text></TouchableOpacity>
        </View>
      ) : (
      <FlatList data={devices} keyExtractor={(i) => i.id} ListEmptyComponent={<Text style={[s.empty, { color: colors.textSecondary }]}>Нет подключённых устройств</Text>}
        renderItem={({ item }) => (
          <View style={[s.row, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}><Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{item.name}</Text><Text style={{ color: colors.textSecondary, fontSize: 12 }}>{item.platform}{item.current ? ' · Текущее' : ''}</Text></View>
            {!item.current && <TouchableOpacity onPress={() => handleRevoke(item)}><Text style={{ color: '#e53e3e', fontSize: 12 }}>Отключить</Text></TouchableOpacity>}
          </View>
        )} />
      )}
      <TouchableOpacity style={[s.addBtn, { backgroundColor: colors.accent }]} onPress={() => navigation?.navigate?.('AddDevice')}><Text style={{ color: '#fff', fontWeight: '600' }}>+ Добавить устройство</Text></TouchableOpacity>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({ container: { flex: 1 }, title: { fontSize: 20, fontWeight: '700', padding: 16 }, row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1 }, empty: { textAlign: 'center', marginTop: 48 }, addBtn: { margin: 16, padding: 14, alignItems: 'center', borderRadius: 8 } });
