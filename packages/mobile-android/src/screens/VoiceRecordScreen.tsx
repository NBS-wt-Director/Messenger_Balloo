// VoiceRecordScreen — voice message recording overlay
// Mockup: mobile/voice-record.html (1_08_23)
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';
import { api } from '../services/api';

type VState = 'idle' | 'recording' | 'preview' | 'sending';

export default function VoiceRecordScreen({ route, navigation }: any) {
  const colors = getThemeColors(useUIStore(s => s.theme));
  const chatId: string | undefined = route?.params?.chatId;
  // Файл записывает экран-источник: expo-av в зависимости пакета не заявлен,
  // поэтому здесь только загрузка и отправка готового файла (тикет 1792311346).
  const recording: { uri?: string; duration?: number; mimeType?: string } | undefined =
    route?.params?.recording;
  const [state, setState] = useState<VState>('idle');
  const [elapsed, setElapsed] = useState<number>(Number(route?.params?.recording?.duration) || 0);
  const [error, setError] = useState<string | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state !== 'recording') return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.1, duration: 600, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
    ])).start();
    return () => clearInterval(t);
  }, [state]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // Загрузка файла (POST /api/upload/file) и отправка голосового сообщения
  // (POST /api/chats/:id/type=voice) — как в web VoiceMessageModal.sendVoice
  const handleSend = async () => {
    if (!chatId) { setError('Чат не выбран'); return; }
    if (!recording?.uri) {
      setError('Нет записанного файла: запись звука (expo-av) в этой сборке не подключена');
      return;
    }
    try {
      setState('sending');
      setError(null);
      const uploaded = await api.uploadFile({
        uri: recording.uri,
        name: 'voice.m4a',
        type: recording.mimeType || 'audio/m4a',
      });
      const d = uploaded?.data ?? uploaded;
      await api.sendMessage(chatId, {
        type: 'voice',
        content: '',
        attachments: [{
          type: 'audio',
          url: d.url,
          size: Number(d.size) || 0,
          duration: elapsed,
          name: 'voice.m4a',
        }],
      });
      navigation?.goBack?.();
    } catch (e: any) {
      setError(e?.message || 'Не удалось отправить голосовое');
      setState('preview');
    }
  };
  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {state === 'idle' && (<>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>🎤</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700' }}>Нажмите для записи</Text>
          <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Удерживайте для записи голосового</Text>
          <TouchableOpacity style={[s.micBtn, { backgroundColor: colors.accent }]} onPress={() => setState('recording')}><Text style={{ fontSize: 32 }}>🎤</Text></TouchableOpacity>
        </>)}
        {state === 'recording' && (<>
          <Text style={{ fontSize: 48, fontWeight: '800', color: '#e53e3e', fontVariant: ['tabular-nums'] }}>{fmt(elapsed)}</Text>
          <Animated.View style={[s.recDot, { backgroundColor: '#e53e3e', transform: [{ scale: pulse }] }]} />
          <View style={{ flexDirection: 'row', gap: 24, marginTop: 32 }}>
            <TouchableOpacity onPress={() => setState('idle')}><Text style={{ color: colors.textSecondary }}>🗑 Отмена</Text></TouchableOpacity>
            <TouchableOpacity style={[s.stopBtn, { backgroundColor: '#e53e3e' }]} onPress={() => setState('preview')}><Text style={{ fontSize: 24, color: '#fff' }}>⏹</Text></TouchableOpacity>
          </View>
        </>)}
        {state === 'preview' && (<>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 16 }}>🎧 Прослушать</Text>
          <Text style={{ color: colors.textSecondary }}>{fmt(elapsed)}</Text>
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 24 }}>
            <TouchableOpacity style={[s.btn, { backgroundColor: colors.bgSecondary, borderColor: colors.border, borderWidth: 1 }]} onPress={() => setState('recording')}><Text style={{ color: colors.textPrimary }}>🔄 Перезаписать</Text></TouchableOpacity>
            <TouchableOpacity style={[s.btn, { backgroundColor: colors.accent }]} onPress={handleSend}><Text style={{ color: '#fff' }}>➤ Отправить</Text></TouchableOpacity>
          </View>
        </>)}
        {error && <Text style={{ color: '#e53e3e', fontSize: 12, textAlign: 'center', marginTop: 12 }}>{error}</Text>}
        {state === 'sending' && <Text style={{ color: colors.textPrimary, fontSize: 18 }}>📤 Отправка...</Text>}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({ container: { flex: 1 }, micBtn: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginTop: 24 }, recDot: { width: 16, height: 16, borderRadius: 8, marginTop: 16 }, stopBtn: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' }, btn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 } });
