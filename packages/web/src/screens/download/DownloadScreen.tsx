// DownloadScreen — главная страница загрузок
// Тикет №57 — Download (узел 06)
// Макет: mockups/download-balloo-su/downloads.html

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { PlatformCard } from './components/PlatformCard';
import { AutoDetectBanner } from './components/AutoDetectBanner';
import { QRCode } from './components/QRCode';
import { SystemRequirements, type SystemRequirement } from './components/SystemRequirements';
import { InstallInstructions } from './components/InstallInstructions';
import { UpdateInstructions } from './components/UpdateInstructions';
import { AndroidArchSelector } from './components/AndroidArchSelector';
import { PackageOption, type PackageData } from './components/PackageOption';

// ============================================================
// Детекция платформы по User-Agent
// ============================================================
function detectPlatform(): string {
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return 'android';
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/win/.test(ua)) return 'win';
  if (/mac/.test(ua)) return 'mac';
  if (/linux/.test(ua)) return 'linux';
  return '';
}

const PLATFORM_LABELS: Record<string, string> = {
  win: 'Windows',
  linux: 'Linux',
  mac: 'macOS',
  android: 'Android',
  ios: 'iOS',
};

// ============================================================
// Дефолтные пакеты (fallback, если БД пуста)
// ============================================================
const DEFAULT_WIN: PackageData[] = [
  { format: 'exe', label: 'Balloo Setup.exe', icon: '⚙️', recommended: true, url: 'https://download.balloo.su/win/BallooSetup.exe', size: 82000000, version: '1.0.0' },
  { format: 'msi', label: 'Balloo.msi', icon: '🏢', url: 'https://download.balloo.su/win/Balloo.msi', size: 78000000, version: '1.0.0' },
  { format: 'zip', label: 'Balloo Portable.zip', icon: '📦', url: 'https://download.balloo.su/win/BallooPortable.zip', size: 90000000, version: '1.0.0' },
];

const DEFAULT_LINUX: PackageData[] = [
  { format: 'appimage', label: 'Balloo.AppImage', icon: '🐧', recommended: true, url: 'https://download.balloo.su/linux/Balloo.AppImage', size: 76000000, version: '1.0.0' },
  { format: 'deb', label: 'balloo.deb', icon: ' Debian', url: 'https://download.balloo.su/linux/balloo.deb', size: 74000000, version: '1.0.0' },
  { format: 'rpm', label: 'balloo.rpm', icon: '🎩', url: 'https://download.balloo.su/linux/balloo.rpm', size: 75000000, version: '1.0.0' },
  { format: 'tar.gz', label: 'Balloo Portable.tar.gz', icon: '📦', url: 'https://download.balloo.su/linux/BallooPortable.tar.gz', size: 80000000, version: '1.0.0' },
];

const DEFAULT_MAC: PackageData[] = [
  { format: 'dmg', label: 'Balloo.dmg', icon: '🍎', recommended: true, url: 'https://download.balloo.su/mac/Balloo.dmg', size: 85000000, version: '1.0.0' },
  { format: 'zip', label: 'Balloo.zip', icon: '📦', url: 'https://download.balloo.su/mac/Balloo.zip', size: 88000000, version: '1.0.0' },
];

const DEFAULT_ANDROID: PackageData[] = [
  { format: 'apk', arch: 'universal', label: 'Balloo Universal.apk', icon: '🌍', recommended: true, url: 'https://download.balloo.su/android/balloo-universal.apk', size: 50000000, version: '1.0.0' },
  { format: 'apk', arch: 'arm64-v8a', label: 'Balloo ARM64.apk', icon: '📱', url: 'https://download.balloo.su/android/balloo-arm64.apk', size: 35000000, version: '1.0.0' },
  { format: 'apk', arch: 'armeabi-v7a', label: 'Balloo ARM32.apk', icon: '📲', url: 'https://download.balloo.su/android/balloo-arm32.apk', size: 30000000, version: '1.0.0' },
  { format: 'apk', arch: 'x86_64', label: 'Balloo x86_64.apk', icon: '💻', url: 'https://download.balloo.su/android/balloo-x86_64.apk', size: 38000000, version: '1.0.0' },
  { format: 'aab', arch: 'universal', label: 'Balloo.aab (Google Play)', icon: '📦', url: 'https://download.balloo.su/android/balloo.aab', size: 45000000, version: '1.0.0' },
];

