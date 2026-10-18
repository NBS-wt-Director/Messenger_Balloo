// AddDeviceScreen — pair new device via QR/code
// Mockup: mobile/add-device.html (1_08_16)
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';

export default function AddDeviceScreen({ navigation }: any) {
  const colors = getThemeColors(useUIStore(s => s.theme));
  const [code, setCode] = useState('');
  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bg }]}>
      <Text style={[s.title, { color: colors.text }]}>📱 Добавить устройство</Text>
      <View style={{ padding: 16 }}>
        <View style={[s.qrBox, { borderColor: colors.border }]}><Text style={{ color: colors.muted, fontSize: 48 }}>📷</Text><Text style={{ color: colors.muted, marginTop: 8 }}>Отсканируйте QR-код</Text></View>
        <Text style={{ color: colors.muted, textAlign: 'center', marginVertical: 16 }}>или введите код вручную</Text>
        <TextInput value={code} onChangeText={setCode} placeholder="XXXX-XXXX" placeholderTextColor={colors.muted} style={[s.input, { backgroundColor: colors.bgSecondary, color: colors.text, borderColor: colors.border }]} />
        <TouchableOpacity style={[s.btn, { backgroundColor: colors.accent }]} onPress={() => { if (code.length < 4) { Alert.alert('Ошибка', 'Введите код'); return; } Alert.alert('Успех', 'Устройство подключено'); navigation?.goBack?.(); }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Подключить</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({ container: { flex: 1 }, title: { fontSize: 20, fontWeight: '700', padding: 16 }, qrBox: { height: 200, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }, input: { padding: 14, borderWidth: 1, borderRadius: 8, fontSize: 18, textAlign: 'center', letterSpacing: 4 }, btn: { marginTop: 16, padding: 14, alignItems: 'center', borderRadius: 8 } });
