// DesktopStoriesScreen — stories viewer with desktop controls
// Mockup: mockups/desktop/stories.html (1_09_12)

import React, { useState, useEffect } from 'react';
import { api } from '@balloo/web/services/api';

interface Story {
  id: string;
  authorName: string;
  authorAvatar?: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  createdAt: number;
  viewed: boolean;
}

export function DesktopStoriesScreen() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getStories();
        setStories(Array.isArray(res) ? res : []);
      } catch { /* no stories */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (activeIndex < 0) return;
    if (e.key === 'ArrowRight' && activeIndex < stories.length - 1) setActiveIndex(activeIndex + 1);
    if (e.key === 'ArrowLeft' && activeIndex > 0) setActiveIndex(activeIndex - 1);
    if (e.key === 'Escape') setActiveIndex(-1);
  };

  if (loading) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>Загрузка…</div>;

  if (activeIndex >= 0 && stories[activeIndex]) {
    const story = stories[activeIndex];
    return (
      <div style={styles.viewer} tabIndex={0} onKeyDown={handleKeyDown}>
        <div style={styles.viewerHeader}>
          <span style={{ fontWeight: 600 }}>{story.authorName}</span>
          <button onClick={() => setActiveIndex(-1)} style={styles.closeBtn}>✕</button>
        </div>
        <div style={styles.progress}>
          {stories.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, background: i <= activeIndex ? 'var(--accent, #2db84d)' : 'rgba(255,255,255,0.3)' }} />
          ))}
        </div>
        <div style={styles.media}>
          {story.mediaType === 'video' ? <video src={story.mediaUrl} autoPlay controls style={{ maxWidth: '100%', maxHeight: '100%' }} /> : <img src={story.mediaUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ margin: '0 0 16px', fontSize: 20, color: 'var(--text-primary, #fff)' }}>📖 Истории</h2>
      {stories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary, #8a8aa0)' }}>Нет активных историй</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
          {stories.map((s, i) => (
            <div key={s.id} onClick={() => setActiveIndex(i)} style={{ cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 8px', border: s.viewed ? '2px solid var(--border-color, #333)' : '2px solid var(--accent, #2db84d)', overflow: 'hidden' }}>
                {s.authorAvatar ? <img src={s.authorAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: 'var(--bg-tertiary, #2a2a3a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.authorName[0]}</div>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-primary, #fff)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.authorName}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  viewer: { position: 'fixed', inset: 0, background: '#000', zIndex: 1000, display: 'flex', flexDirection: 'column', outline: 'none' },
  viewerHeader: { display: 'flex', justifyContent: 'space-between', padding: '12px 16px', color: '#fff' },
  closeBtn: { background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' },
  progress: { display: 'flex', gap: 4, padding: '0 16px' },
  media: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
};
