// ReportMessageScreen — report message for moderation
// Mockup: mobile/report-message.html (1_08_19)
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';

const reasons = ['Спам', 'Домогательство', 'Ненависть', 'Насилие', 'Порнография', 'Авторское право', 'Другое'];

export default function ReportMessageScreen({ route }: any) {
  const colors = getThemeColors(useUIStore(s => s.theme));
  const [selected, setSelected] = useState('');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bg }]}>
      {submitted ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>✅</Text>
          <Text style={[s.title, { color: colors.text }]}>Жалоба отправлена</Text>
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 8 }}>Мы рассмотрим вашу жалобу</Text>
        </View>
      ) : (
        <ScrollView style={s.scroll}>
          <Text style={[s.title, { color: colors.text }]}>🚨 Жалоба на сообщение</Text>
          {reasons.map((r) => (
            <TouchableOpacity key={r} style={[s.reason, { borderBottomColor: colors.border, backgroundColor: selected === r ? colors.accent + '22' : 'transparent' }]} onPress={() => setSelected(r)}>
              <Text style={{ color: selected === r ? colors.accent : colors.text }}>{r}</Text>
            </TouchableOpacity>
          ))}
          <TextInput value={comment} onChangeText={setComment} placeholder="Комментарий (необязательно)" placeholderTextColor={colors.muted} multiline style={[s.input, { backgroundColor: colors.bgSecondary, color: colors.text, borderColor: colors.border, minHeight: 80 }]} />
          <TouchableOpacity style={[s.btn, { backgroundColor: colors.accent, opacity: selected ? 1 : 0.5 }]} onPress={() => { if (!selected) { Alert.alert('Выберите причину'); return; } setSubmitted(true); }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Отправить жалобу</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({ container: { flex: 1 }, scroll: { flex: 1 }, title: { fontSize: 20, fontWeight: '700', padding: 16 }, reason: { padding: 14, borderBottomWidth: 1 }, input: { margin: 16, borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 14 }, btn: { margin: 16, padding: 14, alignItems: 'center', borderRadius: 8 } });
