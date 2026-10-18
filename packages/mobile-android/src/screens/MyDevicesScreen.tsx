// MyDevicesScreen — list of user devices
// Mockup: mobile/my-devices.html (1_08_15)
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';

interface Device { id: string; name: string; platform: string; lastActive: number; current: boolean }

export default function MyDevicesScreen({ navigation }: any) {
  const colors = getThemeColors(useUIStore(s => s.theme));
  const [devices, setDevices] = useState<Device[]>([]);
  useEffect(() => {}, []);
  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bg }]}>
      <Text style={[s.title, { color: colors.text }]}>💻 Мои устройства</Text>
      <FlatList data={devices} keyExtractor={(i) => i.id} ListEmptyComponent={<Text style={[s.empty, { color: colors.muted }]}>Нет подключённых устройств</Text>}
        renderItem={({ item }) => (
          <View style={[s.row, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}><Text style={{ color: colors.text, fontWeight: '600' }}>{item.name}</Text><Text style={{ color: colors.muted, fontSize: 12 }}>{item.platform}{item.current ? ' · Текущее' : ''}</Text></View>
            {!item.current && <TouchableOpacity><Text style={{ color: '#e53e3e', fontSize: 12 }}>Отключить</Text></TouchableOpacity>}
          </View>
        )} />
      <TouchableOpacity style={[s.addBtn, { backgroundColor: colors.accent }]} onPress={() => navigation?.navigate?.('AddDevice')}><Text style={{ color: '#fff', fontWeight: '600' }}>+ Добавить устройство</Text></TouchableOpacity>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({ container: { flex: 1 }, title: { fontSize: 20, fontWeight: '700', padding: 16 }, row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1 }, empty: { textAlign: 'center', marginTop: 48 }, addBtn: { margin: 16, padding: 14, alignItems: 'center', borderRadius: 8 } });
