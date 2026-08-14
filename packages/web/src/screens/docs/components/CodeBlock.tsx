// CodeBlock — блок кода с подсветкой и кнопкой копирования
// Тикет №58 — Docs: API документация

import { useState, useCallback } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
  label?: string;
}

// Простая подсветка JSON (ключи, строки, числа)
function highlightJson(code: string): string {
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/("(?:[^"\\]|\\.)*")(\s*:)/g, '<span style="color:var(--info);">$1</span>$2')
    .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span style="color:var(--accent);">$1</span>')
    .replace(/:\s*(true|false|null)/g, ': <span style="color:var(--warning);">$1</span>')
    .replace(/:\s*(-?\d+\.?\d*)/g, ': <span style="color:var(--warning);">$1</span>');
}

export function CodeBlock({ code, language = 'json', label }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  const highlighted = language === 'json' ? highlightJson(code) : code;

  return (
    <div style={{ position: 'relative' }}>
      {label && (
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            marginBottom: '4px',
            letterSpacing: '0.5px',
          }}
        >
          {label}
        </div>
      )}
      <div
        style={{
          background: 'var(--bg-tertiary)',
          padding: '16px',
          fontFamily: "'Fira Code', 'Courier New', monospace",
          fontSize: '13px',
          lineHeight: 1.6,
          overflowX: 'auto',
          border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
        }}
      >
        <pre
          style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </div>
      <button
        onClick={handleCopy}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'var(--bg-secondary, rgba(255,255,255,0.08))',
          border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
          color: 'var(--text-secondary)',
          padding: '4px 10px',
          fontSize: '11px',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {copied ? '✓ Скопировано' : '📋 Копировать'}
      </button>
    </div>
  );
}