const SYSTEM_REQUIREMENTS: SystemRequirement[] = [
  { platform: 'Windows', os: 'Windows 10/11 (x64)', ram: '4 ГБ', disk: '200 МБ' },
  { platform: 'Linux', os: 'Ubuntu 20.04+, Fedora 35+', ram: '4 ГБ', disk: '200 МБ' },
  { platform: 'macOS', os: 'macOS 12 Monterey+', ram: '4 ГБ', disk: '200 МБ', extra: 'Apple Silicon + Intel' },
  { platform: 'Android', os: 'Android 8.0 (Oreo, API 26)+', ram: '2 ГБ (реком. 4 ГБ)', disk: '200 МБ', extra: 'ARM64/ARM32/x86_64' },
  { platform: 'iOS', os: 'iOS 14+', ram: '2 ГБ', disk: '100 МБ' },
  { platform: 'PWA', os: 'Chrome 90+, Edge 90+, Safari 14+', ram: '—', disk: '50 МБ (кэш)' },
];

const ANDROID_REQUIREMENTS: SystemRequirement[] = [
  { platform: 'Android', os: 'Android 8.0 (Oreo, API 26) или выше', ram: 'от 2 ГБ (рекомендуется 4 ГБ+)', disk: 'от 200 МБ', extra: 'ARM64, ARM32 или x86_64' },
];

const DOWNLOAD_URL = 'https://download.balloo.su';
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=su.balloo';
const APP_STORE_URL = 'https://apps.apple.com/app/balloo/id000000000';

