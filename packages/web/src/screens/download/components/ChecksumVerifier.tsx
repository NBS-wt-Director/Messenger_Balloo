// ChecksumVerifier — отображение и проверка SHA256
// Тикет №57 — Download (узел 06)

import { useState } from 'react';

interface ChecksumVerifierProps {
  checksum?: string;
  fileName?: string;
}

export function ChecksumVerifier({ checksum, fileName }: ChecksumVerifierProps) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<'match' | 'nomatch' | null>(null);

  if (!checksum) {
    return (
      <div className="text-xs text-muted">
        Контрольная сумма недоступна для этого пакета.
      </div>
    );
  }

  const verify = () => {
    const clean = input.trim().toLowerCase().replace(/^sha256:/, '');
    const target = checksum.trim().toLowerCase().replace(/^sha256:/, '');
    setResult(clean === target ? 'match' : 'nomatch');
  };

  return (
    <div style={{ marginTop: '12px' }}>
      <div className="text-xs text-muted" style={{ marginBottom: '4px' }}>
        SHA256 контрольная сумма:
      </div>
      <div
        className="text-xs"
        style={{
          fontFamily: 'monospace',
          wordBreak: 'break-all',
          padding: '8px',
          background: 'var(--bg-hover, rgba(255,255,255,0.05))',
          marginBottom: '8px',
        }}
      >
        {checksum}
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Вставьте вычисленную сумму для проверки"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setResult(null);
          }}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '6px 10px',
            background: 'var(--bg-input, transparent)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontSize: '12px',
          }}
        />
        <button className="btn btn--secondary" onClick={verify} style={{ fontSize: '12px' }}>
          Проверить
        </button>
      </div>

      {result === 'match' && (
        <div className="text-xs" style={{ color: 'var(--accent)', marginTop: '6px' }}>
          ✓ Совпадает! Файл {fileName || 'не повреждён'}.
        </div>
      )}
      {result === 'nomatch' && (
        <div className="text-xs" style={{ color: 'var(--danger, #e53935)', marginTop: '6px' }}>
          ✗ Не совпадает. Возможно, файл повреждён.
        </div>
      )}
    </div>
  );
}
