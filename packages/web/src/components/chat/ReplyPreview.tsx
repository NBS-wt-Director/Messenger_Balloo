// ReplyPreview — панель ответа на сообщение (P34: по макету chats.html, A1.2)
// Классы common.css: reply-panel, reply-panel__preview/author/text/cancel

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
    <div className="reply-panel reply-panel--visible" style={{ flexShrink: 0 }}>
      <button className="reply-panel__cancel" onClick={onCancel}>✕</button>
      <div className="reply-panel__preview">
        <div className="reply-panel__author">{message.author}</div>
        <div className="reply-panel__text">{message.content}</div>
      </div>
    </div>
  );
};