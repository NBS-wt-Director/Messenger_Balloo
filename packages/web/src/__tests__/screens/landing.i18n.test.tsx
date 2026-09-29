// Лендинг: тексты берутся из словаря по определённому языку.
// Проверяет две вещи сразу — что LandingScreen вообще переведён и что
// язык из стора (а туда он приходит из настроек браузера) доходит до разметки.
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useUIStore } from '@balloo/ui';
import { I18nProvider } from '@/components/providers/I18nProvider';
import LandingScreen from '@/screens/landing/LandingScreen';

function renderLanding() {
  return render(
    <MemoryRouter>
      <I18nProvider>
        <LandingScreen />
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe('LandingScreen — переводы', () => {
  beforeEach(() => {
    useUIStore.setState({ language: 'ru' });
  });

  it('на русском — описание и кнопка из русской формы', () => {
    renderLanding();

    expect(
      screen.getByText('Российский мессенджер для общения, работы и бизнеса'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Войти' })).toBeInTheDocument();
  });

  it('на английском — те же элементы в английской форме', () => {
    useUIStore.setState({ language: 'en' });
    renderLanding();

    expect(
      screen.getByText('Russian messenger for communication, work and business'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
  });

  it('на татарском описание своё, а не русское', () => {
    useUIStore.setState({ language: 'tt' });
    renderLanding();

    expect(screen.getByText('Эшләү, эш һәм бизнес өчен Россия мессенджеры')).toBeInTheDocument();
  });
});
