// Two-factor authentication screen — placeholder
// Will be implemented in ticket #36

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TwoFactorScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Двухфакторная аутентификация</Text>
      <Text style={styles.subtitle}>Введите код из приложения</Text>
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
    fontSize: 22,
    color: '#e6edf3',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8b949e',
  },
});