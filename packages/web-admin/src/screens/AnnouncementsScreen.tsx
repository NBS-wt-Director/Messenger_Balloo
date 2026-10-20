// AnnouncementsScreen — управление объявлениями и баннерами в админ-панели
// CRUD объявлений: список, создание, редактирование, удаление, toggle active

import { useState, useEffect } from 'react';
import { api } from '@/services/api';

// --- Types ---
interface Announcement {
  id: string;
  title: string;
  content: string;
  audience: 'all' | 'employees' | 'admins';
  startDate: string;
  endDate: string;
  dismissible: boolean;
  status: 'active' | 'scheduled' | 'expired' | 'draft';
}

// --- Mock data ---
const AUDIENCE_LABELS: Record<string, string> = {
  all: 'Все пользователи',
  employees: 'Сотрудники',
  admins: 'Администраторы',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Активно',
  scheduled: 'Запланировано',
  expired: 'Истекло',
  draft: 'Черновик',
};

const STATUS_CHIP: Record<string, string> = {
  active: 'chip--accent',
  scheduled: 'chip--info',
  expired: 'chip--muted',
  draft: 'chip--warning',
};

// --- Create/Edit Modal ---
function AnnouncementFormModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Announcement, 'id' | 'status'>) => void;
  initial?: Announcement | null;
}) {
  const [title, setTitle] = useState(initial?.title || '');
  const [content, setContent] = useState(initial?.content || '');
  const [audience, setAudience] = useState<'all' | 'employees' | 'admins'>(initial?.audience || 'all');
  const [startDate, setStartDate] = useState(initial?.startDate || '');
  const [endDate, setEndDate] = useState(initial?.endDate || '');
  const [dismissible, setDismissible] = useState(initial?.dismissible ?? true);

  if (!open) return null;

  const handleSubmit = () => {
    if (!title.trim() || !content.trim() || !startDate || !endDate) return;
    onSave({ title: title.trim(), content: content.trim(), audience, startDate, endDate, dismissible });
    setTitle('');
    setContent('');
    setAudience('all');
    setStartDate('');
    setEndDate('');
    setDismissible(true);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          padding: 24,
          minWidth: 480,
          maxWidth: 600,
          animation: 'fadeIn 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>
          {initial ? 'Редактировать объявление' : 'Новое объявление'}
        </h3>

        {/* Title */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
            Заголовок
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Заголовок баннера"
            style={{
              width: '100%',
              padding: '8px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              color: 'var(--text-primary)',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'var(--font-primary)',
            }}
          />
        </div>

        {/* Content */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
            Текст
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Текст объявления..."
            rows={5}
            style={{
              width: '100%',
              padding: '8px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              color: 'var(--text-primary)',
              fontSize: 13,
              fontFamily: 'var(--font-primary)',
              lineHeight: 1.5,
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Audience */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
            Аудитория
          </label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as 'all' | 'employees' | 'admins')}
            style={{
              width: '100%',
              padding: '8px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              color: 'var(--text-primary)',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'var(--font-primary)',
              cursor: 'pointer',
            }}
          >
            <option value="all">Все пользователи</option>
            <option value="employees">Сотрудники</option>
            <option value="admins">Администраторы</option>
          </select>
        </div>

        {/* Period */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
            Период
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="С: дд.мм.гггг"
              style={{
                flex: 1,
                padding: '8px 14px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                color: 'var(--text-primary)',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'var(--font-primary)',
              }}
            />
            <input
              type="text"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="По: дд.мм.гггг"
              style={{
                flex: 1,
                padding: '8px 14px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                color: 'var(--text-primary)',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'var(--font-primary)',
              }}
            />
          </div>
        </div>

        {/* Dismissible */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={dismissible}
              onChange={(e) => setDismissible(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Можно закрыть пользователем</span>
          </label>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            className="btn btn--tertiary btn--sm"
            style={{ fontFamily: 'var(--font-primary)' }}
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim() || !startDate || !endDate}
            className="btn btn--primary btn--sm"
            style={{
              fontFamily: 'var(--font-primary)',
              opacity: !title.trim() || !content.trim() || !startDate || !endDate ? 0.5 : 1,
            }}
          >
            {initial ? 'Сохранить' : 'Опубликовать'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Delete Confirmation Modal ---
function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
}) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ padding: 24, minWidth: 360, animation: 'fadeIn 0.2s ease' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
          Удалить объявление?
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
          Вы уверены, что хотите удалить объявление «{title}»? Это действие нельзя отменить.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn--tertiary btn--sm" style={{ fontFamily: 'var(--font-primary)' }}>
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className="btn btn--danger btn--sm"
            style={{ fontFamily: 'var(--font-primary)' }}
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main Screen ---
export function AnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnnouncements().then((res) => {
      setAnnouncements(res || []);
      setLoading(false);
    }).catch(() => {
      setAnnouncements([]);
      setLoading(false);
    });
  }, []);
  const [formModal, setFormModal] = useState<{ open: boolean; initial: Announcement | null }>({
    open: false,
    initial: null,
  });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; announcement: Announcement | null }>({
    open: false,
    announcement: null,
  });
  const [filter, setFilter] = useState<string>('all');

  const filtered = announcements.filter((a) => filter === 'all' || a.status === filter);

  const handleOpenCreate = () => setFormModal({ open: true, initial: null });
  const handleOpenEdit = (a: Announcement) => setFormModal({ open: true, initial: a });
  const handleOpenDelete = (a: Announcement) => setDeleteModal({ open: true, announcement: a });

  const handleSave = (data: Omit<Announcement, 'id' | 'status'>) => {
    if (formModal.initial) {
      // Edit
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === formModal.initial!.id
            ? { ...a, ...data }
            : a
        )
      );
    } else {
      // Create
      const newAnn: Announcement = {
        ...data,
        id: `ann-${Date.now()}`,
        status: 'active',
      };
      setAnnouncements((prev) => [newAnn, ...prev]);
    }
    setFormModal({ open: false, initial: null });
  };

  const handleDelete = () => {
    if (!deleteModal.announcement) return;
    setAnnouncements((prev) => prev.filter((a) => a.id !== deleteModal.announcement!.id));
    setDeleteModal({ open: false, announcement: null });
  };

  const handleToggleStatus = (announcement: Announcement) => {
    const newStatus = announcement.status === 'active' ? 'expired' : 'active';
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === announcement.id ? { ...a, status: newStatus } : a))
    );
  };

  return (
    <div className="page-container fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            📢 Объявления и баннеры
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Управление объявлениями для пользователей
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="btn btn--primary"
          style={{ fontFamily: 'var(--font-primary)' }}
        >
          + Создать
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {[
          { key: 'all', label: 'Все' },
          { key: 'active', label: 'Активно' },
          { key: 'scheduled', label: 'Запланировано' },
          { key: 'expired', label: 'Истекло' },
          { key: 'draft', label: 'Черновик' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderRadius: 4,
              background: filter === f.key ? 'var(--accent)' : 'var(--bg-secondary)',
              color: filter === f.key ? '#fff' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'var(--font-primary)',
              transition: 'all 0.15s ease',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Announcements Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                  Заголовок
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                  Аудитория
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                  Период
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                  Статус
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                  Закрытие
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  className="table__row"
                  style={{ transition: 'background 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {a.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.content}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
                    {AUDIENCE_LABELS[a.audience]}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {a.startDate} — {a.endDate}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`chip ${STATUS_CHIP[a.status]}`}>
                      {STATUS_LABELS[a.status]}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{ fontSize: 12, color: a.dismissible ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {a.dismissible ? '✅ Да' : '❌ Нет'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleToggleStatus(a)}
                        className="btn btn--tertiary btn--sm"
                        style={{ fontFamily: 'var(--font-primary)', padding: '4px 10px' }}
                        title={a.status === 'active' ? 'Деактивировать' : 'Активировать'}
                      >
                        {a.status === 'active' ? '⏸' : '▶️'}
                      </button>
                      <button
                        onClick={() => handleOpenEdit(a)}
                        className="btn btn--tertiary btn--sm"
                        style={{ fontFamily: 'var(--font-primary)', padding: '4px 10px' }}
                        title="Редактировать"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleOpenDelete(a)}
                        className="btn btn--danger btn--sm"
                        style={{ fontFamily: 'var(--font-primary)', padding: '4px 10px' }}
                        title="Удалить"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📢</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Нет объявлений в этой категории</div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnnouncementFormModal
        open={formModal.open}
        onClose={() => setFormModal({ open: false, initial: null })}
        onSave={handleSave}
        initial={formModal.initial}
      />

      {/* Delete Modal */}
      <DeleteConfirmModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, announcement: null })}
        onConfirm={handleDelete}
        title={deleteModal.announcement?.title || ''}
      />
    </div>
  );
}
