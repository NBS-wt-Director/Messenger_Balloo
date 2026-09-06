// Contacts tab — real contacts screen (connected to API)

import React from 'react';
import ContactsScreen from '../../src/screens/ContactsScreen';
import { useExpoNavigation } from '../../src/router/expoNavigation';

export default function ContactsTab() {
  const navigation = useExpoNavigation();
  return <ContactsScreen navigation={navigation} />;
}