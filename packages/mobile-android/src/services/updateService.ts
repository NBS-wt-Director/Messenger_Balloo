// Update Service — self-update по APK с нашего домена (тикет 1791927977)
//
// Схема: сервер отдаёт GET /api/downloads/android/latest (версия, versionCode,
// url на download.balloo.su). Приложение сравнивает versionCode (главный
// сигнал) и предлагает скачать APK через браузер — Linking.openURL работает
// без нативных зависимостей, Android сам покажет диалог установки.

import Constants from 'expo-constants';
import { Alert, Linking, Platform } from 'react-native';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3100';

export interface LatestRelease {
  platform: string;
  version: string;
  versionCode: number | null;
  url: string;
  size: string;
  checksum: string | null;
  arch: string;
  createdAt: number;
}

export interface LocalVersionInfo {
  version: string;
  versionCode: number;
}

// Текущая версия из app.json (запекается в сборку)
export function getLocalVersion(): LocalVersionInfo {
  return {
    version: Constants.expoConfig?.version ?? '0.0.0',
    versionCode: Constants.expoConfig?.android?.versionCode ?? 0,
  };
}

// Сравнение semver "X.Y.Z[-pre]" по числовым частям. >0 если a новее b
export function compareSemver(a: string, b: string): number {
  const pa = a.split('-')[0].split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('-')[0].split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

// versionCode — главный сигнал (пишется сервером при каждой загрузке APK);
// если на записи его нет (legacy-записи uploadMobile) — fallback на semver
export function isNewerRelease(latest: LatestRelease, local: LocalVersionInfo): boolean {
  if (latest.versionCode != null && local.versionCode > 0) {
    return latest.versionCode > local.versionCode;
  }
  return compareSemver(latest.version, local.version) > 0;
}

// null = 404 (сборок ещё нет), ошибка — throw
export async function fetchLatestRelease(): Promise<LatestRelease | null> {
  const res = await fetch(`${API_BASE}/api/downloads/android/latest?arch=universal`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`android/latest: HTTP ${res.status}`);
  return (await res.json()) as LatestRelease;
}

// Проверка обновлений.
//   interactive=false (при старте): диалог ТОЛЬКО когда есть что скачать;
//     ошибок и «нет обновлений» пользователь не видит.
//   interactive=true (кнопка в Настройках): ответ всегда, включая ошибки.
// Возвращает найденный релиз или null.
export async function checkForUpdates(
  opts: { interactive?: boolean } = {}
): Promise<LatestRelease | null> {
  // APK-путь — только Android (iOS self-update невозможен вне App Store)
  if (Platform.OS !== 'android') return null;

  const { interactive = false } = opts;

  try {
    const latest = await fetchLatestRelease();
    const local = getLocalVersion();

    if (!latest) {
      if (interactive) {
        Alert.alert('Обновлений нет', 'Сервер ещё не опубликовал ни одной сборки.');
      }
      return null;
    }

    if (!isNewerRelease(latest, local)) {
      if (interactive) {
        Alert.alert('Вы используете последнюю версию', `Установлена версия ${local.version}.`);
      }
      return null;
    }

    Alert.alert(
      'Есть обновление',
      `Доступен Balloo ${latest.version} (у вас ${local.version}).\n\nСкачать через браузер? Android предложит разрешить установку из этого источника.`,
      [
        { text: 'Позже', style: 'cancel' },
        { text: 'Скачать', onPress: () => Linking.openURL(latest.url) },
      ]
    );
    return latest;
  } catch {
    if (interactive) {
      Alert.alert('Не удалось проверить обновления', 'Проверьте интернет-соединение и попробуйте позже.');
    }
    return null;
  }
}
