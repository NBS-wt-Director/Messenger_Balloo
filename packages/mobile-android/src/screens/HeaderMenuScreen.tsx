// HeaderMenuScreen — right header menu (modal)
// Mockup: mobile/header-menu.html (1_08_25)
// Тикет 1792311348: имена экранов сверены с роутером (src/router/index.tsx),
// «Выйти» работает через authStore.logout(), «Тёмная тема» — через uiStore.setTheme.
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';

type MenuAction = 'toggleTheme' | 'logout';

interface MenuItem {
  icon: string;
  label: string;
  screen?: string;
  action?: MenuAction;
  danger?: boolean;
}

// screen обязан совпадать с именем MainStack/MainTabs экрана
const menuItems: MenuItem[] = [
  { icon: '👤', label: 'Мой профиль', screen: 'Profile' },
  { icon: '⚙️', label: 'Настройки', screen: 'SettingsTab' },
  { icon: '🌙', label: 'Тёмная тема', action: 'toggleTheme' },
  { icon: '📁', label: 'Архив', screen: 'Archive' },
  { icon: '📞', label: 'Звонки', screen: 'CallHistory' },
  { icon: '💻', label: 'Мои устройства', screen: 'Devices' },
  { icon: '💰', label: 'Мои донаты', screen: 'MyDonates' },
  { icon: '💚', label: 'Поддержать', screen: 'Donate' },
  { icon: '🚪', label: 'Выйти', action: 'logout', danger: true },
];

export default function HeaderMenuScreen({ navigation }: any) {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const colors = getThemeColors(theme);
  const logout = useAuthStore((s) => s.logout);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert('Выйти из аккаунта?', 'Сессия на этом устройстве будет завершена.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoggingOut(true);
            // Сервер отзывает refresh-токен; ошибка сети не должна мешать локальному выходу
            await api.logout().catch(() => undefined);
          } finally {
            logout();
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  const handlePress = (item: MenuItem) => {
    if (item.action === 'toggleTheme') {
      // dark ↔ light (russian — третья тема, в меню не переключается)
      setTheme(theme === 'dark' ? 'light' : 'dark');
      return;
    }
    if (item.action === 'logout') {
      handleLogout();
      return;
    }
    if (item.screen) {
      navigation?.navigate?.(item.screen);
    }
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bgPrimary }]}>
      <Text style={[s.title, { color: colors.textPrimary }]}>☰ Меню</Text>
      <ScrollView>
        {menuItems.map((item) => (
          <TouchableOpacity key={item.label} style={[s.row, { borderBottomColor: colors.border }]} onPress={() => handlePress(item)} disabled={loggingOut}>
            <Text style={{ fontSize: 20, marginRight: 12 }}>{item.icon}</Text>
            <Text style={{ flex: 1, color: item.danger ? '#e53e3e' : colors.textPrimary, fontSize: 15, fontWeight: '500' }}>
              {item.action === 'toggleTheme' ? (theme === 'dark' ? 'Тёмная тема' : 'Светлая тема') : item.label}
            </Text>
            {item.action === 'logout' && loggingOut && <ActivityIndicator color={colors.accent} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({ container: { flex: 1 }, title: { fontSize: 20, fontWeight: '700', padding: 16 }, row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1 } });
