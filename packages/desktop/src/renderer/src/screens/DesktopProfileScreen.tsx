// DesktopProfileScreen — user profile view/edit
// Mockup: mockups/desktop/profile.html (1_09_19)

import React, { useState, useEffect } from 'react';
import { api } from '@balloo/web/services/api';
import { useAuthStore } from '@balloo/web/store/authStore';

export function DesktopProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const [name, setName] = useState(user?.displayName || '');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) { setName(user.displayName || ''); }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.updateMe({ displayName: name.trim(), bio: bio.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 24px', fontSize: 20, color: 'var(--text-primary, #fff)' }}>👤 Профиль</h2>

      {/* Avatar */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 96, height: 96, borderRadius: '50%', margin: '0 auto 12px', background: 'var(--bg-tertiary, #2a2a3a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, color: 'var(--text-primary, #fff)', overflow: 'hidden' }}>
          {user?.avatarUrl ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (user?.displayName?.slice(0, 2).toUpperCase() || '??')}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted, #666)' }}>@{user?.username || 'username'}</div>
      </div>

      {/* Fields */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Имя</label>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={64} style={inputStyle} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>О себе</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Расскажите о себе..." />
      </div>

      {user?.email && (
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Email</label>
          <input value={user.email} disabled style={{ ...inputStyle, opacity: 0.6 }} />
        </div>
      )}

      {error && <div style={{ color: 'var(--danger, #e53e3e)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
      <button onClick={handleSave} disabled={saving} style={btnStyle}>
        {saving ? 'Сохранение…' : saved ? '✅ Сохранено' : '💾 Сохранить'}
      </button>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary, #8a8aa0)', marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary, #2a2a3a)', border: '1px solid var(--border-color, #333)', color: 'var(--text-primary, #fff)', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
const btnStyle: React.CSSProperties = { width: '100%', padding: '10px 20px', background: 'var(--accent, #2db84d)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' };
