// Expo Router — mobile navigation
// Stack-based navigation with auth guard + bottom tabs (Chats, Contacts, Blog, Settings)
// Stack navigator for detail screens (ChatView, CreateGroup, BlogPost, KnowledgePage, etc.)

import React from 'react';
import { useAuthStore } from '../store/authStore';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import TwoFactorScreen from '../screens/auth/TwoFactorScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';

// Main screens
import ChatListScreen from '../screens/ChatListScreen';
import ChatViewScreen from '../screens/ChatViewScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ContactsScreen from '../screens/ContactsScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import BlogScreen from '../screens/BlogScreen';
import KnowledgeScreen from '../screens/KnowledgeScreen';
import HiringScreen from '../screens/HiringScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  TwoFactor: undefined;
  ResetPassword: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  ChatView: { chatId: string; chatName: string };
  CreateGroup: undefined;
  BlogPost: { postId: string; postTitle: string };
  KnowledgePage: { pageId: string; pageTitle: string };
  Donate: undefined;
  MyDonates: undefined;
  Devices: undefined;
};

export type TabParamList = {
  ChatsTab: undefined;
  ContactsTab: undefined;
  BlogTab: undefined;
  SettingsTab: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="TwoFactor" component={TwoFactorScreen} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabNavigator() {
  const theme = useUIStore((s) => s.theme);
  const colors = getThemeColors(theme);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgSecondary,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 56,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 10 },
      }}
    >
      <Tab.Screen
        name="ChatsTab"
        component={ChatListScreen}
        options={{ tabBarLabel: '💬 Чаты' }}
      />
      <Tab.Screen
        name="ContactsTab"
        component={ContactsScreen}
        options={{ tabBarLabel: '👥 Контакты' }}
      />
      <Tab.Screen
        name="BlogTab"
        component={BlogScreen}
        options={{ tabBarLabel: '📝 Блог' }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{ tabBarLabel: '⚙ Настройки' }}
      />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="MainTabs" component={MainTabNavigator} />
      <MainStack.Screen name="ChatView" component={ChatViewScreen} />
      <MainStack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <MainStack.Screen name="BlogPost" component={BlogScreen} />
      <MainStack.Screen name="KnowledgePage" component={KnowledgeScreen} />
      <MainStack.Screen name="Donate" component={ProfileScreen} />
      <MainStack.Screen name="MyDonates" component={ProfileScreen} />
      <MainStack.Screen name="Devices" component={ProfileScreen} />
    </MainStack.Navigator>
  );
}

export default function RootLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const theme = useUIStore((s) => s.theme);
  const colors = getThemeColors(theme);

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
