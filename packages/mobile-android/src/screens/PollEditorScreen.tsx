// PollEditorScreen — create poll in chat
// Mockup: mobile/poll-editor.html (1_08_22)
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';
import { api } from '../services/api';

export default function PollEditorScreen({ route, navigation }: any) {
  const colors = getThemeColors(useUIStore(s => s.theme));
  const chatId: string | undefined = route?.params?.chatId ?? route?.params?.id;
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [multiple, setMultiple] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateOption = (i: number, v: string) => setOptions(options.map((o, idx) => idx === i ? v : o));

  // POST /api/polls/chats/:chatId — тело { question, options, allowsMultiple }
  // (packages/server/src/controllers/pollController.ts:16)
  const handleCreate = async () => {
    if (!chatId) { setError('Чат не выбран'); return; }
    if (!question.trim()) { setError('Введите вопрос'); return; }
    const filled = options.map((o) => o.trim()).filter(Boolean);
    if (filled.length < 2) { setError('Нужно минимум 2 непустых варианта'); return; }
    try {
      setLoading(true);
      setError(null);
      await api.createPoll(chatId, { question: question.trim(), options: filled, allowsMultiple: multiple });
      Alert.alert('Готово', 'Опрос создан', [{ text: 'ОК', onPress: () => navigation?.goBack?.() }]);
    } catch (e: any) {
      setError(e?.message || 'Не удалось создать опрос');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bgPrimary }]}>
      <ScrollView style={s.scroll}>
        <Text style={[s.title, { color: colors.textPrimary }]}>📊 Создать опрос</Text>
        <TextInput value={question} onChangeText={(t) => { setQuestion(t); setError(null); }} placeholder="Вопрос" placeholderTextColor={colors.textSecondary} style={[s.input, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]} />
        {options.map((o, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <TextInput value={o} onChangeText={(v) => updateOption(i, v)} placeholder={`Вариант ${i + 1}`} placeholderTextColor={colors.textSecondary} style={[s.input, { flex: 1, backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border, marginBottom: 0 }]} />
            {options.length > 2 && <TouchableOpacity onPress={() => setOptions(options.filter((_, idx) => idx !== i))}><Text style={{ color: '#e53e3e' }}>✕</Text></TouchableOpacity>}
          </View>
        ))}
        {options.length < 10 && <TouchableOpacity onPress={() => setOptions([...options, ''])}><Text style={{ color: colors.accent }}>+ Добавить вариант</Text></TouchableOpacity>}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 8 }}>
          <Switch value={multiple} onValueChange={setMultiple} trackColor={{ true: colors.accent }} />
          <Text style={{ color: colors.textPrimary, fontSize: 14 }}>Несколько ответов</Text>
        </View>
        {error && <Text style={{ color: '#e53e3e', fontSize: 12, marginTop: 12 }}>{error}</Text>}
        <TouchableOpacity style={[s.btn, { backgroundColor: colors.accent, opacity: loading ? 0.6 : 1 }]} onPress={handleCreate} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Создать опрос</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({ container: { flex: 1 }, scroll: { flex: 1 }, title: { fontSize: 20, fontWeight: '700', padding: 16 }, input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 8 }, btn: { marginTop: 24, padding: 14, alignItems: 'center', borderRadius: 8 } });
