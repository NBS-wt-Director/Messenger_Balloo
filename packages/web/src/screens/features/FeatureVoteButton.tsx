// FeatureVoteButton — кнопка голосования с анимацией
// Тикет №55 — Features: фич-реквесты (узел 04)

import { useState, useCallback } from 'react';
import { api } from '@/services/api';

interface Props {
  featureId: string;
  initialVoteCount: number;
  hasVoted: boolean;
  onVoteChange?: (voted: boolean, count: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function FeatureVoteButton({
  featureId,
  initialVoteCount,
  hasVoted,
  onVoteChange,
  size = 'md',
}: Props) {
  const [voted, setVoted] = useState(hasVoted);
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sizeMap = {
    sm: { btnSize: 'btn--sm', btnWidth: 40, fontSize: 14, countSize: 16 },
    md: { btnSize: '', btnWidth: 48, fontSize: 18, countSize: 18 },
    lg: { btnSize: 'btn--lg', btnWidth: 56, fontSize: 22, countSize: 24 },
  };

  const s = sizeMap[size];

  const handleVote = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const endpoint = voted
        ? `/api/features/${featureId}/vote`
        : `/api/features/${featureId}/vote`;

      if (voted) {
        await api.delete(endpoint);
      } else {
        await api.post(endpoint);
      }

      setVoted(!voted);
      setVoteCount((prev) => (voted ? prev - 1 : prev + 1));
      onVoteChange?.(!voted, voted ? voteCount - 1 : voteCount + 1);
    } catch (err: any) {
      setError(err.message || 'Ошибка голосования');
    } finally {
      setLoading(false);
    }
  }, [voted, featureId, loading, onVoteChange, voteCount]);

  return (
    <div className="flex flex-col items-center" style={{ minWidth: s.btnWidth }}>
      <button
        className={`btn btn--primary ${s.btnSize}`}
        style={{
          width: s.btnWidth,
          fontSize: s.fontSize,
          opacity: loading ? 0.6 : 1,
        }}
        onClick={handleVote}
        disabled={loading}
        title={voted ? 'Отменить голос' : 'Проголосовать'}
      >
        ▲
      </button>
      <span
        className="font-bold text-accent"
        style={{ fontSize: s.countSize, marginTop: 4 }}
      >
        {voteCount}
      </span>
      {error && <span className="text-xs text-danger" style={{ marginTop: 2 }}>{error}</span>}
    </div>
  );
}