export function DownloadScreen() {
  const navigate = useNavigate();
  const detected = useMemo(() => detectPlatform(), []);

  const [winPackages, setWinPackages] = useState<PackageData[]>(DEFAULT_WIN);
  const [linuxPackages, setLinuxPackages] = useState<PackageData[]>(DEFAULT_LINUX);
  const [macPackages, setMacPackages] = useState<PackageData[]>(DEFAULT_MAC);
  const [androidPackages, setAndroidPackages] = useState<PackageData[]>(DEFAULT_ANDROID);
  const [selectedAndroidArch, setSelectedAndroidArch] = useState('universal');
  const [loading, setLoading] = useState(true);

  // Загрузка пакетов из API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await api.getDownloads();

        // Маппинг API-данных на дефолтные пакеты (обогащаем url/size/checksum/version)
        const enrich = (defaults: PackageData[], apiPkgs: any[]): PackageData[] => {
          if (!apiPkgs || apiPkgs.length === 0) return defaults;
          return defaults.map((d) => {
            // Ищем совпадение по платформе-формату (platform: "win-exe", "linux-appimage" и т.д.)
            const match = apiPkgs.find((a) => {
              const plat = (a.platform || '').toLowerCase();
              return plat.includes(d.format) || plat.includes(d.arch || '');
            });
            if (match) {
              return {
                ...d,
                id: match.id,
                url: match.url || d.url,
                size: match.size || d.size,
                checksum: match.checksum || d.checksum,
                version: match.version || d.version,
                createdAt: match.createdAt,
              };
            }
            return d;
          });
        };

        if (cancelled) return;
        setWinPackages(enrich(DEFAULT_WIN, data.desktop?.win || []));
        setLinuxPackages(enrich(DEFAULT_LINUX, data.desktop?.linux || []));
        setMacPackages(enrich(DEFAULT_MAC, data.desktop?.mac || []));
        setAndroidPackages(enrich(DEFAULT_ANDROID, data.mobile?.android || []));
      } catch (error) {
        console.error('Ошибка загрузки пакетов:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Фильтр Android-пакетов по выбранной архитектуре (для APK)
  const androidApkByArch = androidPackages.filter(
    (p) => p.format === 'apk' && (p.arch === selectedAndroidArch || (selectedAndroidArch === 'universal' && p.arch === 'universal'))
  );
  const androidAab = androidPackages.filter((p) => p.format === 'aab');

  const handleSelectPackage = (pkg: PackageData) => {
    // Переход на экран прогресса
    navigate('/download/progress', {
      state: {
        label: pkg.label,
        url: pkg.url,
        size: pkg.size,
        version: pkg.version,
        checksum: pkg.checksum,
        format: pkg.format,
      },
    });
  };

  const scrollToPlatform = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="main">
      <div className="content overflow-y-auto">
        <div className="page-container">
          {/* Hero */}
          <h1 className="page-title">⬇️ Скачать Balloo</h1>
          <p className="page-subtitle">Версия 1.0.0-beta · 30 июля 2026</p>

          {/* Автоопределение */}
          {detected && (
            <AutoDetectBanner
              platform={detected}
              platformLabel={PLATFORM_LABELS[detected] || detected}
              onDownload={() =>
                scrollToPlatform(
                  ['win', 'linux', 'mac'].includes(detected) ? 'desktop' : 'mobile'
                )
              }
            />
          )}

          {/* Desktop */}
          <div className="section-title" id="desktop">
            💻 Для компьютера
          </div>
          <div
            className="flex gap-4 mb-6"
            style={{ flexWrap: 'wrap', alignItems: 'stretch' }}
          >
            <PlatformCard
              icon="🪟"
              title="Windows"
              subtitle="Windows 10/11 (x64)"
              packages={winPackages}
              highlighted={detected === 'win'}
              onSelect={handleSelectPackage}
            >
              <InstallInstructions platform="win" />
            </PlatformCard>

            <PlatformCard
              icon="🐧"
              title="Linux"
              subtitle="AppImage / Deb / RPM / Portable"
              packages={linuxPackages}
              highlighted={detected === 'linux'}
              onSelect={handleSelectPackage}
            >
              <InstallInstructions platform="linux" />
            </PlatformCard>

            <PlatformCard
              icon="🍎"
              title="macOS"
              subtitle="macOS 12+ (Universal)"
              packages={macPackages}
              highlighted={detected === 'mac'}
              onSelect={handleSelectPackage}
            >
              <InstallInstructions platform="mac" />
            </PlatformCard>
          </div>

          {/* Mobile */}
          <div className="section-title" id="mobile">
            📱 Для телефона
          </div>
          <div
            className="flex gap-4 mb-6"
            style={{ flexWrap: 'wrap', alignItems: 'stretch' }}
          >
            {/* Android — подробная карточка */}
            <div
              className="card card--hover"
              style={{
                flex: 1,
                minWidth: '320px',
                padding: '24px',
                borderColor: detected === 'android' ? 'var(--accent)' : undefined,
                boxShadow: detected === 'android' ? '0 0 0 2px var(--accent)' : undefined,
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '48px' }}>🤖</div>
                <h3 className="card__title mt-2">Android</h3>
                <div className="text-sm text-muted">Android 8.0+ · APK / AAB</div>
                {detected === 'android' && (
                  <span
                    className="badge"
                    style={{
                      display: 'inline-block',
                      marginTop: '8px',
                      background: 'var(--accent)',
                      color: '#fff',
                      padding: '2px 10px',
                      fontSize: '11px',
                    }}
                  >
                    ✓ Ваша платформа
                  </span>
                )}
              </div>

              {/* Селектор архитектуры */}
              <AndroidArchSelector
                packages={androidPackages}
                selectedArch={selectedAndroidArch}
                onSelect={setSelectedAndroidArch}
              />

              {/* Пакет для выбранной архитектуры */}
              {androidApkByArch.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  {androidApkByArch.map((pkg, i) => (
                    <PackageOption
                      key={i}
                      pkg={{
                        ...pkg,
                        recommended: selectedAndroidArch === 'universal',
                      }}
                      onSelect={handleSelectPackage}
                    />
                  ))}
                </div>
              )}

              {/* AAB */}
              {androidAab.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  {androidAab.map((pkg, i) => (
                    <PackageOption key={i} pkg={pkg} onSelect={handleSelectPackage} />
                  ))}
                </div>
              )}

              {/* Google Play */}
              <a
                href={GOOGLE_PLAY_URL}
                className="btn btn--primary btn--block"
                style={{ marginBottom: '8px' }}
              >
                🏪 Google Play →
              </a>

              {/* Инструкции */}
              <InstallInstructions platform="android" />
              <UpdateInstructions platform="android" />

              {/* Системные требования Android */}
              <SystemRequirements
                requirements={ANDROID_REQUIREMENTS}
                title="⚙️ Системные требования Android"
              />
            </div>

            {/* iOS */}
            <div
              className="card card--hover"
              style={{
                flex: 1,
                minWidth: '280px',
                padding: '24px',
                borderColor: detected === 'ios' ? 'var(--accent)' : undefined,
                boxShadow: detected === 'ios' ? '0 0 0 2px var(--accent)' : undefined,
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '48px' }}>🍎</div>
                <h3 className="card__title mt-2">iOS</h3>
                <div className="text-sm text-muted">iOS 14+ · App Store</div>
                {detected === 'ios' && (
                  <span
                    className="badge"
                    style={{
                      display: 'inline-block',
                      marginTop: '8px',
                      background: 'var(--accent)',
                      color: '#fff',
                      padding: '2px 10px',
                      fontSize: '11px',
                    }}
                  >
                    ✓ Ваша платформа
                  </span>
                )}
              </div>

              <a
                href={APP_STORE_URL}
                className="btn btn--primary btn--block"
                style={{ marginBottom: '8px' }}
              >
                🏪 App Store →
              </a>
              <div className="text-xs text-muted" style={{ textAlign: 'center', marginBottom: '12px' }}>
                Инструкция: Откройте App Store → Найдите Balloo → Установите
              </div>
              <div className="text-xs text-muted" style={{ textAlign: 'center', marginBottom: '12px' }}>
                TestFlight доступен для бета-тестирования
              </div>

              <InstallInstructions platform="ios" />
              <UpdateInstructions platform="ios" />
            </div>

            {/* PWA */}
            <div
              className="card card--hover"
              style={{ flex: 1, minWidth: '280px', padding: '24px', textAlign: 'center' }}
            >
              <div style={{ fontSize: '48px' }}>🌐</div>
              <h3 className="card__title mt-2">PWA</h3>
              <div className="text-sm text-muted">
                Progressive Web App
                <br />
                Установка из браузера
              </div>
              <a
                href="https://balloo.su"
                className="btn btn--primary btn--block mt-4"
              >
                Открыть PWA
              </a>
              <div className="text-xs text-muted mt-2">
                Офлайн-режим поддерживается
              </div>
            </div>
          </div>

          {/* QR-код */}
          <div className="section-title">📷 QR-код для телефона</div>
          <div className="card mb-6 text-center">
            <QRCode
              value={DOWNLOAD_URL}
              label="Наведите камеру телефона для перехода на download.balloo.su"
            />
          </div>

          {/* Системные требования (общая таблица) */}
          <SystemRequirements requirements={SYSTEM_REQUIREMENTS} />

          {/* Что нового */}
          <div className="card text-center mb-3">
            <div className="text-sm text-secondary mb-2">Что нового в этой версии?</div>
            <button
              className="btn btn--tertiary"
              onClick={() => navigate('/history')}
            >
              📜 Смотреть историю версий →
            </button>
          </div>

          {/* Документация */}
          <div className="card text-center">
            <div className="text-sm text-secondary mb-2">Документация API</div>
            <a
              href="https://api.balloo.su/doc"
              className="btn btn--tertiary"
            >
              📚 api.balloo.su/doc →
            </a>
          </div>

          {loading && (
            <div className="text-center text-muted text-xs mt-4">
              Загрузка актуальных пакетов...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
