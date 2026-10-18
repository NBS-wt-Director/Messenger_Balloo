// Onboarding Screen — приветственные экраны при первом запуске
// Макет: mockups/balloo-su/onboarding.html

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface OnboardingStepData {
  id: string;
  illustration: string;
  title: string;
  text: string;
  order: number;
}

// Шаги по умолчанию (fallback, если API недоступен)
const DEFAULT_STEPS: OnboardingStepData[] = [
  {
    id: '1',
    illustration: '💬',
    title: 'Добро пожаловать в Balloo!',
    text: 'Кроссплатформенный мессенджер с уникальным дизайном, групповыми звонками и защитой ваших данных.',
    order: 1,
  },
  {
    id: '2',
    illustration: '📞',
    title: 'Звонки и группы',
    text: 'Аудио и видео звонки до 30 человек, групповые чаты с опросами, квизами и интерактивными списками.',
    order: 2,
  },
  {
    id: '3',
    illustration: '🔐',
    title: 'Приватность и безопасность',
    text: 'JWT-сессии, шифрование на сервере, 3 темы оформления, мультиязычность. Ваши файлы — на вашем Yandex Disk.',
    order: 3,
  },
];

export default function OnboardingScreen() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [steps, setSteps] = useState<OnboardingStepData[]>(DEFAULT_STEPS);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  // Загрузка шагов из API
  useEffect(() => {
    const fetchSteps = async () => {
      try {
        const data = await api.getOnboardingSteps();
        if (data && Array.isArray(data) && data.length > 0) {
          setSteps(data);
        }
      } catch {
        // fallback на дефолтные шаги
      } finally {
        setLoading(false);
      }
    };

    fetchSteps();
  }, []);

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
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="onboarding">
      <div className="onboarding__step onboarding__step--active">
        <div className="onboarding__illustration">{step.illustration}</div>
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
          {isFirst ? (
            <button className="btn btn--tertiary" onClick={skipOnboarding}>
              Пропустить
            </button>
          ) : (
            <button className="btn btn--tertiary" onClick={prevStep}>
              ← Назад
            </button>
          )}
          {isLast ? (
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
