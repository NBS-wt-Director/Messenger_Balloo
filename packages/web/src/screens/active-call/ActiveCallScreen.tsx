// ActiveCall Screen — полноэкранный интерфейс группового звонка
// Макет: mockups/balloo-su/active-call.html

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface Participant {
  id: string;
  name: string;
  avatarUrl?: string;
  isMuted: boolean;
  videoOn: boolean;
  isSpeaking: boolean;
  isScreenSharing: boolean;
}

export default function ActiveCallScreen() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [muted, setMuted] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [lowQuality, setLowQuality] = useState(false);

  // Таймер звонка
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Форматирование времени MM:SS
  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const mainSpeaker = participants.find((p) => p.isSpeaking) || participants[0];
  const others = participants.filter((p) => p.id !== mainSpeaker?.id);

  const toggleMute = useCallback(() => setMuted((prev) => !prev), []);
  const toggleVideo = useCallback(() => setVideoOn((prev) => !prev), []);
  const toggleScreenShare = useCallback(() => setScreenSharing((prev) => !prev), []);

  const endCall = useCallback(async () => {
    try {
      // Если есть callId из URL params
      const callId = window.location.pathname.split('/').pop();
      if (callId && callId !== 'active-call') {
        await api.endCall(callId);
      }
    } catch {
      // игнорируем
    }
    navigate('/calls');
  }, [navigate]);

  return (
    <div className="call-overlay">
      {/* Header */}
      <div className="call-header">
        <div className="call-header__left">
          <div className="call-header__group-avatar">Г</div>
          <span className="call-header__title">Групповой звонок — Команда разработки</span>
        </div>
        <div className="call-header__center">
          <span className="call-header__timer">{formatTime(seconds)}</span>
          {lowQuality && <span className="chip chip--warning">⚠ Низкая скорость</span>}
          <span className="chip">{participants.length} участников</span>
        </div>
        <div className="call-header__right">
          <button className="btn btn--danger btn--sm" onClick={endCall}>
            Завершить
          </button>
        </div>
      </div>

      {/* Main speaker area */}
      <div className="call-main-speaker">
        {mainSpeaker ? (
          <div className={`call-participant ${mainSpeaker.isSpeaking ? 'call-participant--speaking' : ''}`}>
            {mainSpeaker.videoOn ? (
              <div className="call-participant__video-placeholder">
                <span className="call-participant__avatar">{mainSpeaker.name[0]}</span>
              </div>
            ) : (
              <div className="call-participant__avatar-lg">
                {mainSpeaker.avatarUrl ? (
                  <img src={mainSpeaker.avatarUrl} alt={mainSpeaker.name} />
                ) : (
                  <span>{mainSpeaker.name[0]}</span>
                )}
              </div>
            )}
            <div className="call-participant__info">
              <span className="call-participant__name">{mainSpeaker.name}</span>
              {mainSpeaker.isSpeaking && <span className="call-participant__speaking">говорит 🎤</span>}
            </div>
          </div>
        ) : (
          <div className="call-main-speaker__empty">Нет участников</div>
        )}
      </div>

      {/* Participants strip */}
      {others.length > 0 && (
        <div className="call-participants-strip">
          {others.map((p) => (
            <div key={p.id} className={`call-participant-mini ${p.isSpeaking ? 'call-participant-mini--speaking' : ''}`}>
              <div className="call-participant-mini__video">
                {p.videoOn ? (
                  <span className="call-participant-mini__avatar">{p.name[0]}</span>
                ) : (
                  <div className="call-participant-mini__avatar-lg">
                    {p.avatarUrl ? <img src={p.avatarUrl} alt={p.name} /> : <span>{p.name[0]}</span>}
                  </div>
                )}
              </div>
              <div className="call-participant-mini__chips">
                {p.isScreenSharing && <span className="chip chip--xs">🖥 Экран</span>}
                {p.isMuted && <span className="chip chip--xs">🔇</span>}
              </div>
              <span className="call-participant-mini__name">{p.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="call-controls">
        <button
          className={`call-control ${muted ? 'call-control--active' : ''}`}
          onClick={toggleMute}
          title={muted ? 'Включить микрофон' : 'Выключить микрофон'}
        >
          {muted ? '🔇' : '🎤'}
        </button>
        <button
          className={`call-control ${!videoOn ? 'call-control--active' : ''}`}
          onClick={toggleVideo}
          title={videoOn ? 'Выключить камеру' : 'Включить камеру'}
        >
          {videoOn ? '📹' : '📷'}
        </button>
        <button
          className={`call-control ${screenSharing ? 'call-control--active' : ''}`}
          onClick={toggleScreenShare}
          title={screenSharing ? 'Остановить демонстрацию' : 'Демонстрация экрана'}
        >
          🖥
        </button>
        <button className="call-control call-control--danger" onClick={endCall} title="Завершить звонок">
          📞
        </button>
      </div>
    </div>
  );
}
