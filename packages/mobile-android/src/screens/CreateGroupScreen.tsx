// Balloo Messenger — Mobile Create Group Screen
// Cover, avatar autogeneration, name, description, type, privacy settings

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors, spacing, fontSize } from '../styles/theme';
import { useUIStore } from '../store/uiStore';
import { api } from '../services/api';

type GroupType = 'ordinary' | 'public' | 'media' | 'corporate' | '';

const GRADIENTS = [
  ['#2db84d', '#1565c0', '#7c3aed'],
  ['#e76f51', '#f4a261', '#e9c46a'],
  ['#264653', '#2a9d8f', '#a8dadc'],
  ['#6a040f', '#9d0208', '#d00000'],
  ['#003049', '#d62828', '#f77f00'],
  ['#3d405b', '#81b29a', '#f2cc8f'],
  ['#1d3557', '#457b9d', '#a8dadc'],
  ['#2b2d42', '#8d99ae', '#edf2f4'],
  ['#001219', '#38b000', '#70e000'],
  ['#4a0e4e', '#812481', '#b239b2'],
];

const SYMBOLS = ['🏢', '🌐', '💡', '📰', '🎯', '⚡', '🔥', '🌟', '🚀', '🎨', '📦', '💎', '🏆', '🎪', '🌈', '🎭', '🔮', '🧩', '🎲', '🎸'];

const GROUP_TYPES: { value: GroupType; label: string; description: string }[] = [
  { value: 'ordinary', label: '👥 Обычная', description: 'Закрытая группа для общения. Только участники могут писать.' },
  { value: 'public', label: '📢 Публичная', description: 'Открытая группа: может писать любой. Подписка вместо вступления.' },
  { value: 'media', label: '📰 СМИ', description: 'Канал с комментариями. Нужна верификация как СМИ.' },
  { value: 'corporate', label: '🏢 Корпоративная', description: 'Чат + витрина товаров, расписание, чат клиентов и сотрудников.' },
];

interface CreateGroupScreenProps {
  navigation: any;
}

