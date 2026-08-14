// Balloo Messenger — Mobile Reset Password Screen
// 4-step flow: email → captcha → check email → new password

import React, { useState } from 'react';
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
import { api } from '../../services/api';

interface ResetPasswordScreenProps {
  navigation: any;
}

export default function ResetPasswordScreen({ navigation }: ResetPasswordScreenProps) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useUIStore((s) => s.theme);
  const colors = getThemeColors(theme);

  const handleRequestReset = async () => {
    if (!email.trim()) {
      Alert.alert('Ошибка', 'Введите email');
      return;
    }
    setStep(2);
  };

  const handleCaptchaSubmit = async () => {
    if (!captcha.trim()) {
      Alert.alert('Ошибка', 'Введите код с картинки');
      return;
    }
    setLoading(true);
    try {
      await api.requestPasswordReset(email.trim());
      setStep(3);
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      Alert.alert('Ошибка', 'Пароль должен быть минимум 8 символов');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Ошибка', 'Пароли не совпадают');
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword('reset-token', newPassword);
      Alert.alert('Успех', 'Пароль сброшен', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🔑</Text>
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Восстановление пароля</Text>

          {/* Step 1: Email */}
          {step === 1 && (
            <View style={styles.step}>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                Введите email — мы отправим ссылку для сброса пароля
              </Text>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="your@email.com"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.accent }]} onPress={handleRequestReset}>
                <Text style={styles.primaryBtnText}>Далее</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.backLink, { color: colors.accent }]}>← Вернуться ко входу</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: Captcha */}
          {step === 2 && (
            <View style={styles.step}>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                Подтвердите, что вы не робот
              </Text>
              <View style={[styles.captchaCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <View style={[styles.captchaDisplay, { backgroundColor: '#2d6a4f' }]}>
                  {['A', '7', 'К', 'м', '2', 'р'].map((char, i) => (
                    <Text
                      key={i}
                      style={[
                        styles.captchaChar,
                        {
                          transform: [{ rotate: `${[-20, 15, -10, 25, -5, 10][i]}deg` }],
                          left: 8 + i * 32,
                          top: 10 + Math.floor(Math.random() * 12),
                        },
                      ]}
                    >
                      {char}
                    </Text>
                  ))}
                </View>
                <Text style={[styles.captchaHint, { color: colors.textTertiary }]}>
                  Введите 6 символов, показанных на картинке
                </Text>
                <View style={styles.captchaInputRow}>
                  <TextInput
                    style={[styles.captchaInput, { backgroundColor: colors.bgTertiary, borderColor: colors.border, color: colors.textPrimary }]}
                    placeholder="Введите капчу"
                    placeholderTextColor={colors.textTertiary}
                    value={captcha}
                    onChangeText={setCaptcha}
                    maxLength={6}
                  />
                  <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: colors.bgTertiary, borderColor: colors.border }]}>
                    <Text style={[styles.secondaryBtnText, { color: colors.textPrimary }]}>Другой</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.accent }]} onPress={handleCaptchaSubmit}>
                <Text style={styles.primaryBtnText}>Отправить ссылку</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep(1)}>
                <Text style={[styles.backLink, { color: colors.accent }]}>← Назад</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 3: Check email */}
          {step === 3 && (
            <View style={styles.step}>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                Письмо отправлено. Перейдите по ссылке в письме, чтобы задать новый пароль.
              </Text>
              <View style={[styles.emailCard, { backgroundColor: colors.bgTertiary }]}>
                <Text style={[styles.emailText, { color: colors.textSecondary }]}>
                  📧 Проверьте почту: <Text style={[styles.emailStrong, { color: colors.textPrimary }]}>{email}</Text>
                </Text>
                <Text style={[styles.emailHint, { color: colors.textTertiary }]}>
                  Ссылка действительна 1 час
                </Text>
              </View>
              <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: colors.bgTertiary, borderColor: colors.border }]} onPress={() => setStep(4)}>
                <Text style={[styles.secondaryBtnText, { color: colors.textPrimary }]}>Я перешёл по ссылке</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tertiaryBtn, { borderColor: colors.border }]}>
                <Text style={[styles.tertiaryBtnText, { color: colors.accent }]}>Отправить повторно</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 4: New password */}
          {step === 4 && (
            <View style={styles.step}>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                Придумайте новый пароль
              </Text>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Новый пароль</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textTertiary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <Text style={[styles.hint, { color: colors.textTertiary }]}>Минимум 8 символов, цифры и буквы</Text>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Повторите пароль</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textTertiary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.accent }]} onPress={handleResetPassword}>
                <Text style={styles.primaryBtnText}>Сбросить пароль</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { padding: 24, flexGrow: 1 },
  iconContainer: { alignItems: 'center', marginBottom: 16, marginTop: 24 },
  icon: { fontSize: 48 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 24 },
  step: { gap: 16 },
  stepSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { padding: 14, fontSize: 14, borderWidth: 1 },
  hint: { fontSize: 11, marginTop: 2 },
  primaryBtn: { padding: 16, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { padding: 14, alignItems: 'center', borderWidth: 1 },
  secondaryBtnText: { fontSize: 14, fontWeight: '600' },
  tertiaryBtn: { padding: 14, alignItems: 'center', borderWidth: 1 },
  tertiaryBtnText: { fontSize: 14, fontWeight: '600' },
  backLink: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  captchaCard: { padding: 20, borderWidth: 1, marginBottom: 8 },
  captchaDisplay: { height: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 12, position: 'relative' },
  captchaChar: { position: 'absolute', fontSize: 24, fontWeight: '800', fontFamily: 'monospace', color: '#d8f3dc', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4 },
  captchaHint: { fontSize: 12, textAlign: 'center', marginBottom: 12 },
  captchaInputRow: { flexDirection: 'row', gap: 8 },
  captchaInput: { flex: 1, padding: 12, fontSize: 14, borderWidth: 1, textAlign: 'center' },
  emailCard: { padding: 16, marginBottom: 8 },
  emailText: { fontSize: 13 },
  emailStrong: { fontWeight: '700' },
  emailHint: { fontSize: 12, marginTop: 8 },
});