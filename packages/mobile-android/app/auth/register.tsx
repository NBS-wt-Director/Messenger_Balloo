// Register route — real register screen (connected to API)

import React from 'react';
import RegisterScreen from '../../src/screens/auth/RegisterScreen';
import { useExpoNavigation } from '../../src/router/expoNavigation';

export default function RegisterRoute() {
  const navigation = useExpoNavigation();
  return <RegisterScreen navigation={navigation} />;
}