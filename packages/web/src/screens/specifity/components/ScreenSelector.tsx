// ScreenSelector — селектор экрана внутри узла
// Тикет №59 — Specifity: спецификация

export interface SpecScreenOption {
  id: string;
  title: string;
  file: string;
}

interface ScreenSelectorProps {
  screens: SpecScreenOption[];
  activeScreenId: string | null;
  onSelect: (screenId: string) => void;
}

export function ScreenSelector({ screens, activeScreenId, onSelect }: ScreenSelectorProps) {
  return (
    <div className="spec-screen-selector">
      <div className="spec-screen-selector__label">Экран</div>
      <div className="spec-screen-selector__list">
        {screens.length === 0 && (
          <div className="spec-screen-selector__empty">Нет экранов</div>
        )}
        {screens.map((screen) => (
          <button
            key={screen.id}
            className={`spec-screen-selector__item ${
              activeScreenId === screen.id ? 'spec-screen-selector__item--active' : ''
            }`}
            onClick={() => onSelect(screen.id)}
          >
            <span className="spec-screen-selector__id">{screen.id}</span>
            <span className="spec-screen-selector__title">{screen.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
