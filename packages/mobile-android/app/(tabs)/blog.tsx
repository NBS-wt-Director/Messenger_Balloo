// Blog tab — real blog screen (connected to API)

import React from 'react';
import BlogScreen from '../../src/screens/BlogScreen';
import { useExpoNavigation } from '../../src/router/expoNavigation';

export default function BlogTab() {
  const navigation = useExpoNavigation();
  return <BlogScreen navigation={navigation} />;
}