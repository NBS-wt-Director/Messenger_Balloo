// Reset password screen — placeholder
// Will be implemented in ticket #36

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ResetPasswordScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Сброс пароля</Text>
      <Text style={styles.subtitle}>Введите email для восстановления</Text>
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
    fontSize: 24,
    color: '#e6edf3',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8b949e',
  },
});