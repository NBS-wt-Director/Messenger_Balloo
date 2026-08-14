// Login screen — placeholder
// Will be implemented in ticket #36

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Balloo</Text>
      <Text style={styles.subtitle}>Вход в аккаунт</Text>
      <Link href="/auth/register" style={styles.link}>
        <Text>Нет аккаунта? Зарегистрироваться</Text>
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
    fontSize: 32,
    color: '#2db84d',
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