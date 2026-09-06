// Balloo Messenger — Mobile Register Screen
// Registration form with OAuth, avatar preview, captcha

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors, spacing, fontSize as fontSizes } from '../../styles/theme';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { api, saveAuthTokens } from '../../services/api';

interface RegisterScreenProps {
  navigation: any;
}

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showCodeStep, setShowCodeStep] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useUIStore((s) => s.theme);
  const colors = getThemeColors(theme);
  const { setUser, setAuthenticated } = useAuthStore();

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Ошибка', 'Пароль должен быть минимум 8 символов');
      return;
    }

    setLoading(true);
    try {
      const username = email.split('@')[0];
      const response = await api.register({
        email: email.trim(),
        password,
        username,
        displayName: name.trim(),
      });
      if (response.tokens) {
        await saveAuthTokens(response.tokens);
      }
      setUser(response.user);
      setAuthenticated(true);
      setShowCodeStep(true);
    } catch (error: any) {
      Alert.alert('Ошибка регистрации', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      Alert.alert('Ошибка', 'Введите 6-значный код');
      return;
    }
    try {
      await api.verifyEmail(code);
      Alert.alert('Успех', 'Email подтверждён');
      navigation.navigate('Main');
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
    }
  };

  const handleOAuth = (provider: string) => {
    Alert.alert('OAuth', `${provider} — перенаправление`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Создать аккаунт
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Зарегистрируйтесь в Balloo Messenger
            </Text>
          </View>

          {/* OAuth */}
          <View style={styles.oauthSection}>
            <TouchableOpacity
              style={[styles.oauthBtn, { backgroundColor: '#fc3f1d' }]}
              onPress={() => handleOAuth('Яндекс')}
            >
              <Text style={styles.oauthBtnText}>
                <Text style={{ fontWeight: '800' }}>Y</Text> Через Яндекс
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.oauthBtn, { backgroundColor: '#005ff9' }]}
              onPress={() => handleOAuth('Mail.ru')}
            >
              <Text style={styles.oauthBtnText}>
                <Text style={{ fontWeight: '800' }}>@</Text> Через Mail.ru
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textTertiary }]}>или email</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Name */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Имя</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Иван Иванов"
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Email */}
          <View style={styles.formGroup}>
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
          </View>

          {/* Password */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Пароль</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Минимум 8 символов"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <Text style={[styles.hint, { color: colors.textTertiary }]}>
              Латиница, кириллица, цифры и спецсимволы
            </Text>
          </View>

          {/* Rules agreement */}
          <View style={styles.checkboxRow}>
            <View style={[styles.checkbox, { borderColor: colors.border }]} />
            <Text style={[styles.checkboxLabel, { color: colors.textSecondary }]}>
              Я согласен с <Text style={{ color: colors.accent }}>правилами</Text> и политикой конфиденциальности
            </Text>
          </View>

          {/* Register button */}
          {!showCodeStep ? (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Зарегистрироваться</Text>
              )}
            </TouchableOpacity>
          ) : (
            /* Code verification step */
            <View style={styles.codeSection}>
              <View style={[styles.codeCard, { backgroundColor: colors.bgTertiary, borderLeftColor: colors.accent }]}>
                <Text style={[styles.codeText, { color: colors.textSecondary }]}>
                  📨 На ваш email отправлен код подтверждения
                </Text>
                <TextInput
                  style={[styles.codeInput, { backgroundColor: colors.bgSecondary, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="6-значный код"
                  placeholderTextColor={colors.textTertiary}
                  value={code}
                  onChangeText={setCode}
                  maxLength={6}
                  keyboardType="number-pad"
                />
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
                  onPress={handleVerifyCode}
                >
                  <Text style={styles.primaryBtnText}>Подтвердить</Text>
                </TouchableOpacity>
                <Text style={[styles.resendText, { color: colors.textTertiary }]}>
                  Не пришёл код?{' '}
                  <Text style={{ color: colors.accent }}>Отправить снова</Text> (через 60 сек)
                </Text>
              </View>
            </View>
          )}

          {/* Login link */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Уже есть аккаунт?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.footerLink, { color: colors.accent }]}>Войти</Text>
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
  scrollContent: { padding: 24, flexGrow: 1 },
  header: { alignItems: 'center', marginBottom: 24, marginTop: 16 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center' },
  oauthSection: { gap: 8, marginBottom: 16 },
  oauthBtn: { padding: 14, borderRadius: 8, alignItems: 'center' },
  oauthBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { padding: 14, fontSize: 14, borderWidth: 1, borderRadius: 8 },
  hint: { fontSize: 11, marginTop: 4 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  checkbox: { width: 20, height: 20, borderWidth: 2, borderRadius: 4 },
  checkboxLabel: { fontSize: 13, flex: 1 },
  primaryBtn: { padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  primaryBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  codeSection: { marginBottom: 16 },
  codeCard: { padding: 16, borderLeftWidth: 4, marginBottom: 12 },
  codeText: { fontSize: 13, marginBottom: 12 },
  codeInput: { padding: 14, fontSize: 20, textAlign: 'center', letterSpacing: 8, borderWidth: 1, borderRadius: 8, marginBottom: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  resendText: { fontSize: 12, textAlign: 'center', marginTop: 12 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  footerText: { fontSize: 13 },
  footerLink: { fontSize: 13, fontWeight: '600' },
});