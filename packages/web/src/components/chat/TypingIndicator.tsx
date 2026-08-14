// TypingIndicator — индикатор набора текста
// Показывает анимацию точек и имя пользователя, который печатает

interface TypingIndicatorProps {
  user?: string;
  visible: boolean;
}

export function TypingIndicator({ user, visible }: TypingIndicatorProps) {
  if (!visible || !user) return null;

  return (
    <div className="typing">
      <div className="typing__dots">
        <div className="typing__dot" />
        <div className="typing__dot" />
        <div className="typing__dot" />
      </div>
      <span>{user} печатает...</span>
    </div>
  );
}
