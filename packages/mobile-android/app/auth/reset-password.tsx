// Reset password route — real reset password screen (connected to API)

import React from 'react';
import ResetPasswordScreen from '../../src/screens/auth/ResetPasswordScreen';
import { useExpoNavigation } from '../../src/router/expoNavigation';

export default function ResetPasswordRoute() {
  const navigation = useExpoNavigation();
  return <ResetPasswordScreen navigation={navigation} />;
}