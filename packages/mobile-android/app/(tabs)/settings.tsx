// Settings tab — real settings screen

import React from 'react';
import SettingsScreen from '../../src/screens/SettingsScreen';
import { useExpoNavigation } from '../../src/router/expoNavigation';

export default function SettingsTab() {
  const navigation = useExpoNavigation();
  return <SettingsScreen navigation={navigation} />;
}