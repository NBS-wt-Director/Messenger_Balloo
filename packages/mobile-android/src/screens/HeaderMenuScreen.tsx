// HeaderMenuScreen — right header menu (modal)
// Mockup: mobile/header-menu.html (1_08_25)
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';

const menuItems = [
  { icon: '👤', label: 'Мой профиль', screen: 'Profile' },
  { icon: '⚙️', label: 'Настройки', screen: 'Settings' },
  { icon: '🌙', label: 'Тёмная тема', action: 'toggleTheme' },
  { icon: '📁', label: 'Архив', screen: 'Archive' },
  { icon: '📞', label: 'Звонки', screen: 'CallHistory' },
  { icon: '💰', label: 'Мои донаты', screen: 'MyDonates' },
  { icon: '💚', label: 'Поддержать', screen: 'Donate' },
  { icon: '🚪', label: 'Выйти', action: 'logout', danger: true },
];

export default function HeaderMenuScreen({ navigation }: any) {
  const colors = getThemeColors(useUIStore(s => s.theme));
  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bg }]}>
      <Text style={[s.title, { color: colors.text }]}>☰ Меню</Text>
      <ScrollView>
        {menuItems.map((item) => (
          <TouchableOpacity key={item.label} style={[s.row, { borderBottomColor: colors.border }]} onPress={() => { if (item.screen) navigation?.navigate?.(item.screen); navigation?.goBack?.(); }}>
            <Text style={{ fontSize: 20, marginRight: 12 }}>{item.icon}</Text>
            <Text style={{ color: item.danger ? '#e53e3e' : colors.text, fontSize: 15, fontWeight: '500' }}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({ container: { flex: 1 }, title: { fontSize: 20, fontWeight: '700', padding: 16 }, row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1 } });
