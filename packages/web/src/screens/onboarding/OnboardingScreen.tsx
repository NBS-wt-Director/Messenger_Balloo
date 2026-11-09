// Onboarding Screen — приветственные экраны при первом запуске
// Макет: mockups/balloo-su/onboarding.html
//
// Формат API: [{id, order, illustrationUrl, translations:[{language,title,description}]}]
// Маппинг: выбираем translation по locale (useI18n), фолбэк 'ru', затем первая непустая.
// Правило (09.11.2026): валидный шаг — title || description не пустые.
// Нет валидных шагов → экран НЕ показываем, помечаем completed, редирект.

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useI18n } from '@/components/providers/I18nProvider';

interface ApiTranslation {
  language: string;
  title?: string;
  description?: string;
}

interface ApiStep {
  id: string;
  order: number;
  illustrationUrl?: string;
  translations?: ApiTranslation[];
}

interface OnboardingStepData {
  id: string;
  title: string;
  text: string;
  order: number;
}

export default function OnboardingScreen() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { locale } = useI18n();
  const [steps, setSteps] = useState<OnboardingStepData[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  // Маппинг API-шагов → формат экрана
  const mapStep = useCallback((apiStep: ApiStep): OnboardingStepData | null => {
    const translations = apiStep.translations || [];
    // Приоритет: locale → 'ru' → любая первая непустая
    let translation: ApiTranslation | undefined;
    translation = translations.find((t) => t.language === locale);
    if (!translation) translation = translations.find((t) => t.language === 'ru');
    if (!translation) translation = translations[0];

    const title = (translation?.title || '').trim();
    const text = (translation?.description || '').trim();

    // Правило: если нет контента — не показываем
    if (!title && !text) return null;

    return {
      id: apiStep.id,
      title,
      text,
      order: apiStep.order,
    };
  }, [locale]);

  // Загрузка шагов из API
  useEffect(() => {
    const fetchSteps = async () => {
      try {
        const data = await api.getOnboardingSteps();
        if (data && Array.isArray(data)) {
          const mapped = data.map(mapStep).filter(Boolean) as OnboardingStepData[];
          mapped.sort((a, b) => a.order - b.order);
          setSteps(mapped);
        }
      } catch {
        // API недоступен — пусто
      } finally {
        setLoading(false);
      }
    };

    fetchSteps();
  }, [mapStep]);

  // Правило: нет шагов → не показываем, помечаем completed
  useEffect(() => {
    if (!loading && steps.length === 0) {
      localStorage.setItem('onboarding_completed', 'true');
      navigate(user ? '/chats' : '/login', { replace: true });
    }
  }, [loading, steps.length, user, navigate]);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, steps.length]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((index: number) => {
    setCurrentStep(index);
  }, []);

  const finishOnboarding = useCallback(async () => {
    localStorage.setItem('onboarding_completed', 'true');
    if (user) {
      try {
        await api.completeOnboarding();
      } catch {
        // игнорируем ошибку
      }
      navigate('/chats');
    } else {
      navigate('/login');
    }
  }, [navigate, user]);

  const skipOnboarding = useCallback(() => {
    localStorage.setItem('onboarding_completed', 'true');
    navigate('/login');
  }, [navigate]);

  if (loading) {
    return (
      <div className="onboarding">
        <div className="onboarding__step onboarding__step--active">
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  const step = steps[currentStep];

  // Guard: до срабатывания redirect-эффекта не рендерим битый JSX
  if (!step) return null;

  return (
    <div className="onboarding">
      <div className="onboarding__step onboarding__step--active">
        <h2 className="onboarding__title">{step.title}</h2>
        <p className="onboarding__text">{step.text}</p>

        {/* Точки прогресса */}
        <div className="onboarding__dots">
          {steps.map((_, index) => (
            <span
              key={index}
              className={`onboarding__dot ${index === currentStep ? 'onboarding__dot--active' : ''}`}
              onClick={() => goToStep(index)}
            />
          ))}
        </div>

        {/* Кнопки навигации */}
        <div className="onboarding__buttons">
          {currentStep === 0 ? (
            <button className="btn btn--tertiary" onClick={skipOnboarding}>
              Пропустить
            </button>
          ) : (
            <button className="btn btn--tertiary" onClick={prevStep}>
              ← Назад
            </button>
          )}
          {currentStep === steps.length - 1 ? (
            <button className="btn btn--primary" onClick={finishOnboarding}>
              Начать →
            </button>
          ) : (
            <button className="btn btn--primary" onClick={nextStep}>
              Далее →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
