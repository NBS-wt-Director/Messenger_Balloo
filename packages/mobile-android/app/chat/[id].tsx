// Chat view route — real chat screen (messages via API + WebSocket)

import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import ChatViewScreen from '../../src/screens/ChatViewScreen';
import { useExpoNavigation } from '../../src/router/expoNavigation';

export default function ChatViewRoute() {
  const params = useLocalSearchParams<{ id: string; chatName?: string }>();
  const navigation = useExpoNavigation();

  const route = {
    params: {
      chatId: String(params.id ?? ''),
      chatName: params.chatName ? String(params.chatName) : 'Чат',
    },
  };

  return <ChatViewScreen navigation={navigation} route={route} />;
}