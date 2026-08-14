// Balloo Messenger — Mobile Login Screen
// Email/password + OAuth buttons + QR login

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
import { api } from '../../services/api';

interface LoginScreenProps {
  navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useUIStore((s) => s.theme);
  const colors = getThemeColors(theme);
  const { setUser, setTokens, setAuthenticated } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Ошибка', 'Введите email и пароль');
      return;
    }

    setLoading(true);
    try {
      const response = await api.login(email.trim(), password);
      setTokens(response.accessToken, response.refreshToken);
      setUser(response.user);
      setAuthenticated(true);
    } catch (error: any) {
      Alert.alert('Ошибка входа', error.message || 'Проверьте email и пароль');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider: string) => {
    // OAuth flow — will redirect to provider
    Alert.alert('OAuth', `${provider} — перенаправление на страницу авторизации`);
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
          {/* Logo + Title */}
          <View style={styles.header}>
            <View style={[styles.logo, { backgroundColor: colors.accent }]}>
              <Text style={styles.logoText}>B</Text>
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              С возвращением!
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Войдите в свой аккаунт Balloo
            </Text>
          </View>

          {/* OAuth Buttons */}
          <View style={styles.oauthSection}>
            <TouchableOpacity
              style={[styles.oauthBtn, { backgroundColor: '#fc3f1d' }]}
              onPress={() => handleOAuth('Яндекс')}
            >
              <Text style={styles.oauthBtnText}>
                <Text style={{ fontWeight: '800' }}>Y</Text> Войти через Яндекс
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.oauthBtn, { backgroundColor: '#005ff9' }]}
              onPress={() => handleOAuth('Mail.ru')}
            >
              <Text style={styles.oauthBtnText}>
                <Text style={{ fontWeight: '800' }}>@</Text> Войти через Mail.ru
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.oauthBtn, { backgroundColor: '#ffcc00' }]}
              onPress={() => handleOAuth('Rambler')}
            >
              <Text style={[styles.oauthBtnText, { color: '#000' }]}>
                <Text style={{ fontWeight: '800', color: '#000' }}>R</Text> Войти через Rambler
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textTertiary }]}>или</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Email */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.bgTertiary,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="ivan@example.com"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Пароль</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.bgTertiary,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="••••••••"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity onPress={() => navigation.navigate('ResetPassword')}>
              <Text style={[styles.forgotPassword, { color: colors.accent }]}>
                Забыли пароль?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: colors.accent }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Войти</Text>
            )}
          </TouchableOpacity>

          {/* QR Login */}
          <View style={styles.qrSection}>
            <Text style={[styles.qrTitle, { color: colors.textSecondary }]}>
              Уже вошли на другом устройстве?
            </Text>
            <TouchableOpacity
              style={[styles.qrBtn, { backgroundColor: colors.bgTertiary, borderColor: colors.border }]}
              onPress={() => Alert.alert('QR', 'Отсканируйте QR-код с экрана авторизованного устройства')}
            >
              <Text style={[styles.qrBtnText, { color: colors.textPrimary }]}>
                📱 Войти через другое устройство (QR)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Register Link */}
          <View style={styles.registerSection}>
            <Text style={[styles.registerText, { color: colors.textSecondary }]}>
              Нет аккаунта?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.registerLink, { color: colors.accent }]}>
                Зарегистрироваться
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 24,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  oauthSection: {
    gap: 8,
    marginBottom: 16,
  },
  oauthBtn: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  oauthBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    padding: 14,
    fontSize: 14,
    borderWidth: 1,
    borderRadius: 8,
  },
  forgotPassword: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  loginBtn: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrTitle: {
    fontSize: 12,
    marginBottom: 12,
  },
  qrBtn: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    width: '100%',
    alignItems: 'center',
  },
  qrBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerText: {
    fontSize: 13,
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '600',
  },
});