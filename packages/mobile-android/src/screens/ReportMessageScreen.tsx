// ReportMessageScreen — report message for moderation
// Mockup: mobile/report-message.html (1_08_19)
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';
import { api } from '../services/api';

// Коды причин должны совпадать с VALID_REASONS на сервере
// (packages/server/src/services/reportService.ts:9) — иначе 400 «Неверная причина жалобы»
const reasons: { code: string; label: string }[] = [
  { code: 'spam', label: 'Спам' },
  { code: 'harassment', label: 'Домогательство' },
  { code: 'hate_speech', label: 'Ненависть' },
  { code: 'violence', label: 'Насилие' },
  { code: 'pornography', label: 'Порнография' },
  { code: 'copyright', label: 'Авторское право' },
  { code: 'other', label: 'Другое' },
];

export default function ReportMessageScreen({ route }: any) {
  const colors = getThemeColors(useUIStore(s => s.theme));
  const messageId: string | undefined = route?.params?.messageId;
  const chatId: string | undefined = route?.params?.chatId;
  const reportedUserId: string | undefined = route?.params?.reportedUserId;
  const [selected, setSelected] = useState('');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // POST /api/reports (packages/server/src/routes/reports.ts)
  const handleSubmit = async () => {
    if (!selected) { Alert.alert('Выберите причину'); return; }
    try {
      setLoading(true);
      setError(null);
      await api.createReport({
        messageId,
        reportedUserId,
        chatId,
        reason: selected,
        comment: comment.trim() || undefined,
      });
      setSubmitted(true);
    } catch (e: any) {
      setError(e?.message || 'Не удалось отправить жалобу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bgPrimary }]}>
      {submitted ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>✅</Text>
          <Text style={[s.title, { color: colors.textPrimary }]}>Жалоба отправлена</Text>
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 8 }}>Мы рассмотрим вашу жалобу</Text>
        </View>
      ) : (
        <ScrollView style={s.scroll}>
          <Text style={[s.title, { color: colors.textPrimary }]}>🚨 Жалоба на сообщение</Text>
          {reasons.map((r) => (
            <TouchableOpacity key={r.code} style={[s.reason, { borderBottomColor: colors.border, backgroundColor: selected === r.code ? colors.accent + '22' : 'transparent' }]} onPress={() => { setSelected(r.code); setError(null); }}>
              <Text style={{ color: selected === r.code ? colors.accent : colors.textPrimary }}>{r.label}</Text>
            </TouchableOpacity>
          ))}
          <TextInput value={comment} onChangeText={setComment} placeholder="Комментарий (необязательно)" placeholderTextColor={colors.textSecondary} multiline style={[s.input, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border, minHeight: 80 }]} />
          {error && <Text style={{ color: '#e53e3e', fontSize: 12, marginHorizontal: 16, marginBottom: 8 }}>{error}</Text>}
          <TouchableOpacity style={[s.btn, { backgroundColor: colors.accent, opacity: selected && !loading ? 1 : 0.5 }]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Отправить жалобу</Text>}
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({ container: { flex: 1 }, scroll: { flex: 1 }, title: { fontSize: 20, fontWeight: '700', padding: 16 }, reason: { padding: 14, borderBottomWidth: 1 }, input: { margin: 16, borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 14 }, btn: { margin: 16, padding: 14, alignItems: 'center', borderRadius: 8 } });
