// Poll Screen — создание опросов, просмотр, голосование, результаты
// Макет: mockups/balloo-su/poll-editor.html
// Функция: 0_01_12 — Опросы
// Тикет: №30

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/services/api';

// --- Types ---

type PollType = 'poll' | 'quiz' | 'active_list' | 'passive_list' | 'personali';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  chatId: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string | null;
  type: PollType;
  question: string;
  options: PollOption[];
  allowsMultiple: boolean;
  anonymous: boolean;
  shareable: boolean;
  expiresAt: number | null;
  createdAt: number;
  totalVotes: number;
  userVoted?: number[]; // индексы проголосованных вариантов
}

// --- Poll Type Config ---

const POLL_TYPES: {
  id: PollType;
  icon: string;
  title: string;
  description: string;
}[] = [
  { id: 'poll', icon: '📊', title: 'Опрос', description: 'Голосование' },
  { id: 'quiz', icon: '🎯', title: 'Квиз', description: 'Викторина с ответом' },
  {
    id: 'active_list',
    icon: '✅',
    title: 'Актив. список',
    description: 'Кто идёт?',
  },
  {
    id: 'passive_list',
    icon: '📋',
    title: 'Пассив. список',
    description: 'Список участников',
  },
  {
    id: 'personali',
    icon: '👤',
    title: 'Персонали',
    description: 'Опрос о людях',
  },
];

const EXPIRY_OPTIONS = [
  { value: '1h', label: '1 час' },
  { value: '6h', label: '6 часов' },
  { value: '12h', label: '12 часов' },
  { value: '24h', label: '24 часа' },
  { value: '7d', label: '7 дней' },
  { value: 'never', label: 'Без ограничений' },
];

// --- Create Poll View ---

