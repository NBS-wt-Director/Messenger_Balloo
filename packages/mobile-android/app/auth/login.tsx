// Login route — real login screen (connected to API)

import React from 'react';
import LoginScreen from '../../src/screens/auth/LoginScreen';
import { useExpoNavigation } from '../../src/router/expoNavigation';

export default function LoginRoute() {
  const navigation = useExpoNavigation();
  return <LoginScreen navigation={navigation} />;
}