// Register screen — placeholder
// Will be implemented in ticket #36

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function RegisterScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Регистрация</Text>
      <Text style={styles.subtitle}>Создайте аккаунт Balloo</Text>
      <Link href="/auth/login" style={styles.link}>
        <Text>Уже есть аккаунт? Войти</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d1117',
  },
  title: {
    fontSize: 28,
    color: '#e6edf3',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8b949e',
    marginBottom: 24,
  },
  link: {
    marginTop: 16,
    color: '#2db84d',
  },
});