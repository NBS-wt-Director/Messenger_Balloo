// UpdateInstructions — раскрывающийся блок с инструкцией по обновлению
// Тикет №57 — Download (узел 06)

import { useState } from 'react';

interface UpdateInstructionsProps {
  platform: string;
  title?: string;
}

const INSTRUCTIONS: Record<string, string[]> = {
  android: [
    '🔄 Как обновить Balloo на Android:',
    '',
    '📱 Автоматическое обновление (если установлено из Google Play):',
    '- Откройте Google Play → Мои приложения и игры',
    '- Найдите Balloo в списке',
    '- Нажмите "Обновить"',
    '',
    '📥 Ручное обновление (если установлено через APK):',
    '- Скачайте новую версию APK на этой странице',
    '- Откройте скачанный файл',
    '- Нажмите "Обновить" (версия установится поверх старой, данные сохранятся)',
    '- Если ошибка "Приложение не установлено" — удалите старую версию и установите новую',
    '',
    '⚙️ Проверка версии:',
    '- Откройте Balloo → Настройки → О приложении',
    '- Текущая версия отображается внизу экрана',
    '',
    '📢 Уведомления об обновлениях:',
    '- Уведомления о новых версиях приходят в самом приложении',
    '- Подпишитесь на history.balloo.su для changelog',
  ],
  ios: [
    'Обновление на iOS:',
    '- Откройте App Store → профиль → обновления',
    '- Найдите Balloo и нажмите "Обновить"',
    '',
    'TestFlight: обновления приходят автоматически через приложение TestFlight',
  ],
  win: [
    'Обновление на Windows:',
    '- Balloo проверяет обновления автоматически при запуске',
    '- Для ручного обновления скачайте новый установщик и запустите его',
    '- Portable: замените файлы в папке новыми из архива',
  ],
  linux: [
    'Обновление на Linux:',
    '- AppImage: скачайте новый файл и замените старый',
    '- DEB: sudo apt install ./balloo-new.deb (обновит поверх)',
    '- RPM: sudo dnf upgrade balloo',
  ],
  mac: [
    'Обновление на macOS:',
    '- Balloo проверяет обновления автоматически при запуске',
    '- Для ручного обновления скачайте новый .dmg и замените приложение',
  ],
};

export function UpdateInstructions({ platform, title }: UpdateInstructionsProps) {
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
        {open ? '▼' : '▶'} {title || '🔄 Инструкция по обновлению'}
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
