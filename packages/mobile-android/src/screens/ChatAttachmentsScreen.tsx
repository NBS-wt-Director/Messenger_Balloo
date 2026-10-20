// ChatAttachmentsScreen — chat file/media gallery
// Mockup: mobile/chat-attachments.html (1_08_18)
// Тикет 1792311340: данные берутся из GET /api/chats/:id/attachments?type=<tab>
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';
import { api } from '../services/api';

type Tab = 'images'|'videos'|'files'|'links';
interface Att { id: string; type: 'image'|'video'|'file'|'link'; name: string; size: string; date: string }

// Размер в байтах → читаемый вид (сервер отдаёт Number(size))
const fmtSize = (bytes: number): string => {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
};

export default function ChatAttachmentsScreen({ route }: any) {
  const colors = getThemeColors(useUIStore(s => s.theme));
  const chatId: string | undefined = route?.params?.chatId ?? route?.params?.id;
  const [tab, setTab] = useState<Tab>('images');
  const [items, setItems] = useState<Att[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tabs: { key: Tab; icon: string; label: string }[] = [
    { key: 'images', icon: '🖼', label: 'Фото' }, { key: 'videos', icon: '🎥', label: 'Видео' },
    { key: 'files', icon: '📄', label: 'Файлы' }, { key: 'links', icon: '🔗', label: 'Ссылки' },
  ];

  // Вкладка links на сервере заведомо пуста: ссылки живут в content сообщений,
  // а не в таблице вложений (packages/server/src/services/messageService.ts:727)
  const load = useCallback(async () => {
    if (!chatId) {
      setItems([]);
      setError('Чат не выбран');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await api.getChatAttachments(chatId, tab);
      const list: Att[] = (Array.isArray(res) ? res : []).map((a: any) => ({
        id: a.id,
        type: a.type === 'image' || a.type === 'video' || a.type === 'link' ? a.type : 'file',
        name: a.name ?? 'Без имени',
        size: fmtSize(Number(a.size) || 0),
        date: a.createdAt ? new Date(Number(a.createdAt) * 1000).toLocaleDateString('ru') : '',
      }));
      setItems(list);
    } catch (e: any) {
      setError(e?.message || 'Не удалось загрузить вложения');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [chatId, tab]);

  useEffect(() => { load(); }, [load]);
  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bgPrimary }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabs}>
        {tabs.map((t) => (
          <TouchableOpacity key={t.key} style={[s.tab, { borderBottomColor: tab === t.key ? colors.accent : 'transparent' }]} onPress={() => setTab(t.key)}>
            <Text style={{ fontSize: 13, color: tab === t.key ? colors.accent : colors.textSecondary }}>{t.icon} {t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 48 }} />
      ) : error ? (
        <View style={{ alignItems: 'center', marginTop: 48, gap: 12 }}>
          <Text style={{ color: '#e53e3e' }}>{error}</Text>
          <TouchableOpacity onPress={load}><Text style={{ color: colors.accent, fontWeight: '600' }}>Повторить</Text></TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <Text style={[s.empty, { color: colors.textSecondary }]}>Нет вложений</Text>
      ) : (
        <View style={s.grid}>
          {items.map((a) => (
            <TouchableOpacity key={a.id} style={[s.card, { borderColor: colors.border }]}>
              <Text style={{ fontSize: 32, textAlign: 'center' }}>{a.type === 'image' ? '🖼' : a.type === 'video' ? '🎥' : a.type === 'link' ? '🔗' : '📄'}</Text>
              <Text style={[s.name, { color: colors.textPrimary }]} numberOfLines={1}>{a.name}</Text>
              <Text style={[s.meta, { color: colors.textSecondary }]}>{[a.size, a.date].filter(Boolean).join(' · ')}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({ container: { flex: 1 }, tabs: { flexDirection: 'row', borderBottomWidth: 1 }, tab: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 2 }, tabLabel: {}, empty: { textAlign: 'center', marginTop: 48, fontSize: 14 }, grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', padding: 2, gap: 2 }, card: { width: '33.33%', aspectRatio: 1, padding: 4, borderWidth: 1 }, name: { fontSize: 11, marginTop: 4, fontWeight: '500' }, meta: { fontSize: 10, marginTop: 2 } });
