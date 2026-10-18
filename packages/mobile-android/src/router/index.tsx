// Expo Router — mobile navigation
// Stack-based navigation with auth guard + bottom tabs (Chats, Contacts, Blog, Settings)
// Stack navigator for detail screens (ChatView, ChannelView, CreateGroup, BlogPost, KnowledgePage, Stories, Search)

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
import ChannelViewScreen from '../screens/ChannelViewScreen';
import SearchScreen from '../screens/SearchScreen';
import StoriesScreen from '../screens/StoriesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ContactsScreen from '../screens/ContactsScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import BlogScreen from '../screens/BlogScreen';
import KnowledgeScreen from '../screens/KnowledgeScreen';
import HiringScreen from '../screens/HiringScreen';

// New screens (тик. 1792160026)
import CallHistoryScreen from '../screens/CallHistoryScreen';
import MyDevicesScreen from '../screens/MyDevicesScreen';
import AddDeviceScreen from '../screens/AddDeviceScreen';
import DonateScreen from '../screens/DonateScreen';
import ChatAttachmentsScreen from '../screens/ChatAttachmentsScreen';
import ReportMessageScreen from '../screens/ReportMessageScreen';
import MyDonatesScreen from '../screens/MyDonatesScreen';
import ArchiveScreen from '../screens/ArchiveScreen';
import PollEditorScreen from '../screens/PollEditorScreen';
import EmptyChatScreen from '../screens/EmptyChatScreen';
import MediaViewerScreen from '../screens/MediaViewerScreen';
import VoiceRecordScreen from '../screens/VoiceRecordScreen';
import HeaderMenuScreen from '../screens/HeaderMenuScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  TwoFactor: undefined;
  ResetPassword: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  ChatView: { chatId: string; chatName: string };
  ChannelView: { channelId: string; channelName: string };
  Search: undefined;
  Stories: undefined;
  CreateGroup: undefined;
  BlogPost: { postId: string; postTitle: string };
  KnowledgePage: { pageId: string; pageTitle: string };
  Donate: undefined;
  MyDonates: undefined;
  Devices: undefined;
  CallHistory: undefined;
  AddDevice: undefined;
  ChatAttachments: { chatId: string };
  ReportMessage: { messageId: string };
  Archive: undefined;
  PollEditor: { chatId: string };
  EmptyChat: undefined;
  MediaViewer: { items: any[]; index: number };
  VoiceRecord: { chatId: string };
  HeaderMenu: undefined;
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
      <MainStack.Screen name="ChannelView" component={ChannelViewScreen} />
      <MainStack.Screen name="Search" component={SearchScreen} />
      <MainStack.Screen name="Stories" component={StoriesScreen} />
      <MainStack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <MainStack.Screen name="BlogPost" component={BlogScreen} />
      <MainStack.Screen name="KnowledgePage" component={KnowledgeScreen} />
      <MainStack.Screen name="Donate" component={DonateScreen} />
      <MainStack.Screen name="MyDonates" component={MyDonatesScreen} />
      <MainStack.Screen name="Devices" component={MyDevicesScreen} />
      <MainStack.Screen name="CallHistory" component={CallHistoryScreen} />
      <MainStack.Screen name="AddDevice" component={AddDeviceScreen} />
      <MainStack.Screen name="ChatAttachments" component={ChatAttachmentsScreen} />
      <MainStack.Screen name="ReportMessage" component={ReportMessageScreen} />
      <MainStack.Screen name="Archive" component={ArchiveScreen} />
      <MainStack.Screen name="PollEditor" component={PollEditorScreen} />
      <MainStack.Screen name="EmptyChat" component={EmptyChatScreen} />
      <MainStack.Screen name="MediaViewer" component={MediaViewerScreen} />
      <MainStack.Screen name="VoiceRecord" component={VoiceRecordScreen} />
      <MainStack.Screen name="HeaderMenu" component={HeaderMenuScreen} />
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
