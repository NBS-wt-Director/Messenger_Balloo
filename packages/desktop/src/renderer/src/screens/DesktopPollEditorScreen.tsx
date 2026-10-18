// DesktopPollEditorScreen — create poll/quiz editor
// Mockup: mockups/desktop/poll-editor.html (1_09_17)

import React, { useState } from 'react';
import { api } from '@balloo/web/services/api';

interface PollOption { id: string; text: string }

export function DesktopPollEditorScreen({ chatId, onSuccess }: { chatId?: string; onSuccess?: () => void }) {
  const [type, setType] = useState<'poll' | 'quiz'>('poll');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<PollOption[]>([{ id: '1', text: '' }, { id: '2', text: '' }]);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const [multiple, setMultiple] = useState(false);
  const [anonymous, setAnonymous] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addOption = () => {
    if (options.length >= 10) return;
    setOptions([...options, { id: String(Date.now()), text: '' }]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions(options.filter((o) => o.id !== id));
  };

  const updateOption = (id: string, text: string) => {
    setOptions(options.map((o) => (o.id === id ? { ...o, text } : o)));
  };

  const handleCreate = async () => {
    if (!question.trim()) { setError('Введите вопрос'); return; }
    const filled = options.filter((o) => o.text.trim());
    if (filled.length < 2) { setError('Минимум 2 варианта ответа'); return; }
    if (type === 'quiz' && correctIndex === null) { setError('Выберите правильный ответ'); return; }
    if (!chatId) { setError('Не указан чат для опроса'); return; }
    setCreating(true);
    setError(null);
    try {
      await api.createPoll(chatId, {
        question: question.trim(),
        options: filled.map((o) => o.text.trim()),
        allowsMultiple: multiple,
      });
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Ошибка создания опроса');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 520, margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 20px', fontSize: 20, color: 'var(--text-primary, #fff)' }}>Создать опрос</h2>

      {/* Type selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setType('poll')} style={{ ...typeBtn, background: type === 'poll' ? 'var(--accent, #2db84d)' : 'var(--bg-tertiary, #2a2a3a)', color: type === 'poll' ? '#fff' : 'var(--text-primary, #fff)' }}>📊 Опрос</button>
        <button onClick={() => setType('quiz')} style={{ ...typeBtn, background: type === 'quiz' ? 'var(--accent, #2db84d)' : 'var(--bg-tertiary, #2a2a3a)', color: type === 'quiz' ? '#fff' : 'var(--text-primary, #fff)' }}>🎯 Квиз</button>
      </div>

      <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Задайте вопрос" style={inputStyle} />

      <div style={{ marginTop: 12 }}>
        {options.map((o, i) => (
          <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            {type === 'quiz' && (
              <input type="radio" name="correct" checked={correctIndex === i} onChange={() => setCorrectIndex(i)} style={{ accentColor: 'var(--accent, #2db84d)' }} />
            )}
            <input value={o.text} onChange={(e) => updateOption(o.id, e.target.value)} placeholder={`Вариант ${i + 1}`} style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
            {options.length > 2 && <button onClick={() => removeOption(o.id)} style={removeBtn}>✕</button>}
          </div>
        ))}
        {options.length < 10 && <button onClick={addOption} style={addBtn}>+ Добавить вариант</button>}
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 13 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary, #8a8aa0)' }}>
          <input type="checkbox" checked={multiple} onChange={(e) => setMultiple(e.target.checked)} /> Несколько ответов
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary, #8a8aa0)' }}>
          <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} /> Анонимный
        </label>
      </div>

      {error && <div style={{ color: 'var(--danger, #e53e3e)', fontSize: 13, marginTop: 12 }}>{error}</div>}
      <button onClick={handleCreate} disabled={creating} style={btnStyle}>{creating ? 'Создание…' : '➤ Создать опрос'}</button>
    </div>
  );
}

const typeBtn: React.CSSProperties = { flex: 1, padding: '10px 16px', border: '1px solid var(--border-color, #333)', fontSize: 14, fontWeight: 600, cursor: 'pointer' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary, #2a2a3a)', border: '1px solid var(--border-color, #333)', color: 'var(--text-primary, #fff)', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 8 };
const removeBtn: React.CSSProperties = { background: 'none', border: 'none', color: 'var(--danger, #e53e3e)', fontSize: 16, cursor: 'pointer', padding: 4 };
const addBtn: React.CSSProperties = { background: 'none', border: '1px dashed var(--border-color, #333)', color: 'var(--text-secondary, #8a8aa0)', padding: '8px 16px', fontSize: 13, cursor: 'pointer', width: '100%' };
const btnStyle: React.CSSProperties = { width: '100%', padding: '10px 20px', marginTop: 20, background: 'var(--accent, #2db84d)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' };
