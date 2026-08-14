// InstallInstructions — раскрывающийся блок с инструкцией по установке
// Тикет №57 — Download (узел 06)

import { useState } from 'react';

interface InstallInstructionsProps {
  platform: string;
  title?: string;
}

const INSTRUCTIONS: Record<string, string[]> = {
  android: [
    '⚡ Установка APK на Android:',
    '1. Разрешите установку из неизвестных источников: Настройки → Безопасность → Установка из неизвестных источников → Включить',
    '2. Скачайте APK (выберите под свою архитектуру)',
    '3. Откройте скачанный файл',
    '4. Нажмите "Установить"',
    '5. После установки — откройте Balloo',
    '',
    '🔍 Как узнать архитектуру процессора?',
    '- Скачайте приложение Droid Hardware Info из Google Play',
    '- Откройте вкладку "System" → "CPU Architecture"',
    '- Если CPU Architecture:',
    '  aarch64 / arm64-v8a → скачивайте ARM64',
    '  armv7l / armeabi-v7a → скачивайте ARM32',
    '  x86_64 → скачивайте x86_64',
    '  Не уверены → скачивайте Universal',
    '',
    '⚠️ Важно:',
    '- Universal APK работает на всех устройствах, но больше размером',
    '- APK под вашу архитектуру меньше и работает быстрее',
    '- AAB-файл предназначен только для Google Play',
  ],
  ios: [
    'Установка на iOS:',
    '1. Откройте App Store',
    '2. Найдите Balloo',
    '3. Нажмите "Установить"',
    '4. После установки — откройте Balloo',
    '',
    'TestFlight также доступен для бета-тестирования.',
  ],
  win: [
    'Установка на Windows:',
    '1. Скачайте установщик (.exe или .msi)',
    '2. Запустите скачанный файл',
    '3. Следуйте инструкциям мастера установки',
    '4. После установки — запустите Balloo из меню Пуск',
    '',
    'Portable версия не требует установки — просто распакуйте архив и запустите Balloo.exe',
  ],
  linux: [
    'Установка на Linux:',
    'AppImage: скачайте файл, сделайте исполняемым (chmod +x Balloo.AppImage) и запустите',
    'DEB: установите через sudo dpkg -i balloo.deb или sudo apt install ./balloo.deb',
    'RPM: установите через sudo rpm -i balloo.rpm или sudo dnf install balloo.rpm',
    'Portable: распакуйте tar.gz и запустите Balloo',
  ],
  mac: [
    'Установка на macOS:',
    '1. Скачайте .dmg файл',
    '2. Откройте скачанный .dmg',
    '3. Перетащите Balloo в папку Applications',
    '4. Запустите Balloo из Launchpad',
    '',
    'Portable .zip: распакуйте архив и запустите Balloo.app',
  ],
};

export function InstallInstructions({ platform, title }: InstallInstructionsProps) {
  const [open, setOpen] = useState(false);
  const steps = INSTRUCTIONS[platform] || [];

  if (steps.length === 0) return null;

  return (
    <div className="card" style={{ marginBottom: '12px' }}>
      <button
        onClick={() => setOpen(!open)}
        className="btn btn--tertiary"
        style={{ width: '100%', textAlign: 'left', justifyContent: 'flex-start' }}
      >
        {open ? '▼' : '▶'} {title || '📋 Инструкция по установке'}
      </button>
      {open && (
        <div
          className="text-sm"
          style={{ marginTop: '12px', whiteSpace: 'pre-line', lineHeight: 1.6 }}
        >
          {steps.join('\n')}
        </div>
      )}
    </div>
  );
}
