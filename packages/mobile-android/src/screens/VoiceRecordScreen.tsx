// VoiceRecordScreen — voice message recording overlay
// Mockup: mobile/voice-record.html (1_08_23)
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';

type VState = 'idle' | 'recording' | 'preview' | 'sending';

export default function VoiceRecordScreen({ navigation }: any) {
  const colors = getThemeColors(useUIStore(s => s.theme));
  const [state, setState] = useState<VState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state !== 'recording') return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1.1, duration: 600 }), Animated.timing(pulse, { toValue: 1, duration: 600 })])).start();
    return () => clearInterval(t);
  }, [state]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bg }]}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {state === 'idle' && (<>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>🎤</Text>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>Нажмите для записи</Text>
          <Text style={{ color: colors.muted, marginTop: 8 }}>Удерживайте для записи голосового</Text>
          <TouchableOpacity style={[s.micBtn, { backgroundColor: colors.accent }]} onPress={() => setState('recording')}><Text style={{ fontSize: 32 }}>🎤</Text></TouchableOpacity>
        </>)}
        {state === 'recording' && (<>
          <Text style={{ fontSize: 48, fontWeight: '800', color: '#e53e3e', fontVariant: ['tabular-nums'] }}>{fmt(elapsed)}</Text>
          <Animated.View style={[s.recDot, { backgroundColor: '#e53e3e', transform: [{ scale: pulse }] }]} />
          <View style={{ flexDirection: 'row', gap: 24, marginTop: 32 }}>
            <TouchableOpacity onPress={() => setState('idle')}><Text style={{ color: colors.muted }}>🗑 Отмена</Text></TouchableOpacity>
            <TouchableOpacity style={[s.stopBtn, { backgroundColor: '#e53e3e' }]} onPress={() => setState('preview')}><Text style={{ fontSize: 24, color: '#fff' }}>⏹</Text></TouchableOpacity>
          </View>
        </>)}
        {state === 'preview' && (<>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 16 }}>🎧 Прослушать</Text>
          <Text style={{ color: colors.muted }}>{fmt(elapsed)}</Text>
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 24 }}>
            <TouchableOpacity style={[s.btn, { backgroundColor: colors.bgSecondary, borderColor: colors.border, borderWidth: 1 }]} onPress={() => setState('recording')}><Text style={{ color: colors.text }}>🔄 Перезаписать</Text></TouchableOpacity>
            <TouchableOpacity style={[s.btn, { backgroundColor: colors.accent }]} onPress={() => { setState('sending'); setTimeout(() => navigation?.goBack?.(), 1500); }}><Text style={{ color: '#fff' }}>➤ Отправить</Text></TouchableOpacity>
          </View>
        </>)}
        {state === 'sending' && <Text style={{ color: colors.text, fontSize: 18 }}>📤 Отправка...</Text>}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({ container: { flex: 1 }, micBtn: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginTop: 24 }, recDot: { width: 16, height: 16, borderRadius: 8, marginTop: 16 }, stopBtn: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' }, btn: { padding: '12px 20px', borderRadius: 8 } });
