// ThemedBackground — фон экрана с учётом темы.
// Тема russian: градиент флага РФ 45° поверх тёмной базы (паритет с web:
// packages/web/src/styles/themes.css, [data-theme='russian'] body — те же
// цвета и доли прозрачности). Остальные темы — плоский bgPrimary.

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getThemeColors, Theme } from '../styles/theme';

interface ThemedBackgroundProps {
  theme: Theme;
  children: React.ReactNode;
}

export default function ThemedBackground({ theme, children }: ThemedBackgroundProps) {
  const colors = getThemeColors(theme);

  if (theme !== 'russian') {
    return <View style={[styles.fill, { backgroundColor: colors.bgPrimary }]}>{children}</View>;
  }

  // База #0a0c10 = --bg-primary темы russian в web; градиент — поверх неё.
  // RN LinearGradient не поддерживает rgba-стопы поверх непрозрачного слоя
  // в одном проходе, поэтому эмулируем: непрозрачная база + градиент из
  // полупрозрачных цветов флага (тот же визуальный результат).
  return (
    <View style={[styles.fill, { backgroundColor: '#0a0c10' }]}>
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0.22)',
          'rgba(0, 57, 166, 0.38)',
          'rgba(213, 43, 30, 0.42)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
