// Chats tab — real chat list screen (connected to API)

import React from 'react';
import ChatListScreen from '../../src/screens/ChatListScreen';
import { useExpoNavigation } from '../../src/router/expoNavigation';

export default function ChatListTab() {
  const navigation = useExpoNavigation();
  return <ChatListScreen navigation={navigation} />;
}