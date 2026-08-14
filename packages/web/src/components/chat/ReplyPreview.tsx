// ReplyPreview — превью ответа на сообщение (inline над полем ввода)

import React from 'react';

interface ReplyPreviewProps {
  message: {
    id: string;
    author: string;
    content: string;
    avatarUrl?: string;
  };
  onCancel: () => void;
}

export const ReplyPreview: React.FC<ReplyPreviewProps> = ({ message, onCancel }) => {
  return (
    <div
      className="reply-panel"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        padding: '10px 16px',
        background: 'var(--bg-tertiary)',
        borderTop: '1px solid var(--accent)',
        borderLeft: `3px solid var(--accent)`,
      }}
    >
      {/* Cancel button */}
      <button
        className="reply-panel__cancel"
        onClick={onCancel}
        style={{
          fontSize: '16px',
          padding: '4px 8px',
          color: 'var(--text-muted)',
          alignSelf: 'flex-start',
          marginTop: '2px',
        }}
      >
        ✕
      </button>

      {/* Avatar */}
      <div style={{ flexShrink: 0 }}>
        {message.avatarUrl ? (
          <img
            src={message.avatarUrl}
            alt={message.author}
            style={{
              width: '32px',
              height: '32px',
              objectFit: 'cover',
              clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
              border: '2px solid var(--border-color)',
              boxSizing: 'border-box',
            }}
          />
        ) : (
          <div
            style={{
              width: '32px',
              height: '32px',
              background: 'var(--bg-tertiary)',
              clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 700,
              border: '2px solid var(--border-color)',
              boxSizing: 'border-box',
            }}
          >
            {(message.author[0] || '?').toUpperCase()}
          </div>
        )}
      </div>

      {/* Preview content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--accent)',
            marginBottom: '2px',
          }}
        >
          {message.author}
        </div>
        <div
          style={{
            fontSize: '13px',
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
};
