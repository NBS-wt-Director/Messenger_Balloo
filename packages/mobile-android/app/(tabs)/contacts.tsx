// Contacts screen — placeholder
// Will be implemented in ticket #36

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ContactsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Контакты</Text>
      <Text style={styles.subtitle}>Список контактов будет здесь</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    color: '#e6edf3',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#8b949e',
  },
});