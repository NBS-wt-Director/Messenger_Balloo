// ChatAttachmentsScreen — chat file/media gallery
// Mockup: mobile/chat-attachments.html (1_08_18)
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';

type Tab = 'images'|'videos'|'files'|'links';
interface Att { id: string; type: 'image'|'video'|'file'|'link'; name: string; size: string; date: string }

export default function ChatAttachmentsScreen({ route }: any) {
  const colors = getThemeColors(useUIStore(s => s.theme));
  const [tab, setTab] = useState<Tab>('images');
  const attachments: Record<Tab, Att[]> = { images: [], videos: [], files: [], links: [] };
  const data = attachments[tab];
  const tabs: { key: Tab; icon: string; label: string }[] = [
    { key: 'images', icon: '🖼', label: 'Фото' }, { key: 'videos', icon: '🎥', label: 'Видео' },
    { key: 'files', icon: '📄', label: 'Файлы' }, { key: 'links', icon: '🔗', label: 'Ссылки' },
  ];
  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bg }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabs}>
        {tabs.map((t) => (
          <TouchableOpacity key={t.key} style={[s.tab, { borderBottomColor: tab === t.key ? colors.accent : 'transparent' }]} onPress={() => setTab(t.key)}>
            <Text style={{ fontSize: 13, color: tab === t.key ? colors.accent : colors.muted }}>{t.icon} {t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {data.length === 0 ? (
        <Text style={[s.empty, { color: colors.muted }]}>Нет вложений</Text>
      ) : (
        <View style={s.grid}>
          {data.map((a) => (
            <TouchableOpacity key={a.id} style={[s.card, { borderColor: colors.border }]}>
              <Text style={{ fontSize: 32, textAlign: 'center' }}>{a.type === 'image' ? '🖼' : a.type === 'video' ? '🎥' : a.type === 'link' ? '🔗' : '📄'}</Text>
              <Text style={[s.name, { color: colors.text }]} numberOfLines={1}>{a.name}</Text>
              <Text style={[s.meta, { color: colors.muted }]}>{a.size} · {a.date}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({ container: { flex: 1 }, tabs: { flexDirection: 'row', borderBottomWidth: 1 }, tab: { padding: '12px 16px', borderBottomWidth: 2 }, tabLabel: {}, empty: { textAlign: 'center', marginTop: 48, fontSize: 14 }, grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', padding: 2, gap: 2 }, card: { width: '33.33%', aspectRatio: 1, padding: 4, borderWidth: 1 }, name: { fontSize: 11, marginTop: 4, fontWeight: '500' }, meta: { fontSize: 10, marginTop: 2 } });
