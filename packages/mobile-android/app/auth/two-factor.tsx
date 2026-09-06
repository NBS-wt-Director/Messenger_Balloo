// Two-factor authentication route — real 2FA screen (connected to API)

import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import TwoFactorScreen from '../../src/screens/auth/TwoFactorScreen';
import { useExpoNavigation } from '../../src/router/expoNavigation';

export default function TwoFactorRoute() {
  const params = useLocalSearchParams<{ email?: string }>();
  const navigation = useExpoNavigation();

  // TwoFactorScreen работает с email через внутреннее состояние;
  // предзаполняем его, если email передан из экрана логина
  return <TwoFactorWithPrefill email={params.email ? String(params.email) : ''} navigation={navigation} />;
}

function TwoFactorWithPrefill({
  email,
  navigation,
}: {
  email: string;
  navigation: ReturnType<typeof useExpoNavigation>;
}) {
  return <TwoFactorScreen navigation={navigation} initialEmail={email} />;
}