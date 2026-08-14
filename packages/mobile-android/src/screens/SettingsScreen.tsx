// Balloo Messenger — Mobile Settings Screen
// Tabbed settings: notifications, appearance, language, privacy, storage, devices, accounts, security, cache, disk, donate, support, about

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore, SUPPORTED_LANGUAGES, Theme as ThemeType } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';

interface SettingsScreenProps {
  navigation: any;
}

type SettingsTab =
  | 'notifications'
  | 'appearance'
  | 'language'
  | 'privacy'
  | 'storage'
  | 'devices'
  | 'accounts'
  | 'security'
  | 'cache'
  | 'disk'
  | 'donate'
  | 'support'
  | 'about';

const TABS: { key: SettingsTab; label: string; icon: string }[] = [
  { key: 'notifications', label: 'Уведомления', icon: '🔔' },
  { key: 'appearance', label: 'Оформление', icon: '🎨' },
  { key: 'language', label: 'Язык', icon: '🌍' },
  { key: 'privacy', label: 'Приватность', icon: '🔒' },
  { key: 'storage', label: 'Хранилище', icon: '💾' },
  { key: 'devices', label: 'Устройства', icon: '📱' },
  { key: 'accounts', label: 'Аккаунты', icon: '👤' },
  { key: 'security', label: 'Безопасность', icon: '🔐' },
  { key: 'cache', label: 'Оффлайн-кэш', icon: '💾' },
  { key: 'disk', label: 'Yandex Disk', icon: '☁️' },
  { key: 'donate', label: 'Донаты', icon: '💰' },
  { key: 'support', label: 'Поддержка', icon: '🎧' },
  { key: 'about', label: 'О Balloo', icon: 'ℹ️' },
];

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('notifications');
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const setLanguage = useUIStore((s) => s.setLanguage);
  const language = useUIStore((s) => s.language);
  const colors = getThemeColors(theme);
  const { user, logout } = useAuthStore();

  const [switches, setSwitches] = useState<Record<string, boolean>>({
    preview: true,
    group: true,
    sound: true,
    dnd: false,
    geoDnd: false,
    interrupting: true,
    vibration: true,
    cacheMessages: true,
    autoClean: true,
    offlineQueue: true,
    cacheFiles: true,
    wifiAuto: true,
    mobileAuto: false,
  });

  const toggleSwitch = (key: string) => {
    setSwitches((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'notifications':
        return (
          <View style={styles.tabContent}>
            <Text style={[styles.tabTitle, { color: colors.textPrimary }]}>Уведомления</Text>
            <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Push-уведомления</Text>
              <SettingsRow label="Превью текста" right={<View style={[styles.chip, { backgroundColor: colors.bgTertiary }]}><Text style={[styles.chipText, { color: colors.textSecondary }]}>20 символов</Text></View>} />
              <SettingsRow label="Группировка (до 5)" right={<Switch value={switches.group} onValueChange={() => toggleSwitch('group')} />} />
              <SettingsRow label="Звук" right={<View style={[styles.chip, { backgroundColor: colors.bgTertiary }]}><Text style={[styles.chipText, { color: colors.textSecondary }]}>Стандартный 1</Text></View>} />
            </View>
            <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Не беспокоить (DND)</Text>
              <SettingsRow label="Включить DND" right={<Switch value={switches.dnd} onValueChange={() => toggleSwitch('dnd')} />} />
            </View>
            <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Звонки</Text>
              <SettingsRow label="Прерывающий звонок" right={<Switch value={switches.interrupting} onValueChange={() => toggleSwitch('interrupting')} />} />
              <SettingsRow label="Вибрация" right={<Switch value={switches.vibration} onValueChange={() => toggleSwitch('vibration')} />} />
            </View>
          </View>
        );

      case 'appearance':
        return (
          <View style={styles.tabContent}>
            <Text style={[styles.tabTitle, { color: colors.textPrimary }]}>Оформление</Text>
            <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Тема</Text>
              {(['dark', 'light', 'russian'] as ThemeType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.themeItem, { borderBottomColor: colors.border, backgroundColor: theme === t ? colors.accentLight : 'transparent' }]}
                  onPress={() => setTheme(t)}
                >
                  <Text style={[styles.themeItemText, { color: colors.textPrimary }]}>
                    {t === 'dark' ? '🌙 Тёмная' : t === 'light' ? '☀️ Светлая' : '🇷🇺 Российская'}
                  </Text>
                  {theme === t && <Text style={[styles.themeActive, { color: colors.accent }]}>Активна</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'language':
        return (
          <View style={styles.tabContent}>
            <Text style={[styles.tabTitle, { color: colors.textPrimary }]}>Язык</Text>
            <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Интерфейс</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>20 языков: 3 группы</Text>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langItem, { borderBottomColor: colors.border, backgroundColor: language === lang.code ? colors.accentLight : 'transparent' }]}
                  onPress={() => setLanguage(lang.code as any)}
                >
                  <Text style={[styles.langItemText, { color: language === lang.code ? colors.accent : colors.textPrimary }]}>
                    {lang.nativeName}
                  </Text>
                  {language === lang.code && <Text style={{ color: colors.accent }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'security':
        return (
          <View style={styles.tabContent}>
            <Text style={[styles.tabTitle, { color: colors.textPrimary }]}>Безопасность</Text>
            <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Двухфакторная аутентификация</Text>
              <SettingsRow
                label="2FA через email"
                right={<Switch value={true} onValueChange={() => Alert.alert('2FA', 'Управление 2FA')} />}
              />
            </View>
          </View>
        );

      case 'privacy':
        return (
          <View style={styles.tabContent}>
            <Text style={[styles.tabTitle, { color: colors.textPrimary }]}>Приватность</Text>
            <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>👁 Видимость профиля</Text>
              <SettingsRow label="Кто видит профиль" right={<Text style={[styles.valueText, { color: colors.textSecondary }]}>Все</Text>} />
              <SettingsRow label="Кто видит «в сети»" right={<Text style={[styles.valueText, { color: colors.textSecondary }]}>Все</Text>} />
              <SettingsRow label="Кто может добавлять в группы" right={<Text style={[styles.valueText, { color: colors.textSecondary }]}>Все</Text>} />
            </View>
          </View>
        );

      case 'about':
        return (
          <View style={styles.tabContent}>
            <Text style={[styles.tabTitle, { color: colors.textPrimary }]}>О Balloo</Text>
            <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <View style={styles.aboutLogo}>
                <Text style={styles.aboutLogoIcon}>🎈</Text>
                <Text style={[styles.aboutName, { color: colors.textPrimary }]}>Balloo Messenger</Text>
                <Text style={[styles.aboutVersion, { color: colors.textSecondary }]}>Версия 1.0.0 (сборка 2026.07.18)</Text>
              </View>
              <SettingsRow label="Поддержка" right={<Text style={[styles.linkText, { color: colors.accent }]}>help@balloo.su</Text>} />
              <SettingsRow label="Лицензия" right={<Text style={[styles.linkText, { color: colors.accent }]}>MIT</Text>} />
            </View>
          </View>
        );

      case 'support':
        return (
          <View style={styles.tabContent}>
            <Text style={[styles.tabTitle, { color: colors.textPrimary }]}>🎧 Поддержка</Text>
            <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Чат с поддержкой</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Среднее время ответа: 15 минут</Text>
              <TouchableOpacity style={[styles.supportBtn, { backgroundColor: colors.accent }]} onPress={() => navigation.navigate('ChatView', { chatId: 'support', chatName: 'Поддержка' })}>
                <Text style={styles.supportBtnText}>📤 Написать в поддержку</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'donate':
        return (
          <View style={styles.tabContent}>
            <Text style={[styles.tabTitle, { color: colors.textPrimary }]}>💰 Донаты</Text>
            <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Мои донаты</Text>
              <TouchableOpacity style={[styles.donateBtn, { backgroundColor: colors.accent }]} onPress={() => navigation.navigate('Donate')}>
                <Text style={styles.donateBtnText}>💰 Поддержать проект</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'devices':
        return (
          <View style={styles.tabContent}>
            <Text style={[styles.tabTitle, { color: colors.textPrimary }]}>Мои устройства</Text>
            <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Активные сессии</Text>
              <View style={[styles.deviceCard, { borderColor: colors.accent, backgroundColor: colors.accentLight }]}>
                <Text style={styles.deviceIcon}>💻</Text>
                <View style={styles.deviceInfo}>
                  <Text style={[styles.deviceName, { color: colors.textPrimary }]}>Windows PC</Text>
                  <Text style={[styles.deviceMeta, { color: colors.textSecondary }]}>Москва • Сейчас</Text>
                </View>
                <View style={[styles.deviceChip, { backgroundColor: colors.accent }]}>
                  <Text style={styles.deviceChipText}>Текущее</Text>
                </View>
              </View>
            </View>
          </View>
        );

      case 'storage':
      case 'cache':
        return (
          <View style={styles.tabContent}>
            <Text style={[styles.tabTitle, { color: colors.textPrimary }]}>
              {activeTab === 'storage' ? 'Хранилище' : 'Оффлайн-кэш'}
            </Text>
            <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <SettingsRow label="Кэшировать сообщения" right={<Switch value={switches.cacheMessages} onValueChange={() => toggleSwitch('cacheMessages')} />} />
              <SettingsRow label="Авто-очистка" right={<Switch value={switches.autoClean} onValueChange={() => toggleSwitch('autoClean')} />} />
              <SettingsRow label="Очередь отправки (офлайн)" right={<Switch value={switches.offlineQueue} onValueChange={() => toggleSwitch('offlineQueue')} />} />
            </View>
            <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📊 Использование</Text>
              <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: colors.bgTertiary }]}>
                  <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Использовано</Text>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>847 МБ</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.bgTertiary }]}>
                  <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Лимит</Text>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>2 ГБ</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.bgTertiary }]}>
                  <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Свободно</Text>
                  <Text style={[styles.statValue, { color: colors.accent }]}>1.2 ГБ</Text>
                </View>
              </View>
            </View>
          </View>
        );

      default:
        return (
          <View style={styles.tabContent}>
            <Text style={[styles.tabTitle, { color: colors.textPrimary }]}>
              {TABS.find((t) => t.key === activeTab)?.label}
            </Text>
            <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
              Настройки раздела в разработке
            </Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Tabs strip */}
      <View style={[styles.tabsStrip, { borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabLabel, { color: activeTab === tab.key ? colors.accent : colors.textSecondary }]}>
                {tab.icon} {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderTab()}
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper components
function SettingsRow({ label, right }: { label: string; right: React.ReactNode }) {
  return (
    <View style={styles.settingsRow}>
      <Text style={[styles.settingsLabel, { color: '#e6edf3' }]}>{label}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabsStrip: {
    borderBottomWidth: 1,
    paddingHorizontal: 4,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: { fontSize: 12, fontWeight: '600' },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 40 },
  tabContent: { gap: 16 },
  tabTitle: { fontSize: 18, fontWeight: '800' },
  card: { padding: 16, borderWidth: 1, gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  sectionSubtitle: { fontSize: 12 },
  chip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  chipText: { fontSize: 12 },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0,
  },
  settingsLabel: { fontSize: 14, flex: 1 },
  valueText: { fontSize: 13 },
  linkText: { fontSize: 13 },
  themeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  themeItemText: { fontSize: 14 },
  themeActive: { fontSize: 11, fontWeight: '600' },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  langItemText: { fontSize: 13 },
  aboutLogo: { alignItems: 'center', marginBottom: 16 },
  aboutLogoIcon: { fontSize: 40 },
  aboutName: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  aboutVersion: { fontSize: 13, marginTop: 4 },
  supportBtn: { padding: 14, alignItems: 'center', marginTop: 12 },
  supportBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  donateBtn: { padding: 14, alignItems: 'center', marginTop: 12 },
  donateBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  deviceIcon: { fontSize: 24 },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 14, fontWeight: '600' },
  deviceMeta: { fontSize: 12 },
  deviceChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  deviceChipText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, padding: 10, alignItems: 'center' },
  statLabel: { fontSize: 11 },
  statValue: { fontSize: 16, fontWeight: '800' },
  placeholder: { fontSize: 14, textAlign: 'center', marginTop: 40 },
});