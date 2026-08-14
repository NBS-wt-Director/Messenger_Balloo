// Balloo Messenger — Mobile 2FA Screen
// Email-code based 2FA (NOT TOTP, no QR, no backup codes)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../../styles/theme';
import { useUIStore } from '../../store/uiStore';

interface TwoFactorScreenProps {
  navigation: any;
}

export default function TwoFactorScreen({ navigation }: TwoFactorScreenProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState(1); // 1 = send code, 2 = verify
  const [cooldown, setCooldown] = useState(0);
  const theme = useUIStore((s) => s.theme);
  const colors = getThemeColors(theme);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSendCode = () => {
    if (!email.trim()) {
      Alert.alert('Ошибка', 'Введите email');
      return;
    }
    // API: POST /auth/2fa/send-code { email }
    setStep(2);
    setCooldown(60);
    Alert.alert('Отправлено', `Код отправлен на ${email}`);
  };

  const handleVerify = () => {
    if (code.length !== 6) {
      Alert.alert('Ошибка', 'Введите 6-значный код');
      return;
    }
    // API: POST /auth/2fa/verify { email, code }
    Alert.alert('Успех', 'Код подтверждён', [
      { text: 'OK', onPress: () => navigation.navigate('Main') },
    ]);
  };

  const handleDisable = () => {
    Alert.alert(
      'Отключить 2FA',
      'Код подтверждения будет отправлен на email',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>🔐 Двухфакторная аутентификация</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Защитите аккаунт с помощью кода, отправленного на email
            </Text>
          </View>

          {/* Status card */}
          <View style={[styles.statusCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={[styles.statusIcon, { backgroundColor: colors.accent }]}>
              <Text style={styles.statusIconText}>🔐</Text>
            </View>
            <View style={styles.statusInfo}>
              <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>2FA включена</Text>
              <Text style={[styles.statusSubtitle, { color: colors.textSecondary }]}>
                Код отправляется на email при входе
              </Text>
            </View>
            <View style={[styles.statusChip, { backgroundColor: colors.accentLight }]}>
              <Text style={[styles.statusChipText, { color: colors.accent }]}>Активна</Text>
            </View>
          </View>

          {/* Step 1: Send code */}
          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Шаг 1. Отправить код</Text>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="ivan@example.com"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.accent }]} onPress={handleSendCode}>
              <Text style={styles.primaryBtnText}>📨 Отправить код</Text>
            </TouchableOpacity>
          </View>

          {/* Step 2: Verify */}
          {step === 2 && (
            <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Шаг 2. Подтвердить код</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                📨 На ваш email отправлен код подтверждения
              </Text>
              <Text style={[styles.label, { color: colors.textSecondary }]}>6-значный код</Text>
              <TextInput
                style={[styles.codeInput, { backgroundColor: colors.bgTertiary, borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="000 000"
                placeholderTextColor={colors.textTertiary}
                value={code}
                onChangeText={setCode}
                maxLength={6}
                keyboardType="number-pad"
              />
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.accent }]} onPress={handleVerify}>
                <Text style={styles.primaryBtnText}>Подтвердить</Text>
              </TouchableOpacity>
              <Text style={[styles.resendText, { color: colors.textTertiary }]}>
                {cooldown > 0
                  ? `Отправить снова (через ${cooldown} сек)`
                  : 'Не пришёл код? '}
                {cooldown === 0 && (
                  <Text style={{ color: colors.accent }} onPress={handleSendCode}>Отправить снова</Text>
                )}
              </Text>
            </View>
          )}

          {/* Disable 2FA */}
          <View style={[styles.dangerCard, { backgroundColor: colors.bgCard, borderColor: colors.danger }]}>
            <Text style={[styles.dangerTitle, { color: colors.danger }]}>
              ⚠️ Отключение 2FA снизит безопасность аккаунта
            </Text>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Введите код из email для подтверждения</Text>
            <TextInput
              style={[styles.codeInput, { backgroundColor: colors.bgTertiary, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="6-значный код"
              placeholderTextColor={colors.textTertiary}
              maxLength={6}
              keyboardType="number-pad"
            />
            <TouchableOpacity style={[styles.dangerBtn, { backgroundColor: colors.danger }]} onPress={handleDisable}>
              <Text style={styles.dangerBtnText}>Отключить 2FA</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  header: { marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 13 },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderWidth: 1 },
  statusIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  statusIconText: { fontSize: 24 },
  statusInfo: { flex: 1 },
  statusTitle: { fontSize: 14, fontWeight: '700' },
  statusSubtitle: { fontSize: 12, color: '#8b949e' },
  statusChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusChipText: { fontSize: 11, fontWeight: '600' },
  card: { padding: 16, borderWidth: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  cardSubtitle: { fontSize: 13, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { padding: 14, fontSize: 14, borderWidth: 1, marginBottom: 12 },
  primaryBtn: { padding: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  codeInput: { padding: 14, fontSize: 22, textAlign: 'center', letterSpacing: 6, borderWidth: 1, marginBottom: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  resendText: { fontSize: 12, textAlign: 'center' },
  dangerCard: { padding: 16, borderWidth: 1 },
  dangerTitle: { fontSize: 13, marginBottom: 16 },
  dangerBtn: { padding: 14, alignItems: 'center' },
  dangerBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});