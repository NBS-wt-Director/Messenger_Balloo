// MediaViewerScreen — fullscreen media viewer
// Mockup: mobile/media-viewer.html (1_08_25)
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';

interface MediaItem { id: string; url: string; type: 'image' | 'video'; caption?: string }

export default function MediaViewerScreen({ route, navigation }: any) {
  const colors = getThemeColors(useUIStore(s => s.theme));
  const [index, setIndex] = useState(route?.params?.index || 0);
  const items: MediaItem[] = route?.params?.items || [];
  const current = items[index];
  return (
    <SafeAreaView style={[s.container, { backgroundColor: '#000' }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()}><Text style={{ color: '#fff', fontSize: 20 }}>✕</Text></TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 14 }}>{index + 1} / {items.length}</Text>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {current ? <Text style={{ color: '#fff', fontSize: 64 }}>{current.type === 'video' ? '🎥' : '🖼'}</Text> : <Text style={{ color: '#888' }}>Нет медиа</Text>}
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
