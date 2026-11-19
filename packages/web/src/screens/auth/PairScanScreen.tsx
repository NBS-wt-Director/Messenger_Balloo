// PairScanScreen — сканирование QR для подтверждения входа на новом устройстве
// (тик. 1795101592). Вторая половина pair-flow: здесь АВТОРИЗОВАННОЕ устройство
// сканирует QR с экрана нового устройства и подтверждает вход.
//
// Декодирование: BarcodeDetector (Chrome/Android, нативно) → фолбэк jsQR
// (Safari/Firefox) через canvas. Найденный balloo://pair/<token> уходит в
// POST /api/devices/pair/confirm — сервер создаёт Device и кладёт токены в Redis,
// новое устройство забирает их через опрос статуса.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';
import { AppTopbar } from '@/components/chrome/AppTopbar';
import { api } from '@/services/api';
import { parsePairDeepLink } from '@/utils/pairLink';

type Phase = 'starting' | 'scanning' | 'confirming' | 'done' | 'error';

function PairScanScreen() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const doneRef = useRef(false);

  const [phase, setPhase] = useState<Phase>('starting');
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const confirmToken = useCallback(
    async (token: string) => {
      if (doneRef.current) return;
      doneRef.current = true;
      setPhase('confirming');
      stopCamera();
      try {
        await api.confirmPair(token, 'web');
        setPhase('done');
      } catch (e: any) {
        doneRef.current = false;
        setError(e?.message || 'Не удалось подтвердить вход');
        setPhase('error');
      }
    },
    [stopCamera]
  );

  useEffect(() => {
    let cancelled = false;

    const scanLoop = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(scanLoop);
        return;
      }

      // Нативный BarcodeDetector, если есть (Chrome/Android)
      const BD = (window as any).BarcodeDetector;
      if (BD) {
        try {
          const detector = new BD({ formats: ['qr_code'] });
          const codes = await detector.detect(video);
          if (codes && codes.length > 0) {
            const token = parsePairDeepLink(codes[0].rawValue);
            if (token) return confirmToken(token);
          }
          if (!cancelled) rafRef.current = requestAnimationFrame(scanLoop);
          return;
        } catch {
          // падение детектора — уходим в jsQR-ветку ниже
        }
      }

      // Фолбэк: jsQR по кадру с canvas
      try {
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (w && h) {
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, w, h);
            const img = ctx.getImageData(0, 0, w, h);
            const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
            if (code?.data) {
              const token = parsePairDeepLink(code.data);
              if (token) return confirmToken(token);
            }
          }
        }
      } catch {
        // кадр не готов — просто ждём следующий
      }
      if (!cancelled) rafRef.current = requestAnimationFrame(scanLoop);
    };

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setPhase('scanning');
        rafRef.current = requestAnimationFrame(scanLoop);
      } catch (e: any) {
        if (cancelled) return;
        setError(
          e?.name === 'NotAllowedError'
            ? 'Нет доступа к камере. Разрешите доступ в браузере.'
            : 'Не удалось открыть камеру на этом устройстве.'
        );
        setPhase('error');
      }
    };

    start();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [confirmToken, stopCamera]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
      <AppTopbar title="Сканировать QR" />

      <div
        style={{
          maxWidth: '640px',
          width: '100%',
          margin: '0 auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div className="card text-center">
          <div className="card__title mb-2">📷 Наведите камеру на QR-код</div>
          <div className="text-sm text-secondary mb-4">
            Отсканируйте код с экрана нового устройства, чтобы подтвердить вход.
          </div>

          <div
            style={{
              position: 'relative',
              display: 'inline-block',
              background: '#000',
              maxWidth: '100%',
            }}
          >
            <video
              ref={videoRef}
              data-testid="pair-scan-video"
              playsInline
              muted
              style={{ width: '100%', maxWidth: '360px', display: 'block' }}
            />
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {phase === 'starting' && <div className="text-sm text-secondary mt-4">Открываем камеру…</div>}
          {phase === 'scanning' && <div className="text-sm text-secondary mt-4">Ищем QR-код…</div>}
          {phase === 'confirming' && <div className="text-sm text-secondary mt-4">Подтверждаем вход…</div>}
          {phase === 'done' && (
            <div className="text-sm mt-4" style={{ color: 'var(--accent)' }}>
              ✅ Вход подтверждён. Новое устройство входит…
            </div>
          )}
          {phase === 'error' && (
            <div className="text-sm mt-4" style={{ color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-center mt-6">
            <button type="button" className="btn btn--secondary" onClick={() => navigate(-1)}>
              Назад
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card__title">Как это работает</div>
          <div className="card__body">
            <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>На новом устройстве откройте экран входа и нажмите «Войти через другое устройство»</li>
              <li>На этом (уже авторизованном) устройстве отсканируйте показанный QR</li>
              <li>Подтвердите вход — новое устройство войдёт автоматически</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PairScanScreen;
