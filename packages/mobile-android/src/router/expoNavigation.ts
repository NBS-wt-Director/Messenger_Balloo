// Navigation shim — адаптер react-navigation API для Expo Router
// Экраны в src/screens/ написаны под react-navigation (props navigation/route).
// Этот шим транслирует navigation.navigate('Name', params) в router.push()
// и navigation.goBack() в router.back(), чтобы переиспользовать экраны без переписывания.

import { useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

export interface ExpoNavigationShim {
  navigate: (name: string, params?: Record<string, any>) => void;
  goBack: () => void;
}

export function useExpoNavigation(): ExpoNavigationShim {
  const router = useRouter();

  const navigate = useCallback(
    (name: string, params?: Record<string, any>) => {
      switch (name) {
        case 'ChatView':
          router.push({
            pathname: '/chat/[id]',
            params: { id: String(params?.chatId ?? ''), chatName: params?.chatName ?? 'Чат' },
          });
          break;
        case 'Register':
          router.push('/auth/register');
          break;
        case 'Login':
          router.push('/auth/login');
          break;
        case 'ResetPassword':
          router.push('/auth/reset-password');
          break;
        case 'TwoFactor':
          router.push({ pathname: '/auth/two-factor', params: params ?? {} });
          break;
        case 'Main':
          router.replace('/(tabs)');
          break;
        // Экраны, которых пока нет в мобильной навигации
        case 'BlogPost':
          Alert.alert('Пост', 'Просмотр отдельного поста будет добавлен позже');
          break;
        case 'CreateGroup':
        case 'Donate':
        case 'Profile':
        case 'Knowledge':
        case 'Hiring':
          Alert.alert('Скоро', `Экран «${name}» в разработке`);
          break;
        default:
          Alert.alert('Навигация', `Экран «${name}» недоступен`);
      }
    },
    [router]
  );

  return useMemo(
    () => ({
      navigate,
      goBack: () => router.back(),
    }),
    [navigate, router]
  );
}
