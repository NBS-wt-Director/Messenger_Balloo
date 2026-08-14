// Main tabs layout — bottom tab navigator
// Will be fully implemented in ticket #36-37

import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#161b22',
          borderTopColor: '#30363d',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#2db84d',
        tabBarInactiveTintColor: '#8b949e',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Чаты',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>💬</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Контакты',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>👤</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="blog"
        options={{
          title: 'Блог',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>📝</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Настройки',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>⚙️</Text>
          ),
        }}
      />
    </Tabs>
  );
}