export default function CreateGroupScreen({ navigation }: CreateGroupScreenProps) {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [groupType, setGroupType] = useState<GroupType>('');
  const [requireRules, setRequireRules] = useState(false);
  const [historyForNew, setHistoryForNew] = useState('all');
  const [allowMedia, setAllowMedia] = useState(true);
  const [currentGradient, setCurrentGradient] = useState(GRADIENTS[0]);
  const [currentSymbol, setCurrentSymbol] = useState(SYMBOLS[0]);
  const [loading, setLoading] = useState(false);

  const theme = useUIStore((s) => s.theme);
  const colors = getThemeColors(theme);

  const regenerateAvatar = () => {
    const grad = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
    const sym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    setCurrentGradient(grad);
    setCurrentSymbol(sym);
  };

  React.useEffect(() => {
    regenerateAvatar();
  }, []);

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('Ошибка', 'Введите название группы');
      return;
    }
    if (!groupType) {
      Alert.alert('Ошибка', 'Выберите тип группы');
      return;
    }

    setLoading(true);
    try {
      const chat = await api.createChat({
        type: 'group',
        name: groupName.trim(),
        description: description.trim(),
      });
      Alert.alert('Готово', `Группа "${groupName}" создана!`, [
        { text: 'Открыть', onPress: () => navigation.navigate('ChatView', { chatId: chat.id, chatName: chat.name }) },
        { text: 'OK' },
      ]);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось создать группу');
    } finally {
      setLoading(false);
    }
  };

  const getGroupDescription = () => {
    const gt = GROUP_TYPES.find((t) => t.value === groupType);
    return gt?.description || '';
  };

  const gradientStyle = {
    background: `linear-gradient(135deg, ${currentGradient[0]}, ${currentGradient[1]}, ${currentGradient[2]})`,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Создать группу</Text>

        {/* Avatar */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Аватар группы</Text>
          <View style={styles.avatarRow}>
            <View style={styles.avatarContainer}>
              <View
                style={[
                  styles.avatarPreview,
                  {
                    backgroundColor: currentGradient[0] as string,
                    width: 56,
                    height: 56,
                  },
                ]}
              >
                <Text style={styles.avatarSymbol}>{currentSymbol}</Text>
              </View>
              <TouchableOpacity style={styles.regenBtnSmall} onPress={regenerateAvatar}>
                <Text style={[styles.regenBtnText, { color: colors.accent }]}>🔄</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.avatarInfo}>
              <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>
                Авто: случайный градиент
              </Text>
              <View style={styles.avatarActions}>
                <TouchableOpacity
                  style={[styles.smallBtn, { backgroundColor: colors.bgTertiary }]}
                  onPress={regenerateAvatar}
                >
                  <Text style={[styles.smallBtnText, { color: colors.textPrimary }]}>🔄 Ещё</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Basic info */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Название группы *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Моя группа"
              placeholderTextColor={colors.textTertiary}
              value={groupName}
              onChangeText={setGroupName}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Описание</Text>
            <TextInput
              style={[styles.textarea, { backgroundColor: colors.bgTertiary, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="О чём эта группа?"
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Group type */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Тип группы *</Text>
          {GROUP_TYPES.map((gt) => (
            <TouchableOpacity
              key={gt.value}
              style={[
                styles.typeOption,
                {
                  backgroundColor: groupType === gt.value ? colors.accentLight : 'transparent',
                  borderColor: groupType === gt.value ? colors.accent : colors.border,
                },
              ]}
              onPress={() => setGroupType(gt.value)}
            >
              <View style={styles.typeOptionContent}>
                <Text style={[styles.typeOptionLabel, { color: colors.textPrimary }]}>{gt.label}</Text>
                {groupType === gt.value && (
                  <Text style={[styles.typeOptionCheck, { color: colors.accent }]}>✓</Text>
                )}
              </View>
              {groupType === gt.value && (
                <Text style={[styles.typeOptionDesc, { color: colors.textSecondary }]}>
                  {gt.description}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Privacy settings */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Настройки приватности</Text>

          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Ознакомление с правилами</Text>
            <Switch value={requireRules} onValueChange={setRequireRules} trackColor={{ false: colors.border, true: colors.accentLight }} thumbColor={requireRules ? colors.accent : colors.textTertiary} />
          </View>

          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>История для новых</Text>
            <TouchableOpacity
              style={[styles.selectBtn, { backgroundColor: colors.bgTertiary, borderColor: colors.border }]}
              onPress={() => {
                const options = ['Вся', 'Последние 100', 'С момента'];
                Alert.alert('История для новых', '', options.map((opt) => ({ text: opt, onPress: () => setHistoryForNew(opt) })));
              }}
            >
              <Text style={[styles.selectBtnText, { color: colors.textSecondary }]}>
                {historyForNew === 'all' ? 'Вся' : historyForNew === 'last100' ? 'Последние 100' : 'С момента'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Разрешить вложения</Text>
            <Switch value={allowMedia} onValueChange={setAllowMedia} trackColor={{ false: colors.border, true: colors.accentLight }} thumbColor={allowMedia ? colors.accent : colors.textTertiary} />
          </View>
        </View>

        {/* Create button */}
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: colors.accent, opacity: loading ? 0.7 : 1 }]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createBtnText}>Создать группу</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 40 },
  pageTitle: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  card: { padding: 14, borderWidth: 1, gap: 10 },
  cardTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarContainer: { position: 'relative' },
  avatarPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  avatarSymbol: { fontSize: 24 },
  regenBtnSmall: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  regenBtnText: { fontSize: 14 },
  avatarInfo: { flex: 1 },
  avatarHint: { fontSize: 11, marginBottom: 6 },
  avatarActions: { flexDirection: 'row', gap: 6 },
  smallBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 },
  smallBtnText: { fontSize: 12, fontWeight: '600' },
  formGroup: { marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  input: { padding: 12, fontSize: 13, borderWidth: 1, borderRadius: 6 },
  textarea: { padding: 12, fontSize: 13, borderWidth: 1, borderRadius: 6, minHeight: 60, textAlignVertical: 'top' },
  typeOption: { padding: 10, borderWidth: 1, borderRadius: 6, marginBottom: 6 },
  typeOptionContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeOptionLabel: { fontSize: 13, fontWeight: '600' },
  typeOptionCheck: { fontSize: 14, fontWeight: '700' },
  typeOptionDesc: { fontSize: 11, marginTop: 4, lineHeight: 16 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingLabel: { fontSize: 13, flex: 1 },
  selectBtn: { paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderRadius: 4 },
  selectBtnText: { fontSize: 12 },
  createBtn: { padding: 16, alignItems: 'center', borderRadius: 8, marginTop: 8 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});