// VoiceMessageModal — модалка записи голосового сообщения
// Макет: mockups/balloo-su/voice-message.html (1_01_39)
// 4 состояния: idle → recording → preview → sending
// Web Audio API + MediaRecorder для реальной записи

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { api } from '@/services/api';

type VoiceState = 'idle' | 'recording' | 'preview' | 'sending';

interface VoiceMessageModalProps {
  open: boolean;
  chatId: string;
  onClose: () => void;
  onSent: () => void;
}

const MAX_DURATION = 600; // 10 минут
const WAVEFORM_BARS = 40;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const VoiceMessageModal: React.FC<VoiceMessageModalProps> = ({
  open,
  chatId,
  onClose,
  onSent,
}) => {
  const [state, setState] = useState<VoiceState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [volume, setVolume] = useState(0);
  const [waveformHeights, setWaveformHeights] = useState<number[]>([]);
  const [previewWaveform, setPreviewWaveform] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [transcribe, setTranscribe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on close
  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current = null;
    }
    setState('idle');
    setElapsed(0);
    setVolume(0);
    setWaveformHeights([]);
    setPreviewWaveform([]);
    setIsPlaying(false);
    setPlayProgress(0);
    setError(null);
    audioChunksRef.current = [];
    audioBlobRef.current = null;
  }, []);

  const handleClose = useCallback(() => {
    cleanup();
    onClose();
  }, [cleanup, onClose]);

  // Stop timer when max duration reached
  useEffect(() => {
    if (elapsed >= MAX_DURATION && state === 'recording') {
      stopRecording();
    }
  }, [elapsed, state]);

  // Generate random waveform bars for preview
  const generatePreviewWaveform = useCallback(() => {
    const bars = Array.from({ length: WAVEFORM_BARS }, () => Math.random() * 56 + 8);
    setPreviewWaveform(bars);
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Web Audio API for visualization
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
        ? 'audio/ogg;codecs=opus'
        : 'audio/webm;codecs=opus';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        audioBlobRef.current = blob;
        generatePreviewWaveform();
        setState('preview');
        // Stop stream tracks
        stream.getTracks().forEach((t) => t.stop());
        audioCtx.close();
      };

      recorder.start(250);
      setState('recording');
      setElapsed(0);
      setWaveformHeights(Array.from({ length: WAVEFORM_BARS }, () => 8));

      // Timer
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);

      // Volume + waveform animation
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const animate = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const vol = Math.min((avg / 255) * 100, 100);
        setVolume(vol);

        // Shift waveform bars and add new one
        setWaveformHeights((prev) => {
          const next = [...prev.slice(1), Math.max(8, (avg / 255) * 64 + 4)];
          return next;
        });

        animFrameRef.current = requestAnimationFrame(animate);
      };
      animate();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Нет доступа к микрофону';
      setError(message);
    }
  }, [generatePreviewWaveform]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Cancel recording
  const cancelRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setState('idle');
    setElapsed(0);
    setVolume(0);
    setWaveformHeights([]);
  }, []);

  // Toggle playback of recorded audio
  const togglePlayback = useCallback(() => {
    if (!audioBlobRef.current) return;

    if (isPlaying) {
      audioElRef.current?.pause();
      setIsPlaying(false);
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
      return;
    }

    const url = URL.createObjectURL(audioBlobRef.current);
    const audio = new Audio(url);
    audio.playbackRate = playbackSpeed;
    audioElRef.current = audio;

    audio.onended = () => {
      setIsPlaying(false);
      setPlayProgress(0);
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };

    audio.play().then(() => {
      setIsPlaying(true);
      setPlayProgress(0);
      playIntervalRef.current = setInterval(() => {
        setPlayProgress((prev) => {
          if (audio.duration && !isNaN(audio.duration)) {
            const pct = (audio.currentTime / audio.duration) * 100;
            if (pct >= 100) return 0;
            return pct;
          }
          return prev + 2;
        });
      }, 200);
    });
  }, [isPlaying, playbackSpeed]);

  // Send voice message
  const sendVoice = useCallback(async () => {
    if (!audioBlobRef.current) return;
    setState('sending');

    try {
      const file = new File([audioBlobRef.current], 'voice.ogg', {
        type: audioBlobRef.current.type,
      });
      const res = await api.uploadFile(file, chatId);
      const d = res?.data ?? res;

      await api.sendMessage(chatId, {
        type: 'voice',
        content: '',
        attachments: [{
          type: 'audio',
          url: d.url,
          size: audioBlobRef.current.size,
          duration: elapsed,
          name: 'voice.ogg',
        }],
      });

      onSent();
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка отправки';
      setError(message);
      setState('preview');
    }
  }, [chatId, onSent, handleClose]);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div className="modal-overlay" onClick={handleClose} />

      {/* Modal */}
      <div className="modal modal--status-info" style={{ width: 480 }}>
        <div className="modal__header">
          <span className="modal__title">🎤 Запись голосового сообщения</span>
          <div className="modal__close" onClick={handleClose}>✕</div>
        </div>

        <div className="modal__body">
          {error && (
            <div style={{ color: 'var(--danger)', marginBottom: 12, fontSize: 14 }}>
              ⚠ {error}
            </div>
          )}

          {/* State 1: Idle */}
          {state === 'idle' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div
                style={{
                  width: 120,
                  height: 120,
                  margin: '0 auto 20px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 48,
                }}
                onClick={startRecording}
              >
                🎤
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                Нажмите для записи
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                Удерживайте для записи голосового сообщения
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                Максимум: 10 минут · OGG формат
              </div>
            </div>
          )}

          {/* State 2: Recording */}
          {state === 'recording' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              {/* Timer */}
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 800,
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--danger)',
                }}
              >
                {formatTime(elapsed)}
              </div>

              {/* Waveform visualization */}
              <div
                style={{
                  height: 80,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  margin: '20px 0',
                }}
              >
                {waveformHeights.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      width: 3,
                      height: h,
                      background: 'var(--accent)',
                      borderRadius: 2,
                      transition: 'height 0.1s',
                    }}
                  />
                ))}
              </div>

              {/* Volume meter */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Громкость
                </div>
                <div
                  style={{
                    height: 8,
                    background: 'var(--bg-tertiary)',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${volume}%`,
                      background: 'var(--accent)',
                      borderRadius: 4,
                      transition: 'width 0.1s',
                    }}
                  />
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                <button className="btn btn--tertiary" onClick={cancelRecording}>
                  🗑 Отмена
                </button>
                <button
                  className="btn btn--icon"
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'var(--danger)',
                    color: '#fff',
                    fontSize: 24,
                    animation: 'voice-pulse 1.5s infinite',
                  }}
                  onClick={stopRecording}
                >
                  ⏹
                </button>
                <button className="btn btn--tertiary" onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 1.5 : 1)}>
                  {playbackSpeed}x
                </button>
              </div>
            </div>
          )}

          {/* State 3: Preview */}
          {state === 'preview' && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                🎧 Прослушать
              </div>

              {/* Playback controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <button className="btn btn--primary btn--icon" onClick={togglePlayback}>
                  {isPlaying ? '⏸' : '▶'}
                </button>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      background: 'var(--bg-tertiary)',
                      padding: 4,
                    }}
                  >
                    {previewWaveform.map((h, i) => {
                      const barProgress = (i / WAVEFORM_BARS) * 100;
                      const played = barProgress <= playProgress;
                      return (
                        <div
                          key={i}
                          style={{
                            width: 3,
                            height: h,
                            background: played ? 'var(--accent)' : 'var(--border-strong)',
                            borderRadius: 2,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {formatDuration(elapsed)}
                </span>
              </div>

              {/* Speed controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0.5, 1, 1.5, 2].map((speed) => (
                    <button
                      key={speed}
                      className={`btn btn--sm ${playbackSpeed === speed ? 'btn--primary' : 'btn--tertiary'}`}
                      onClick={() => setPlaybackSpeed(speed)}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>OGG · 128 kbps</span>
              </div>

              {/* Transcription */}
              <div className="form-group">
                <label className="form-label">Преобразовать в текст</label>
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={transcribe}
                    onChange={(e) => setTranscribe(e.target.checked)}
                  />
                  <span>Включить транскрипцию</span>
                </label>
              </div>

              {/* Default speed */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Скорость воспроизведения по умолчанию</label>
                <select
                  className="form-select"
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                >
                  <option value={1}>1x (нормальная)</option>
                  <option value={0.5}>0.5x (медленно)</option>
                  <option value={1.5}>1.5x (быстро)</option>
                  <option value={2}>2x (очень быстро)</option>
                </select>
              </div>
            </div>
          )}

          {/* State 4: Sending */}
          {state === 'sending' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📤</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                Отправка...
              </div>
              <div
                style={{
                  height: 8,
                  background: 'var(--bg-tertiary)',
                  borderRadius: 4,
                  overflow: 'hidden',
                  marginTop: 12,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: '60%',
                    background: 'var(--accent)',
                    borderRadius: 4,
                    animation: 'voice-pulse 1.5s infinite',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal__footer">
          <button className="btn btn--tertiary" onClick={handleClose}>
            {state === 'recording' ? '🗑 Отмена' : 'Отмена'}
          </button>
          {state === 'preview' && (
            <button className="btn btn--primary" onClick={sendVoice}>
              ➤ Отправить
            </button>
          )}
        </div>
      </div>

      {/* Pulse animation keyframes (injected once) */}
      <style>{`
        @keyframes voice-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
      `}</style>
    </>
  );
};

export default VoiceMessageModal;
