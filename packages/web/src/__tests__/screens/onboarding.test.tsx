// Тесты экрана онбординга — тикет 1794211605
// Правило владельца (09.11.2026): у шага нет текста — онбординг НЕ показываем.
// Формат API: [{id, order, illustrationUrl, translations:[{language,title,description}]}]

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useUIStore } from '@balloo/ui';

const getOnboardingSteps = vi.fn();

vi.mock('@/services/api', () => ({
  api: {
    getOnboardingSteps: (...args: unknown[]) => getOnboardingSteps(...args),
    completeOnboarding: vi.fn().mockResolvedValue({ success: true }),
  },
}));

import OnboardingScreen from '../../screens/onboarding/OnboardingScreen';
import { I18nProvider } from '../../components/providers/I18nProvider';

const STEPS_RU = [
  {
    id: 'ob-step-1',
    order: 1,
    illustrationUrl: '/img/onboarding/welcome.svg',
    translations: [
      { language: 'en', title: 'Welcome to Balloo', description: 'English desc' },
      { language: 'ru', title: 'Добро пожаловать в Balloo', description: 'Русское описание шага' },
    ],
  },
];

function renderScreen() {
  return render(
    <MemoryRouter>
      <I18nProvider>
        <OnboardingScreen />
      </I18nProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  useUIStore.getState().setLanguage('ru');
});

describe('OnboardingScreen', () => {
  it('рендерит заголовок и текст шага из translations по locale ru', async () => {
    getOnboardingSteps.mockResolvedValue(STEPS_RU);
    renderScreen();

    await waitFor(() =>
      expect(screen.getByText('Добро пожаловать в Balloo')).toBeInTheDocument()
    );
    expect(screen.getByText('Русское описание шага')).toBeInTheDocument();
    expect(screen.queryByText('Welcome to Balloo')).not.toBeInTheDocument();
  });

  it('шаги без текста (пустые title+description) → экран не показываем, completed выставлен', async () => {
    getOnboardingSteps.mockResolvedValue([
      {
        id: 'ob-step-1',
        order: 1,
        translations: [{ language: 'ru', title: '', description: '   ' }],
      },
    ]);
    const { container } = renderScreen();

    await waitFor(() =>
      expect(localStorage.getItem('onboarding_completed')).toBe('true')
    );
    expect(container.querySelector('.onboarding__step--active')).toBeNull();
    expect(screen.queryByText('Пропустить')).not.toBeInTheDocument();
  });

  it('пустой список от API → не показываем, completed выставлен', async () => {
    getOnboardingSteps.mockResolvedValue([]);
    renderScreen();

    await waitFor(() =>
      expect(localStorage.getItem('onboarding_completed')).toBe('true')
    );
    expect(screen.queryByText('Пропустить')).not.toBeInTheDocument();
  });

  it('ошибка API → не показываем (никаких fallback-шагов)', async () => {
    getOnboardingSteps.mockRejectedValue(new Error('network'));
    renderScreen();

    await waitFor(() =>
      expect(localStorage.getItem('onboarding_completed')).toBe('true')
    );
    expect(screen.queryByText('Пропустить')).not.toBeInTheDocument();
    expect(screen.queryByText('Добро пожаловать в Balloo!')).not.toBeInTheDocument();
  });

  it('locale en → берётся английский перевод', async () => {
    useUIStore.getState().setLanguage('en');
    getOnboardingSteps.mockResolvedValue(STEPS_RU);
    renderScreen();

    await waitFor(() =>
      expect(screen.getByText('Welcome to Balloo')).toBeInTheDocument()
    );
    expect(screen.getByText('English desc')).toBeInTheDocument();
  });
});
