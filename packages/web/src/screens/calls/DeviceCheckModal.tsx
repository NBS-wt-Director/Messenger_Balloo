// DeviceCheckModal — «Проверить оборудование» для экрана звонков
// (тик. 1795683301, подзадача C3).
//
// Проверяет микрофон, камеру и динамики средствами браузера:
//   • микрофон  — getUserMedia({audio}) + индикатор уровня громкости;
//   • камера    — getUserMedia({video}) + превью;
//   • динамики  — тестовый тон через Web Audio API.
// Ошибки объясняются по-русски, чтобы человек понимал, что делать: разрешить
// доступ, подключить устройство, освободить занятое устройство.

import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface DeviceCheckModalProps {
  open: boolean;
  onClose: () => void;
}

type CheckState = 'idle' | 'checking' | 'ok' | 'error';

interface CheckResult {
  state: CheckState;
  message: string;
}

const IDLE: CheckResult = { state: 'idle', message: 'Не проверялось' };

/** Понятное объяснение ошибки getUserMedia вместо кода браузера. */
function explainError(err: unknown, kind: 'микрофон' | 'камера'): string {
  const name = (err as { name?: string })?.name ?? '';
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return `Доступ к ${kind} запрещён. Разрешите доступ в настройках сайта (значок замка слева от адреса) и повторите проверку.`;
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return `Устройство не найдено: ${kind} не подключён. Подключите его и повторите проверку.`;
    case 'NotReadableError':
    case 'TrackStartError':
      return `${kind} занят другой программой. Закройте другие приложения, использующие устройство, и повторите.`;
    case 'OverconstrainedError':
      return 'Устройство не поддерживает запрошенные параметры. Попробуйте другое устройство.';
    default:
      return `Не удалось получить доступ к устройству (${name || 'неизвестная ошибка'}). Проверьте подключение и разрешения.`;
  }
}

export function DeviceCheckModal({ open, onClose }: DeviceCheckModalProps) {
  const [mic, setMic] = useState<CheckResult>(IDLE);
  const [cam, setCam] = useState<CheckResult>(IDLE);
  const [speaker, setSpeaker] = useState<CheckResult>(IDLE);
  const [level, setLevel] = useState(0);

  const micStreamRef = useRef<MediaStream | null>(null);
  const camStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const stopAll = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    camStreamRef.current?.getTracks().forEach((t) => t.stop());
    camStreamRef.current = null;
    if (audioCtxRef.current) {
      void audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setLevel(0);
  }, []);

  // Закрытие — обязательно освобождаем устройства, иначе индикатор камеры
  // продолжает гореть после закрытия модалки.
  useEffect(() => {
    if (!open) {
      stopAll();
      setMic(IDLE);
      setCam(IDLE);
      setSpeaker(IDLE);
    }
  }, [open, stopAll]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const checkMic = async () => {
    setMic({ state: 'checking', message: 'Запрашиваем доступ…' });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setMic({ state: 'ok', message: 'Микрофон работает — говорите, индикатор должен двигаться.' });

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i += 1) sum += buf[i];
        setLevel(Math.min(100, Math.round((sum / buf.length) * 1.8)));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (err) {
      setMic({ state: 'error', message: explainError(err, 'микрофон') });
    }
  };

  const checkCam = async () => {
    setCam({ state: 'checking', message: 'Запрашиваем доступ…' });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      camStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setCam({ state: 'ok', message: 'Камера работает — видите себя в превью.' });
    } catch (err) {
      setCam({ state: 'error', message: explainError(err, 'камера') });
    }
  };

  const checkSpeaker = async () => {
    setSpeaker({ state: 'checking', message: 'Проигрываем тестовый тон…' });
    try {
      const ctx = audioCtxRef.current ?? new AudioContext();
      audioCtxRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 440;
      gain.gain.value = 0.12;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      await new Promise((r) => setTimeout(r, 900));
      osc.stop();
      setSpeaker({ state: 'ok', message: 'Вы услышали тон? Значит динамики работают.' });
    } catch {
      setSpeaker({
        state: 'error',
        message: 'Не удалось воспроизвести звук. Проверьте громкость системы и выбранное устройство вывода.',
      });
    }
  };

  if (!open) return null;

  const stateColor = (s: CheckState) =>
    s === 'ok' ? 'var(--accent)' : s === 'error' ? '#e74c3c' : 'var(--text-secondary)';

  const stateIcon = (s: CheckState) =>
    s === 'ok' ? '✓' : s === 'error' ? '✕' : s === 'checking' ? '…' : '○';

  const row = (
    icon: string,
    title: string,
    result: CheckResult,
    onRun: () => void,
    extra?: React.ReactNode
  ) => (
    <div
      style={{
        border: '1px solid var(--border-color)',
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <strong style={{ fontSize: 15 }}>{title}</strong>
        <span style={{ marginLeft: 'auto', color: stateColor(result.state), fontWeight: 700 }}>
          {stateIcon(result.state)}
        </span>
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={onRun}
          disabled={result.state === 'checking'}
        >
          {result.state === 'idle' ? 'Проверить' : 'Повторить'}
        </button>
      </div>
      <div style={{ fontSize: 13, color: stateColor(result.state), lineHeight: 1.5 }}>
        {result.message}
      </div>
      {extra}
    </div>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="device-check-title"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 560,
          maxHeight: '85vh',
          overflowY: 'auto',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-strong, var(--border-color))',
          boxShadow: 'var(--shadow)',
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <h2 id="device-check-title" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
            🎛 Проверить оборудование
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="btn btn--ghost btn--sm"
            style={{ flexShrink: 0 }}
          >
            ✕
          </button>
        </div>

        <p style={{ marginTop: 12, marginBottom: 16, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
          Проверим микрофон, камеру и динамики до звонка — чтобы не выяснять это в разговоре.
          Доступ к устройствам запрашивает браузер; мы ничего не записываем и не отправляем.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {row('🎤', 'Микрофон', mic, checkMic, (
            <div
              aria-hidden="true"
              style={{ height: 8, background: 'var(--bg-tertiary)', overflow: 'hidden' }}
            >
              <div
                style={{
                  width: `${level}%`,
                  height: '100%',
                  background: level > 70 ? '#e74c3c' : 'var(--accent)',
                  transition: 'width 0.08s linear',
                }}
              />
            </div>
          ))}

          {row('📷', 'Камера', cam, checkCam, (
            <video
              ref={videoRef}
              muted
              playsInline
              style={{
                display: cam.state === 'ok' ? 'block' : 'none',
                width: '100%',
                maxHeight: 180,
                background: '#000',
                objectFit: 'cover',
              }}
            />
          ))}

          {row('🔊', 'Динамики', speaker, checkSpeaker)}
        </div>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <button type="button" className="btn btn--ghost" onClick={stopAll}>
            Освободить устройства
          </button>
          <button type="button" className="btn btn--primary" onClick={onClose}>
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}
