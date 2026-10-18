// PollEditorScreen — create poll in chat
// Mockup: mobile/poll-editor.html (1_08_22)
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';

export default function PollEditorScreen({ route }: any) {
  const colors = getThemeColors(useUIStore(s => s.theme));
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [multiple, setMultiple] = useState(false);
  const updateOption = (i: number, v: string) => setOptions(options.map((o, idx) => idx === i ? v : o));
  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bg }]}>
      <ScrollView style={s.scroll}>
        <Text style={[s.title, { color: colors.text }]}>📊 Создать опрос</Text>
        <TextInput value={question} onChangeText={setQuestion} placeholder="Вопрос" placeholderTextColor={colors.muted} style={[s.input, { backgroundColor: colors.bgSecondary, color: colors.text, borderColor: colors.border }]} />
        {options.map((o, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <TextInput value={o} onChangeText={(v) => updateOption(i, v)} placeholder={`Вариант ${i + 1}`} placeholderTextColor={colors.muted} style={[s.input, { flex: 1, backgroundColor: colors.bgSecondary, color: colors.text, borderColor: colors.border, marginBottom: 0 }]} />
            {options.length > 2 && <TouchableOpacity onPress={() => setOptions(options.filter((_, idx) => idx !== i))}><Text style={{ color: '#e53e3e' }}>✕</Text></TouchableOpacity>}
          </View>
        ))}
        {options.length < 10 && <TouchableOpacity onPress={() => setOptions([...options, ''])}><Text style={{ color: colors.accent }}>+ Добавить вариант</Text></TouchableOpacity>}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 8 }}>
          <Switch value={multiple} onValueChange={setMultiple} trackColor={{ true: colors.accent }} />
          <Text style={{ color: colors.text, fontSize: 14 }}>Несколько ответов</Text>
        </View>
        <TouchableOpacity style={[s.btn, { backgroundColor: colors.accent }]}><Text style={{ color: '#fff', fontWeight: '600' }}>Создать опрос</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({ container: { flex: 1 }, scroll: { flex: 1 }, title: { fontSize: 20, fontWeight: '700', padding: 16 }, input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 8 }, btn: { marginTop: 24, padding: 14, alignItems: 'center', borderRadius: 8 } });
