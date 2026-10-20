// MediaViewerScreen — fullscreen media viewer
// Mockup: mobile/media-viewer.html (1_08_25)
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';
import { api } from '../services/api';

interface MediaItem { id: string; url: string; type: 'image' | 'video'; caption?: string }

export default function MediaViewerScreen({ route, navigation }: any) {
  const colors = getThemeColors(useUIStore(s => s.theme));
  const [index, setIndex] = useState(route?.params?.index || 0);
  const [items, setItems] = useState<MediaItem[]>(route?.params?.items || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatId: string | undefined = route?.params?.chatId;

  // Данные приходят через params; если открыли по chatId — подгружаем
  // галерею чата: GET /api/chats/:id/attachments?type=media
  const load = useCallback(async () => {
    if (items.length > 0 || !chatId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.getChatAttachments(chatId, 'media');
      setItems((Array.isArray(res) ? res : []).map((a: any) => ({
        id: a.id,
        url: a.url,
        type: a.type === 'video' ? 'video' : 'image',
        caption: a.name ?? undefined,
      })));
    } catch (e: any) {
      setError(e?.message || 'Не удалось загрузить медиа');
    } finally {
      setLoading(false);
    }
  }, [chatId, items.length]);

  useEffect(() => { load(); }, [load]);

  const current = items[index];
  return (
    <SafeAreaView style={[s.container, { backgroundColor: '#000' }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()}><Text style={{ color: '#fff', fontSize: 20 }}>✕</Text></TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 14 }}>{items.length > 0 ? `${index + 1} / ${items.length}` : '—'}</Text>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {loading ? <ActivityIndicator color="#fff" /> : current ? <Text style={{ color: '#fff', fontSize: 64 }}>{current.type === 'video' ? '🎥' : '🖼'}</Text> : <Text style={{ color: '#888' }}>{error ?? 'Нет медиа'}</Text>}
      </View>
      {current?.caption && <Text style={{ color: '#fff', padding: 16, textAlign: 'center' }}>{current.caption}</Text>}
      <View style={s.nav}>
        {index > 0 && <TouchableOpacity onPress={() => setIndex(index - 1)}><Text style={{ color: '#fff', fontSize: 24 }}>◀</Text></TouchableOpacity>}
        {index < items.length - 1 && <TouchableOpacity onPress={() => setIndex(index + 1)}><Text style={{ color: '#fff', fontSize: 24 }}>▶</Text></TouchableOpacity>}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({ container: { flex: 1 }, header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 }, nav: { flexDirection: 'row', justifyContent: 'center', gap: 48, padding: 16 } });