function CreatePollView({
  chatId,
  onSubmit,
  onCancel,
}: {
  chatId?: string;
  onSubmit: (poll: Partial<Poll>) => void;
  onCancel: () => void;
}) {
  const [pollType, setPollType] = useState<PollType>('poll');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([
    { id: 'opt1', text: '' },
    { id: 'opt2', text: '' },
  ]);
  const [allowsMultiple, setAllowsMultiple] = useState(false);
  const [anonymous, setAnonymous] = useState(true);
  const [shareable, setShareable] = useState(true);
  const [expiry, setExpiry] = useState('24h');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [error, setError] = useState('');

  const addOption = () => {
    if (options.length >= 10) {
      setError('Максимум 10 вариантов');
      return;
    }
    setOptions([...options, { id: `opt${Date.now()}`, text: '' }]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) {
      setError('Минимум 2 варианта');
      return;
    }
    setOptions(options.filter((o) => o.id !== id));
  };

  const updateOption = (id: string, text: string) => {
    setOptions(options.map((o) => (o.id === id ? { ...o, text } : o)));
  };

  const handleSubmit = () => {
    if (!question.trim()) {
      setError('Введите вопрос');
      return;
    }

    const validOptions = options.filter((o) => o.text.trim());
    if (validOptions.length < 2) {
      setError('Минимум 2 варианта ответа');
      return;
    }

    if (pollType === 'quiz' && !correctAnswer) {
      setError('Выберите правильный ответ');
      return;
    }

    // Calculate expiry timestamp
    let expiresAt: number | null = null;
    if (expiry !== 'never') {
      const hours = parseInt(expiry) || 24;
      expiresAt = Date.now() + hours * 3600000;
    }

    onSubmit({
      chatId,
      type: pollType,
      question: question.trim(),
      options: validOptions.map((o) => ({
        id: o.id,
        text: o.text.trim(),
        votes: 0,
      })),
      allowsMultiple,
      anonymous,
      shareable,
      expiresAt,
    });
  };

  return (
    <div className="poll-editor-overlay">
      <div className="card" style={{ width: '100%', maxWidth: 520, margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <span className="font-bold" style={{ fontSize: 18 }}>
            📊 Создать интерактив
          </span>
          <div className="topbar__actions-btn" onClick={onCancel}>
            ✕
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            className="card"
            style={{
              marginBottom: 16,
              backgroundColor: '#3d1f1f',
              borderColor: '#5a2d2d',
            }}
          >
            <div style={{ color: '#ff6b6b', fontSize: 14 }}>⚠️ {error}</div>
          </div>
        )}

        {/* Type tabs */}
        <div className="tabs mb-4" style={{ marginBottom: 16 }}>
          {POLL_TYPES.map((t) => (
            <div
              key={t.id}
              className={`tab ${pollType === t.id ? 'tab--active' : ''}`}
              onClick={() => setPollType(t.id)}
              style={{ fontSize: 13 }}
            >
              {t.icon} {t.title}
            </div>
          ))}
        </div>

        {/* Question */}
        <div className="form-group">
          <label className="form-label">Вопрос / заголовок</label>
          <input
            type="text"
            className="form-input"
            placeholder="Введите вопрос..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>

        {/* Options */}
        <div className="form-group">
          <label className="form-label">Варианты ответа</label>
          {options.map((opt, idx) => (
            <div key={opt.id} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                className="form-input"
                placeholder={`Вариант ${idx + 1}`}
                value={opt.text}
                onChange={(e) => updateOption(opt.id, e.target.value)}
              />
              <button
                className="topbar__actions-btn"
                title="Удалить"
                onClick={() => removeOption(opt.id)}
                disabled={options.length <= 2}
              >
                🗑
              </button>
            </div>
          ))}
          <button
            className="btn btn--tertiary btn--sm mt-2"
            onClick={addOption}
          >
            + Добавить вариант
          </button>
        </div>

        {/* Quiz: correct answer */}
        {pollType === 'quiz' && (
          <div className="form-group">
            <label className="form-label">Правильный ответ (квиз)</label>
            <select
              className="form-select"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
            >
              <option value="">Выберите правильный ответ</option>
              {options
                .filter((o) => o.text.trim())
                .map((o) => (
                  <option key={o.id} value={o.text}>
                    {o.text}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Settings */}
        <div className="form-group">
          <label className="form-checkbox">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
            />
            <span>Анонимное голосование</span>
          </label>
        </div>
        <div className="form-group">
          <label className="form-checkbox">
            <input
              type="checkbox"
              checked={allowsMultiple}
              onChange={(e) => setAllowsMultiple(e.target.checked)}
            />
            <span>Множественный выбор</span>
          </label>
        </div>
        <div className="form-group">
          <label className="form-checkbox">
            <input
              type="checkbox"
              checked={shareable}
              onChange={(e) => setShareable(e.target.checked)}
            />
            <span>Можно переслать</span>
          </label>
        </div>
        <div className="form-group">
          <label className="form-label">Срок действия</label>
          <select
            className="form-select"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          >
            {EXPIRY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'flex-end',
            marginTop: 16,
          }}
        >
          <button className="btn btn--tertiary" onClick={onCancel}>
            Отмена
          </button>
          <button
            className="btn btn--primary"
            onClick={handleSubmit}
            style={{ minWidth: 120 }}
          >
            Создать
          </button>
        </div>
      </div>
    </div>
  );
}

// --- View Poll (results + voting) ---

function ViewPoll({ poll }: { poll: Poll }) {
  const [voted, setVoted] = useState<number[]>(poll.userVoted || []);
  const [voting, setVoting] = useState(false);

  const maxVotes = poll.allowsMultiple ? poll.options.length : 1;
  const maxProgress = Math.max(...poll.options.map((o) => o.votes), 1);

  const handleVote = async (optionIndex: number) => {
    if (poll.type === 'quiz') return; // Квиз — кнопка "Проверить"

    if (!poll.allowsMultiple && voted.includes(optionIndex)) {
      // Снять голос
      setVoted(voted.filter((i) => i !== optionIndex));
      return;
    }

    if (!poll.allowsMultiple && voted.length >= 1) {
      setVoted([optionIndex]);
      return;
    }

    if (voted.includes(optionIndex)) {
      setVoted(voted.filter((i) => i !== optionIndex));
      return;
    }

    if (voted.length < maxVotes) {
      setVoted([...voted, optionIndex]);
    }
  };

  const handleConfirmVote = async () => {
    if (voted.length === 0) return;
    setVoting(true);

    try {
      await api.post(`/api/polls/${poll.id}/vote`, {
        optionIndices: voted,
      });
    } catch {
      // Опционально: показать ошибку
    } finally {
      setVoting(false);
    }
  };

  const formatExpiry = () => {
    if (!poll.expiresAt) return 'Без ограничений';
    const diff = poll.expiresAt - Date.now();
    if (diff < 0) return 'Завершён';
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `Ещё ${hours} ч.`;
    const days = Math.floor(hours / 24);
    return `Ещё ${days} д.`;
  };

  const pollTypeLabel = POLL_TYPES.find((t) => t.id === poll.type)?.title || 'Опрос';

  return (
    <div className="poll-view">
      {/* Poll header */}
      <div className="card poll-view__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div
            className={`avatar avatar--sm ${poll.creatorAvatar ? '' : 'avatar--bordered avatar--status-online'}`}
          >
            {poll.creatorAvatar ? (
              <img
                src={poll.creatorAvatar}
                alt={poll.creatorName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div className="avatar__inner">
                <span>
                  {poll.creatorName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </span>
              </div>
            )}
          </div>
          <div>
            <div className="font-bold" style={{ fontSize: 13 }}>
              {poll.creatorName}
            </div>
            <div className="text-muted" style={{ fontSize: 11 }}>
              {pollTypeLabel} · {formatExpiry()}
            </div>
          </div>
        </div>

        <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>{poll.question}</h3>

        <div className="text-muted" style={{ fontSize: 12, marginBottom: 12 }}>
          👁 {poll.totalVotes} {poll.totalVotes === 1 ? 'голос' : poll.totalVotes < 5 ? 'голоса' : 'голосов'}
          {poll.anonymous && ' · Анонимно'}
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {poll.options.map((option, idx) => {
            const isVoted = voted.includes(idx);
            const percentage = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
            const isCorrect = poll.type === 'quiz' && option.text === 'Зелёный'; // Demo

            return (
              <div
                key={option.id}
                className={`poll-view__option ${isVoted ? 'poll-view__option--voted' : ''} ${isCorrect ? 'poll-view__option--correct' : ''}`}
                onClick={() => handleVote(idx)}
                style={{ cursor: poll.type === 'quiz' ? 'default' : 'pointer' }}
              >
                {/* Progress bar background */}
                <div
                  className="poll-view__progress"
                  style={{
                    width: `${(option.votes / maxProgress) * 100}%`,
                    backgroundColor: isCorrect
                      ? 'var(--accent)'
                      : isVoted
                      ? 'rgba(45, 184, 77, 0.3)'
                      : 'rgba(45, 184, 77, 0.15)',
                  }}
                />

                {/* Content */}
                <div className="poll-view__option-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Checkmark for correct */}
                    {isCorrect && <span style={{ fontSize: 14 }}>✅</span>}
                    {/* Selection indicator */}
                    <div
                      className={`poll-view__checkbox ${isVoted ? 'poll-view__checkbox--checked' : ''}`}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        border: '2px solid var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        backgroundColor: isVoted ? 'var(--accent)' : 'transparent',
                        borderColor: isVoted ? 'var(--accent)' : 'var(--text-secondary)',
                      }}
                    >
                      {isVoted && (
                        <span style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>✓</span>
                      )}
                    </div>
                    <span style={{ flex: 1, fontSize: 14 }}>{option.text}</span>
                    {poll.totalVotes > 0 && (
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {percentage}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Confirm vote button (for non-multiple) */}
        {!poll.allowsMultiple && voted.length > 0 && !poll.userVoted && (
          <button
            className="btn btn--primary"
            onClick={handleConfirmVote}
            disabled={voting}
            style={{ marginTop: 16, width: '100%' }}
          >
            {voting ? 'Голосую...' : 'Проголосовать'}
          </button>
        )}

        {/* Share */}
        {poll.shareable && (
          <div style={{ marginTop: 12, textAlign: 'right' }}>
            <button className="btn btn--tertiary btn--sm">
              🔗 Переслать
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main Poll Screen ---

function PollScreen() {
  const navigate = useNavigate();
  const { pollId } = useParams<{ pollId: string }>();
  const [mode, setMode] = useState<'create' | 'view'>('view');
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(false);

  // Загрузка опроса по ID
  const loadPoll = async (id: string) => {
    setLoading(true);
    try {
      const data = await api.get<Poll>(`/api/polls/${id}`);
      setPoll(data);
      setMode('view');
    } catch {
      setMode('create');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (pollData: Partial<Poll>) => {
    setLoading(true);
    try {
      const created = await api.post<Poll>('/api/polls', pollData);
      setPoll(created);
      setMode('view');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка создания опроса';
      console.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (loading && mode === 'view') {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Загрузка...
      </div>
    );
  }

  return (
    <div className="poll-screen">
      {mode === 'create' ? (
        <CreatePollView
          chatId={undefined}
          onSubmit={handleCreate}
          onCancel={handleCancel}
        />
      ) : poll ? (
        <ViewPoll poll={poll} />
      ) : (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
          Опрос не найден
        </div>
      )}
    </div>
  );
}

export default PollScreen;
