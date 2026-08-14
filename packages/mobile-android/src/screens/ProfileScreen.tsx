// Balloo Messenger — Mobile Profile Screen
// User profile: avatar, info, accounts, devices, privacy, danger zone

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore, SUPPORTED_LANGUAGES, Theme as ThemeType } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import Avatar from '../components/Avatar';
import BottomSheet from '../components/BottomSheet';

interface ProfileScreenProps {
  navigation: any;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const setLanguage = useUIStore((s) => s.setLanguage);
  const language = useUIStore((s) => s.language);
  const colors = getThemeColors(theme);
  const { user, updateUser, logout } = useAuthStore();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState('');
  const [status, setStatus] = useState('На работе');
  const [showAvatarSheet, setShowAvatarSheet] = useState(false);
  const [showAccountsSheet, setShowAccountsSheet] = useState(false);
  const [showBlockedSheet, setShowBlockedSheet] = useState(false);

  const handleSave = () => {
    updateUser({ displayName });
    Alert.alert('Сохранено', 'Профиль обновлён');
  };

  const handleThemeChange = (newTheme: ThemeType) => {
    setTheme(newTheme);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Удаление аккаунта',
      'Аккаунт будет анонимизирован через 90 дней. Продолжить?',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Удалить', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Avatar
            name={user?.displayName || user?.username || 'User'}
            avatarUrl={user?.avatarUrl}
            size="xl"
            status="online"
            bordered
          />
          <TouchableOpacity
            style={[styles.changeAvatarBtn, { backgroundColor: colors.bgTertiary, borderColor: colors.border }]}
            onPress={() => setShowAvatarSheet(true)}
          >
            <Text style={[styles.changeAvatarText, { color: colors.textPrimary }]}>📷 Изменить аватар</Text>
          </TouchableOpacity>
        </View>

        {/* Multi-account */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>👥 Аккаунты</Text>
            <TouchableOpacity onPress={() => setShowAccountsSheet(true)}>
              <Text style={[styles.cardLink, { color: colors.accent }]}>Управлять →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.accountsRow}>
            <View style={[styles.accountChip, { borderColor: colors.accent, backgroundColor: colors.bgTertiary }]}>
              <View style={[styles.accountAvatar, { backgroundColor: colors.accent }]}>
                <Text style={styles.accountAvatarText}>ИИ</Text>
              </View>
              <Text style={[styles.accountName, { color: colors.textPrimary }]}>Иван</Text>
            </View>
            <TouchableOpacity
              style={[styles.accountAdd, { borderColor: colors.accent }]}
              onPress={() => setShowAccountsSheet(true)}
            >
              <Text style={[styles.accountAddText, { color: colors.accent }]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Basic info */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Основная информация</Text>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Имя</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.border, color: colors.textPrimary }]}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Иван Иванов"
            placeholderTextColor={colors.textTertiary}
          />
          <Text style={[styles.label, { color: colors.textSecondary }]}>Био</Text>
          <TextInput
            style={[styles.textarea, { backgroundColor: colors.bgTertiary, borderColor: colors.border, color: colors.textPrimary }]}
            value={bio}
            onChangeText={setBio}
            placeholder="Разработчик. Люблю геометрию и восьмигранники."
            placeholderTextColor={colors.textTertiary}
            multiline
          />
          <Text style={[styles.label, { color: colors.textSecondary }]}>Статус</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.border, color: colors.textPrimary }]}
            value={status}
            onChangeText={setStatus}
            maxLength={70}
          />
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accent }]} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Сохранить</Text>
          </TouchableOpacity>
        </View>

        {/* Appearance */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Оформление</Text>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Тема</Text>
          <View style={styles.themeRow}>
            {(['dark', 'light', 'russian'] as ThemeType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.themeBtn,
                  {
                    backgroundColor: theme === t ? colors.accent : colors.bgTertiary,
                    borderColor: theme === t ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => handleThemeChange(t)}
              >
                <Text style={[styles.themeBtnText, { color: theme === t ? '#fff' : colors.textPrimary }]}>
                  {t === 'dark' ? '🌙 Тёмная' : t === 'light' ? '☀️ Светлая' : '🇷🇺 Наша'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Donate */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.accent }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>💰 Поддержка проекта</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Помогите Balloo развиваться!</Text>
          <View style={styles.donateRow}>
            <TouchableOpacity style={[styles.donateBtn, { backgroundColor: colors.accent }]} onPress={() => navigation.navigate('Donate')}>
              <Text style={styles.donateBtnText}>💰 Поддержать</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.donateBtnSecondary, { backgroundColor: colors.bgTertiary, borderColor: colors.border }]} onPress={() => navigation.navigate('MyDonates')}>
              <Text style={[styles.donateBtnSecondaryText, { color: colors.textPrimary }]}>📋 Мои донаты</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Devices */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>📱 Устройства</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Devices')}>
              <Text style={[styles.cardLink, { color: colors.accent }]}>Мои устройства →</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.deviceItem, { borderBottomColor: colors.border }]}>
            <Text style={styles.deviceIcon}>💻</Text>
            <View style={styles.deviceInfo}>
              <Text style={[styles.deviceName, { color: colors.textPrimary }]}>Windows Desktop</Text>
              <Text style={[styles.deviceMeta, { color: colors.textSecondary }]}>Москва • Сейчас</Text>
            </View>
            <View style={[styles.deviceChip, { backgroundColor: colors.accentLight }]}>
              <Text style={[styles.deviceChipText, { color: colors.accent }]}>Это устройство</Text>
            </View>
          </View>
        </View>

        {/* Privacy */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Приватность</Text>
          <TouchableOpacity style={[styles.privacyItem, { borderBottomColor: colors.border }]} onPress={() => setShowBlockedSheet(true)}>
            <Text style={[styles.privacyLabel, { color: colors.textPrimary }]}>Заблокированные</Text>
            <Text style={[styles.privacyValue, { color: colors.accent }]}>3 чел.</Text>
          </TouchableOpacity>
        </View>

        {/* Danger zone */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.danger }]}>
          <Text style={[styles.cardTitle, { color: colors.danger }]}>Опасная зона</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Удаление аккаунта → анонимизация через 90 дней
          </Text>
          <TouchableOpacity style={[styles.dangerBtn, { backgroundColor: colors.danger }]} onPress={handleDeleteAccount}>
            <Text style={styles.dangerBtnText}>Удалить аккаунт</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Avatar Bottom Sheet */}
      <BottomSheet visible={showAvatarSheet} onClose={() => setShowAvatarSheet(false)} title="📷 Изменить аватар">
        <View style={styles.sheetContent}>
          <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: colors.accent }]} onPress={() => { setShowAvatarSheet(false); Alert.alert('Загрузка фото...'); }}>
            <Text style={styles.sheetBtnText}>📁 Загрузить фото</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: colors.bgTertiary, borderColor: colors.border }]} onPress={() => { setShowAvatarSheet(false); Alert.alert('Камера...'); }}>
            <Text style={[styles.sheetBtnText, { color: colors.textPrimary }]}>📸 Камера</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: colors.bgTertiary, borderColor: colors.border }]} onPress={() => { setShowAvatarSheet(false); Alert.alert('Генерация...'); }}>
            <Text style={[styles.sheetBtnText, { color: colors.textPrimary }]}>🤖 Сгенерировать AI</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sheetBtnDanger, { backgroundColor: colors.danger }]} onPress={() => { setShowAvatarSheet(false); Alert.alert('Аватар удалён'); }}>
            <Text style={styles.sheetBtnText}>🗑 Удалить аватар</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* Accounts Bottom Sheet */}
      <BottomSheet visible={showAccountsSheet} onClose={() => setShowAccountsSheet(false)} title="👥 Управление аккаунтами">
        <View style={styles.sheetContent}>
          <View style={[styles.accountDetailCard, { borderColor: colors.accent, backgroundColor: colors.accentLight }]}>
            <View style={[styles.accountAvatar, { backgroundColor: colors.accent }]}>
              <Text style={styles.accountAvatarText}>ИИ</Text>
            </View>
            <View style={styles.accountDetailInfo}>
              <Text style={[styles.accountDetailName, { color: colors.textPrimary }]}>Иван Иванов</Text>
              <Text style={[styles.accountDetailStatus, { color: colors.textSecondary }]}>Активный · @ivan</Text>
            </View>
            <View style={[styles.accountChip2, { backgroundColor: colors.accent }]}>
              <Text style={styles.accountChip2Text}>Активен</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: colors.accent }]} onPress={() => { setShowAccountsSheet(false); Alert.alert('Добавление аккаунта...'); }}>
            <Text style={styles.sheetBtnText}>➕ Добавить аккаунт</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* Blocked Users Bottom Sheet */}
      <BottomSheet visible={showBlockedSheet} onClose={() => setShowBlockedSheet(false)} title="🚫 Заблокированные пользователи">
        <View style={styles.sheetContent}>
          {['Заблокированный', 'Токсичный', 'Бот-скрипт'].map((name, i) => (
            <View key={i} style={[styles.blockedItem, { borderBottomColor: colors.border }]}>
              <Avatar name={name} size="sm" status="offline" />
              <View style={styles.blockedInfo}>
                <Text style={[styles.blockedName, { color: colors.textTertiary }]}>{name}</Text>
                <Text style={[styles.blockedReason, { color: colors.textSecondary }]}>
                  Причина: {['Спам', 'Оскорбления', 'Автоматические сообщения'][i]}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.unblockBtn, { backgroundColor: colors.bgTertiary, borderColor: colors.border }]}
                onPress={() => Alert.alert('Разблокирован', `${name} разблокирован`)}
              >
                <Text style={[styles.unblockBtnText, { color: colors.textPrimary }]}>Разблокировать</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  avatarSection: { alignItems: 'center', marginBottom: 8 },
  changeAvatarBtn: { marginTop: 12, padding: 10, borderRadius: 8, borderWidth: 1 },
  changeAvatarText: { fontSize: 13, fontWeight: '600' },
  card: { padding: 16, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardSubtitle: { fontSize: 13, marginBottom: 12 },
  cardLink: { fontSize: 13, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: { padding: 12, fontSize: 14, borderWidth: 1 },
  textarea: { padding: 12, fontSize: 14, borderWidth: 1, minHeight: 60 },
  saveBtn: { padding: 14, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  themeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  themeBtn: { padding: 10, borderRadius: 8, borderWidth: 1 },
  themeBtnText: { fontSize: 12, fontWeight: '600' },
  accountsRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  accountChip: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderWidth: 1 },
  accountAvatar: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  accountAvatarText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  accountName: { fontSize: 12, fontWeight: '600' },
  accountAdd: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed' },
  accountAddText: { fontSize: 20 },
  donateRow: { flexDirection: 'row', gap: 8 },
  donateBtn: { flex: 1, padding: 14, alignItems: 'center' },
  donateBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  donateBtnSecondary: { flex: 1, padding: 14, alignItems: 'center', borderWidth: 1 },
  donateBtnSecondaryText: { fontSize: 14, fontWeight: '600' },
  deviceItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
  deviceIcon: { fontSize: 24 },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 14, fontWeight: '600' },
  deviceMeta: { fontSize: 12 },
  deviceChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  deviceChipText: { fontSize: 11, fontWeight: '600' },
  privacyItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1 },
  privacyLabel: { fontSize: 14 },
  privacyValue: { fontSize: 13, fontWeight: '600' },
  dangerBtn: { padding: 14, alignItems: 'center' },
  dangerBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  sheetContent: { gap: 10 },
  sheetBtn: { padding: 14, alignItems: 'center', borderRadius: 8 },
  sheetBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  sheetBtnDanger: { padding: 14, alignItems: 'center', borderRadius: 8 },
  accountDetailCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderWidth: 1 },
  accountDetailInfo: { flex: 1 },
  accountDetailName: { fontSize: 14, fontWeight: '600' },
  accountDetailStatus: { fontSize: 12 },
  accountChip2: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  accountChip2Text: { color: '#fff', fontSize: 11, fontWeight: '600' },
  blockedItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
  blockedInfo: { flex: 1 },
  blockedName: { fontSize: 14, fontWeight: '600' },
  blockedReason: { fontSize: 12 },
  unblockBtn: { padding: 8, borderRadius: 8, borderWidth: 1 },
  unblockBtnText: { fontSize: 12, fontWeight: '600' },
});