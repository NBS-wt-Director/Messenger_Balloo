// ReactionPicker — picker реакций (быстрый выбор эмодзи)

import React, { useState, useRef, useEffect } from 'react';

interface ReactionPickerProps {
  onSelect: (messageId: string, emoji: string) => void;
  messageId: string;
  anchorElement: HTMLElement | null;
  onClose: () => void;
}

const QUICK_EMOJIS = ['👍', '❤', '🔥', '😂', '😮', '😢', '🤮', '👎', '🎉', '💯'];
const MORE_EMOJIS = ['😍', '🤩', '😎', '🤔', '🙏', '💪', '🚀', '⭐', '✅', '❌'];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelect, messageId, anchorElement, onClose }) => {
  const [showMore, setShowMore] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  // Position picker near anchor
  const getPosition = (): { top: number; left: number } => {
    if (!anchorElement) return { top: 0, left: 0 };
    const rect = anchorElement.getBoundingClientRect();
    return {
      top: rect.bottom + 8,
      left: Math.min(rect.left, window.innerWidth - 280),
    };
  };

  const position = getPosition();

  return (
    <div
      ref={pickerRef}
      className="reaction-float"
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        display: 'flex',
        gap: '2px',
        padding: '6px 8px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        flexWrap: 'wrap',
        maxWidth: '280px',
      }}
    >
      {(showMore ? [...QUICK_EMOJIS, ...MORE_EMOJIS] : QUICK_EMOJIS).map((emoji) => (
        <button
          key={emoji}
          className="reaction-float__btn"
          style={{
            fontSize: '20px',
            padding: '6px 8px',
            cursor: 'pointer',
            borderRadius: '4px',
            transition: 'all 0.15s ease',
            background: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.3)';
            e.currentTarget.style.background = 'var(--bg-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.background = 'transparent';
          }}
          onClick={() => {
            onSelect(messageId, emoji);
            onClose();
          }}
        >
          {emoji}
        </button>
      ))}
      {!showMore && MORE_EMOJIS.length > 0 && (
        <button
          style={{
            fontSize: '14px',
            padding: '6px 8px',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            background: 'transparent',
          }}
          onClick={() => setShowMore(true)}
        >
          +
        </button>
      )}
    </div>
  );
};
