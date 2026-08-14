// Reset Password Screen — восстановление пароля
// Макет: mockups/balloo-su/password-reset.html
// 4 шага: email -> captcha -> check email -> new password

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type ResetStep = 1 | 2 | 3 | 4;

function ResetPasswordScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState<ResetStep>(1);
  const [email, setEmail] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cyrillicChars = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШ';
  const rotations = [-45, -30, -20, -15, -10, -5, 0, 5, 10, 15, 20, 30, 45];
  const bgGradients = [
    ['#2d6a4f', '#40916c'], ['#3a0ca3', '#7209b7'], ['#1d3557', '#457b9d'],
    ['#6a040f', '#9d0208'], ['#003049', '#d62828'], ['#001219', '#dda15e'],
    ['#2b2d42', '#8d99ae'], ['#3d405b', '#556070'], ['#264653', '#2a9d8f'],
    ['#e76f51', '#f4a261'],
  ];

  const [captcha, setCaptcha] = useState('');
  const [captchaGradient, setCaptchaGradient] = useState('');

  const generateCaptcha = () => {
    const chars: string[] = [];
    const bg = bgGradients[Math.floor(Math.random() * bgGradients.length)];
    for (let i = 0; i < 6; i++) chars.push(cyrillicChars[Math.floor(Math.random() * cyrillicChars.length)]);
    setCaptcha(chars.join(''));
    setCaptchaGradient(`linear-gradient(135deg, ${bg[0]}, ${bg[1]})`);
  };

  React.useEffect(() => { generateCaptcha(); }, []);

  const goStep = (n: ResetStep) => { setError(''); setStep(n); };

  const handleRequestReset = async () => {
    if (!email.trim()) { setError('Введите email'); return; }
    setLoading(true);
    setError('');
    try {
      await new Promise(r => setTimeout(r, 500));
      goStep(2);
    } catch (err: any) {
      setError(err.message || 'Ошибка отправки');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCaptcha = () => {
    if (captchaCode.toUpperCase() !== captcha.toUpperCase()) {
      setError('Неверный код с картинки');
      generateCaptcha();
      return;
    }
    goStep(3);
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) { setError('Пароль минимум 8 символов'); return; }
    if (newPassword !== confirmPassword) { setError('Пароли не совпадают'); return; }
    setLoading(true);
    setError('');
    try {
      await new Promise(r => setTimeout(r, 1000));
      setSuccess('Пароль успешно сброшен!');
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err: any) {
      setError(err.message || 'Ошибка сброса пароля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ width: '80px', height: '80px', fontSize: '36px', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔑</div>
        <h1 className="auth-title">Восстановление пароля</h1>

        {step === 1 && (
          <div style={{ maxWidth: 'none' }}>
            <p className="auth-subtitle">Введите email — мы отправим ссылку для сброса пароля</p>
            <div className="form-group">
              <input type="email" className="form-input" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleRequestReset(); }} />
            </div>
            {error && <p className="text-sm" style={{ color: 'var(--danger)', marginBottom: '12px', textAlign: 'center' }}>{error}</p>}
            <button className="btn btn--primary btn--block" onClick={handleRequestReset} disabled={loading} style={{ opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Отправка...' : 'Далее'}
            </button>
            <div className="auth-divider" />
            <button className="btn btn--tertiary btn--block" onClick={() => navigate('/login')}>← Вернуться ко входу</button>
          </div>
        )}

        {step === 2 && (
          <div style={{ maxWidth: 'none' }}>
            <p className="auth-subtitle">Подтвердите, что вы не робот</p>
            <div className="card captcha-container" style={{ padding: '20px', marginBottom: '16px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <div style={{ position: 'relative', height: '80px', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px', background: captchaGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                {captcha.split('').map((char, i) => {
                  const rot = rotations[Math.floor(Math.random() * rotations.length)];
                  return (
                    <span key={i} style={{ position: 'absolute', fontSize: '32px', fontWeight: 800, color: '#d8f3dc', fontFamily: "'JetBrains Mono', monospace", transform: `rotate(${rot}deg)`, left: `${12 + i * 38}px`, top: `${14 + Math.floor(Math.random() * 10)}px`, textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                      {char}
                    </span>
                  );
                })}
              </div>
              <div className="text-xs text-muted mb-2">Введите 6 символов, показанных на картинке</div>
              <div className="form-group" style={{ display: 'flex', gap: '8px' }}>
                <input type="text" className="form-input" placeholder="Введите капчу" style={{ flex: 1 }} value={captchaCode} onChange={(e) => setCaptchaCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyCaptcha(); }} />
                <button type="button" className="btn btn--secondary btn--sm" title="Сгенерировать новую капчу" onClick={generateCaptcha}>Другой</button>
              </div>
            </div>
            {error && <p className="text-sm" style={{ color: 'var(--danger)', marginBottom: '12px', textAlign: 'center' }}>{error}</p>}
            <button className="btn btn--primary btn--block" onClick={handleVerifyCaptcha}>Отправить ссылку</button>
            <button className="btn btn--tertiary btn--block mt-2" onClick={() => goStep(1)}>← Назад</button>
          </div>
        )}

        {step === 3 && (
          <div style={{ maxWidth: 'none' }}>
            <p className="auth-subtitle">Письмо отправлено. Перейдите по ссылке в письме, чтобы задать новый пароль.</p>
            <div className="card" style={{ background: 'var(--bg-tertiary)', padding: '16px', marginBottom: '16px' }}>
              <div className="text-sm text-secondary">📧 Проверьте почту: <strong style={{ color: 'var(--text-primary)' }}>{email}</strong></div>
              <div className="text-xs text-muted mt-2">Ссылка действительна 1 час.</div>
            </div>
            <button className="btn btn--secondary btn--block" onClick={() => goStep(4)}>Я перешёл по ссылке (демо)</button>
            <button className="btn btn--tertiary btn--block mt-2">Отправить повторно</button>
          </div>
        )}

        {step === 4 && (
          <div style={{ maxWidth: 'none' }}>
            <p className="auth-subtitle">Придумайте новый пароль</p>
            <div className="form-group">
              <label className="form-label">Новый пароль</label>
              <input type="password" className="form-input" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <div className="form-hint">Минимум 8 символов, цифры и буквы</div>
            </div>
            <div className="form-group">
              <label className="form-label">Повторите пароль</label>
              <input type="password" className="form-input" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            {error && <p className="text-sm" style={{ color: 'var(--danger)', marginBottom: '12px' }}>{error}</p>}
            {success && <p className="text-sm" style={{ color: 'var(--accent)', marginBottom: '12px' }}>{success}</p>}
            <button className="btn btn--primary btn--block" onClick={handleResetPassword} disabled={loading} style={{ opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Сброс...' : 'Сбросить пароль'}
            </button>
          </div>
        )}

        <div className="divider" />
        <div className="card" style={{ background: 'rgba(59,158,255,0.08)', borderColor: 'var(--info)', padding: '14px' }}>
          <div className="text-sm" style={{ color: 'var(--info)' }}>📧 Подтверждение email</div>
          <div className="text-xs text-secondary mt-2">Если email не подтверждён, функции ограничены. <a href="#" className="text-accent" onClick={(e) => { e.preventDefault(); }}>Отправить письмо подтверждения</a></div>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordScreen;
