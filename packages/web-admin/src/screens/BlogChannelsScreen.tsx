// BlogChannelsScreen — управление каналами блога (админка)
// Таблица каналов, фильтры, модальные окна: создание, редактирование, удаление, миграция

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/services/api';

// --- Types ---
interface Channel {
  id: string;
  name: string;
  icon: string;
  type: 'corporate' | 'personal';
  ownerName: string;
  ownerInitials: string;
  authors: string[];
  moderators: string[];
  postCount: number;
  subscriberCount: number;
  viewCount: number;
  likeCount: number;
  status: 'active' | 'archived' | 'needs-resolution';
  isDismissed?: boolean;
  topPosts?: { title: string; views: number }[];
}

type FilterType = 'all' | 'corporate' | 'personal';

// --- Constants ---
const FILTERS: { key: FilterType; label: string; count?: number }[] = [
  { key: 'all', label: 'Все', count: 7 },
  { key: 'corporate', label: 'Корпоративные', count: 4 },
  { key: 'personal', label: 'Личные', count: 3 },
];

const STATUS_CHIP_STYLES: Record<string, React.CSSProperties> = {
  active: { background: 'rgba(45, 184, 77, 0.15)', color: 'var(--accent)', borderColor: 'var(--accent)' },
  archived: {},
  'needs-resolution': { background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', borderColor: 'var(--danger)' },
};

const TYPE_CHIP_STYLES: Record<string, React.CSSProperties> = {
  corporate: { background: 'rgba(45, 184, 77, 0.15)', color: 'var(--accent)', borderColor: 'var(--accent)' },
  personal: { background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7', borderColor: '#a855f7' },
};

// --- Components ---

function Avatar({ initials, size = 'sm' }: { initials: string; size?: 'sm' }) {
  return (
    <div className={`avatar avatar--${size}`}>
      <div className="avatar__inner"><span>{initials}</span></div>
    </div>
  );
}

function Chip({ children, style, className }: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <span className={`chip ${className || ''}`} style={style}>
      {children}
    </span>
  );
}

function Button({ children, variant = 'tertiary', size = 'sm', onClick, disabled, style }: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'tertiary';
  size?: 'sm' | 'md';
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  const variantClass = `btn btn--${variant}`;
  const sizeClass = `btn--${size}`;
  return (
    <button
      className={`${variantClass} ${sizeClass}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
}

function Modal({ title, onClose, children, variant = 'info' }: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  variant?: 'info' | 'warning' | 'danger';
}) {
  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className={`modal modal--status-${variant}`} id={`modal-${variant}`}>
        <div className="modal__header">
          <span className="modal__title">{title}</span>
          <div className="modal__close" onClick={onClose}>✕</div>
        </div>
        <div className="modal__body">{children}</div>
        <div className="modal__footer">
          <Button variant="tertiary" onClick={onClose}>Отмена</Button>
        </div>
      </div>
    </>
  );
}

function FormInput({ label, placeholder, value, onChange, type = 'text' }: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        type={type}
        className="form-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function FormTextarea({ label, placeholder, value, onChange, minHeight = 60 }: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  minHeight?: number;
}) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <textarea
        className="form-textarea"
        placeholder={placeholder}
        style={{ minHeight }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function FormSelect({ label, children, value, onChange, hint }: {
  label: string;
  children: React.ReactNode;
  value?: string;
  onChange?: (v: string) => void;
  hint?: string;
}) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <select className="form-select" value={value} onChange={(e) => onChange?.(e.target.value)}>
        {children}
      </select>
      {hint && <div className="form-hint">{hint}</div>}
    </div>
  );
}

function FormCheckbox({ label, checked, onChange, children }: {
  label?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="form-group">
      <label className="form-checkbox">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>{label || children}</span>
      </label>
    </div>
  );
}

// --- Main Screen ---

export function BlogChannelsScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [newChannelModal, setNewChannelModal] = useState(false);
  const [grantChannelModal, setGrantChannelModal] = useState(false);
  const [editChannelModal, setEditChannelModal] = useState<Channel | null>(null);
  const [authorsModal, setAuthorsModal] = useState<Channel | null>(null);
  const [migrateModal, setMigrateModal] = useState<Channel | null>(null);
  const [deleteModal, setDeleteModal] = useState<Channel | null>(null);
  const [statsModal, setStatsModal] = useState<Channel | null>(null);

  // Form states
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelSlug, setNewChannelSlug] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [newChannelIcon, setNewChannelIcon] = useState('📰');
  const [grantEmployee, setGrantEmployee] = useState('');
  const [grantChannelName, setGrantChannelName] = useState('');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editVisible, setEditVisible] = useState(true);
  const [deleteAction, setDeleteAction] = useState('delete');
  const [deleteTargetChannel, setDeleteTargetChannel] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [migrateAction, setMigrateAction] = useState('migrate-posts');
  const [migrateTarget, setMigrateTarget] = useState('');

  const fetchChannels = useCallback(() => {
    setLoading(true);
    // Mock data — API endpoints будут добавлены в тикете backend
    setChannels([
      {
        id: 'ch1',
        name: 'Новости',
        icon: '📰',
        type: 'corporate',
        ownerName: 'Иван В.',
        ownerInitials: 'ИВ',
        authors: ['Иван В.', 'Алексей Д.'],
        moderators: ['Мария А.'],
        postCount: 24,
        subscriberCount: 1200,
        viewCount: 8500,
        likeCount: 342,
        status: 'active',
        topPosts: [
          { title: 'Релиз v1.0', views: 1200 },
          { title: 'Набор сотрудников', views: 890 },
          { title: 'Итоги квартала', views: 756 },
          { title: 'Новый офис', views: 654 },
          { title: 'Корпоратив', views: 543 },
        ],
      },
      {
        id: 'ch2',
        name: 'Технологии',
        icon: '⚙️',
        type: 'corporate',
        ownerName: 'Иван В.',
        ownerInitials: 'ИВ',
        authors: ['Иван В.'],
        moderators: [],
        postCount: 18,
        subscriberCount: 800,
        viewCount: 6200,
        likeCount: 210,
        status: 'active',
      },
      {
        id: 'ch3',
        name: 'Команда',
        icon: '👥',
        type: 'corporate',
        ownerName: 'Алексей Д.',
        ownerInitials: 'АД',
        authors: ['Алексей Д.'],
        moderators: [],
        postCount: 8,
        subscriberCount: 500,
        viewCount: 3100,
        likeCount: 95,
        status: 'active',
      },
      {
        id: 'ch4',
        name: 'Блог Ивана Воронова',
        icon: '🦊',
        type: 'personal',
        ownerName: 'Иван В. (владелец)',
        ownerInitials: 'ИВ',
        authors: ['Иван В.'],
        moderators: ['Иван В.'],
        postCount: 12,
        subscriberCount: 300,
        viewCount: 2400,
        likeCount: 120,
        status: 'active',
      },
      {
        id: 'ch5',
        name: 'Дизайн-блокнот Марии',
        icon: '🎨',
        type: 'personal',
        ownerName: 'Мария А. (владелец)',
        ownerInitials: 'МА',
        authors: ['Мария А.'],
        moderators: ['Мария А.'],
        postCount: 8,
        subscriberCount: 200,
        viewCount: 1800,
        likeCount: 85,
        status: 'active',
      },
      {
        id: 'ch6',
        name: 'DevOps заметки Алексея',
        icon: '🐳',
        type: 'personal',
        ownerName: 'Алексей Д. (владелец)',
        ownerInitials: 'АД',
        authors: ['Алексей Д.'],
        moderators: [],
        postCount: 6,
        subscriberCount: 150,
        viewCount: 1200,
        likeCount: 45,
        status: 'needs-resolution',
        isDismissed: true,
      },
      {
        id: 'ch7',
        name: 'Метрики',
        icon: '📊',
        type: 'corporate',
        ownerName: '—',
        ownerInitials: '',
        authors: [],
        moderators: [],
        postCount: 0,
        subscriberCount: 0,
        viewCount: 0,
        likeCount: 0,
        status: 'archived',
      },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const filteredChannels = channels.filter((ch) => {
    if (activeFilter === 'all') return true;
    return ch.type === activeFilter;
  });

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    // Mock
    const newCh: Channel = {
      id: `ch${Date.now()}`,
      name: newChannelName,
      icon: newChannelIcon,
      type: 'corporate',
      ownerName: 'Admin',
      ownerInitials: 'AD',
      authors: ['Admin'],
      moderators: [],
      postCount: 0,
      subscriberCount: 0,
      viewCount: 0,
      likeCount: 0,
      status: 'active',
    };
    setChannels((prev) => [...prev, newCh]);
    setNewChannelModal(false);
    setNewChannelName('');
    setNewChannelSlug('');
    setNewChannelDesc('');
    setNewChannelIcon('📰');
  };

  const handleGrantPersonalChannel = async () => {
    if (!grantEmployee || !grantChannelName.trim()) return;
    // Mock
    const newCh: Channel = {
      id: `ch${Date.now()}`,
      name: grantChannelName,
      icon: '👤',
      type: 'personal',
      ownerName: 'Сотрудник (владелец)',
      ownerInitials: 'СД',
      authors: ['Сотрудник'],
      moderators: ['Сотрудник'],
      postCount: 0,
      subscriberCount: 0,
      viewCount: 0,
      likeCount: 0,
      status: 'active',
    };
    setChannels((prev) => [...prev, newCh]);
    setGrantChannelModal(false);
    setGrantEmployee('');
    setGrantChannelName('');
  };

  const handleEditChannel = async () => {
    if (!editChannelModal) return;
    // Mock
    setChannels((prev) =>
      prev.map((ch) =>
        ch.id === editChannelModal.id
          ? { ...ch, name: editName }
          : ch
      )
    );
    setEditChannelModal(null);
  };

  const handleDeleteChannel = async () => {
    if (!deleteModal) return;
    if (!confirmDelete) return;
    setChannels((prev) => prev.filter((ch) => ch.id !== deleteModal.id));
    setDeleteModal(null);
    setConfirmDelete(false);
    setDeleteAction('delete');
    setDeleteTargetChannel('');
  };

  const handleMigrateChannel = async () => {
    if (!migrateModal) return;
    // Mock: just change status
    setChannels((prev) =>
      prev.map((ch) =>
        ch.id === migrateModal.id
          ? { ...ch, status: migrateAction === 'archive' ? 'archived' as const : ch.status }
          : ch
      )
    );
    setMigrateModal(null);
    setMigrateAction('migrate-posts');
    setMigrateTarget('');
  };

  const handleArchiveRestore = async (channel: Channel) => {
    setChannels((prev) =>
      prev.map((ch) =>
        ch.id === channel.id ? { ...ch, status: 'active' as const } : ch
      )
    );
  };

  return (
    <div className="page-container">
      <h1 className="page-title">📡 Каналы блога</h1>
      <p className="page-subtitle">Корпоративные и личные каналы сотрудников</p>

      {/* Filters */}
      <div className="flex gap-2 mb-6" style={{ flexWrap: 'wrap' }}>
        {FILTERS.map((filter) => (
          <Button
            key={filter.key}
            variant={activeFilter === filter.key ? 'primary' : 'tertiary'}
            size="sm"
            onClick={() => setActiveFilter(filter.key)}
          >
            {filter.label}
            {filter.count !== undefined && (
              <span style={{ marginLeft: '4px', opacity: 0.8 }}>{filter.count}</span>
            )}
          </Button>
        ))}
        <Button variant="tertiary" size="sm" onClick={() => setNewChannelModal(true)}>
          ➕ Создать канал
        </Button>
        <Button variant="tertiary" size="sm" onClick={() => setGrantChannelModal(true)}>
          👤 Выдать личный канал
        </Button>
      </div>

      {/* Channels table */}
      <div className="card mb-4">
        <table className="table">
          <thead>
            <tr>
              <th>Канал</th>
              <th>Тип</th>
              <th>Владелец / Авторы</th>
              <th>Модераторы</th>
              <th>Статей</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>
                  <div className="spinner" style={{ margin: '0 auto' }} />
                </td>
              </tr>
            ) : filteredChannels.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                  Нет каналов в этой категории
                </td>
              </tr>
            ) : (
              filteredChannels.map((channel) => (
                <tr key={channel.id} className="table__row">
                  <td>
                    <strong style={{ color: channel.status === 'archived' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                      {channel.icon} {channel.name}
                    </strong>
                  </td>
                  <td>
                    <Chip style={TYPE_CHIP_STYLES[channel.type]}>
                      {channel.type === 'corporate' ? 'Корпоративный' : 'Личный'}
                    </Chip>
                  </td>
                  <td className="text-xs" style={{ maxWidth: 200 }}>
                    {channel.ownerName}
                    {channel.isDismissed && (
                      <Chip className="chip--danger text-xs" style={{ marginLeft: '4px' }}>уволен</Chip>
                    )}
                  </td>
                  <td className="text-xs" style={{ maxWidth: 120 }}>
                    {channel.moderators.length > 0 ? channel.moderators.join(', ') : '—'}
                  </td>
                  <td>{channel.postCount}</td>
                  <td>
                    <Chip style={STATUS_CHIP_STYLES[channel.status]}>
                      {channel.status === 'active' ? 'Активен' : channel.status === 'archived' ? 'Архив' : 'Требует решения'}
                    </Chip>
                  </td>
                  <td>
                    <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                      {/* Corporate channel actions */}
                      {channel.type === 'corporate' && (
                        <>
                          <Button variant="tertiary" size="sm" onClick={() => {
                            setEditChannelModal(channel);
                            setEditName(channel.name);
                            setEditDesc('');
                            setEditVisible(true);
                          }}>✏</Button>
                          <Button variant="tertiary" size="sm" onClick={() => setAuthorsModal(channel)}>👥</Button>
                          <Button variant="tertiary" size="sm" onClick={() => setStatsModal(channel)}>📊</Button>
                          <Button variant="danger" size="sm" onClick={() => {
                            setDeleteModal(channel);
                            setConfirmDelete(false);
                            setDeleteAction('delete');
                          }}>🗑</Button>
                        </>
                      )}
                      {/* Personal channel actions */}
                      {channel.type === 'personal' && (
                        <>
                          <Button variant="danger" size="sm" onClick={() => setMigrateModal(channel)}>
                            {channel.isDismissed ? '🔄 Миграция' : '🔄'}
                          </Button>
                          <Button variant="tertiary" size="sm" onClick={() => setStatsModal(channel)}>📊</Button>
                        </>
                      )}
                      {/* Archived */}
                      {channel.status === 'archived' && (
                        <Button variant="tertiary" size="sm" onClick={() => handleArchiveRestore(channel)}>
                          ♻️ Восстановить
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-secondary">
        💡 Личные каналы: компания не может удалять посты автора. При увольнении — миграция постов или передача канала.
      </p>

      {/* ===== Modals ===== */}

      {/* New corporate channel */}
      {newChannelModal && (
        <Modal title="Новый корпоративный канал" onClose={() => setNewChannelModal(false)}>
          <FormInput label="Название" placeholder="Например: Новости" value={newChannelName} onChange={setNewChannelName} />
          <FormInput label="URL-слаг" placeholder="novosti" value={newChannelSlug} onChange={setNewChannelSlug} />
          <FormTextarea label="Описание" placeholder="Описание канала…" value={newChannelDesc} onChange={setNewChannelDesc} />
          <FormInput label="Иконка (эмодзи)" placeholder="📰" value={newChannelIcon} onChange={setNewChannelIcon} />
          <div className="modal__footer" style={{ marginTop: 16 }}>
            <Button variant="tertiary" onClick={() => setNewChannelModal(false)}>Отмена</Button>
            <Button variant="primary" onClick={handleCreateChannel}>Создать</Button>
          </div>
        </Modal>
      )}

      {/* Grant personal channel */}
      {grantChannelModal && (
        <Modal title="Выдать личный канал" onClose={() => setGrantChannelModal(false)}>
          <FormSelect
            label="Сотрудник"
            value={grantEmployee}
            onChange={setGrantEmployee}
            hint="Сотрудник станет автором и модератором своего канала"
          >
            <option value="">Выберите сотрудника</option>
            <option value="u1">Иван Воронов (Lead Developer)</option>
            <option value="u2">Мария Андреева (UI/UX Designer)</option>
            <option value="u3">Алексей Дроздов (DevOps)</option>
          </FormSelect>
          <FormInput label="Название канала" placeholder="Блог Ивана Воронова" value={grantChannelName} onChange={setGrantChannelName} />
          <div className="modal__footer" style={{ marginTop: 16 }}>
            <Button variant="tertiary" onClick={() => setGrantChannelModal(false)}>Отмена</Button>
            <Button variant="primary" onClick={handleGrantPersonalChannel}>Выдать канал</Button>
          </div>
        </Modal>
      )}

      {/* Edit channel */}
      {editChannelModal && (
        <Modal title="Редактировать канал" onClose={() => setEditChannelModal(null)}>
          <FormInput label="Название" value={editName} onChange={setEditName} />
          <FormTextarea label="Описание" value={editDesc} onChange={setEditDesc} />
          <div className="form-group">
            <label className="form-label">Видимость</label>
            <label className="switch">
              <input
                type="checkbox"
                checked={editVisible}
                onChange={(e) => setEditVisible(e.target.checked)}
              />
              <span className="switch__slider" />
            </label>
          </div>
          <div className="modal__footer" style={{ marginTop: 16 }}>
            <Button variant="tertiary" onClick={() => setEditChannelModal(null)}>Отмена</Button>
            <Button variant="primary" onClick={handleEditChannel}>Сохранить</Button>
          </div>
        </Modal>
      )}

      {/* Assign authors/moderators */}
      {authorsModal && (
        <Modal title={`Авторы и модераторы — ${authorsModal.name}`} onClose={() => setAuthorsModal(null)}>
          <h4 className="text-sm font-bold mb-2">Авторы</h4>
          <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
            {authorsModal.authors.map((author) => (
              <Chip key={author} style={TYPE_CHIP_STYLES.corporate}>
                {author} ✕
              </Chip>
            ))}
            <Button variant="tertiary" size="sm">➕ Добавить автора</Button>
          </div>
          <h4 className="text-sm font-bold mb-2">Модераторы</h4>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            {authorsModal.moderators.map((mod) => (
              <Chip key={mod} style={TYPE_CHIP_STYLES.corporate}>
                {mod} ✕
              </Chip>
            ))}
            {authorsModal.moderators.length === 0 && (
              <span className="text-xs text-muted">Нет модераторов</span>
            )}
            <Button variant="tertiary" size="sm">➕ Добавить модератора</Button>
          </div>
          <div className="modal__footer" style={{ marginTop: 16 }}>
            <Button variant="primary" onClick={() => setAuthorsModal(null)}>Готово</Button>
          </div>
        </Modal>
      )}

      {/* Migrate posts */}
      {migrateModal && (
        <Modal
          title={`🔄 Миграция постов — ${migrateModal.name}`}
          onClose={() => setMigrateModal(null)}
          variant="warning"
        >
          <p className="text-sm text-secondary mb-4">
            {migrateModal.isDismissed
              ? 'Сотрудник уволен. Выберите действие для ' + migrateModal.postCount + ' постов в личном канале:'
              : 'Выберите действие для канала:'}
          </p>
          <div className="form-group">
            <label className="form-checkbox">
              <input
                type="radio"
                name="migrate"
                checked={migrateAction === 'migrate-posts'}
                onChange={() => setMigrateAction('migrate-posts')}
              />
              <span>Перенести посты в другой канал</span>
            </label>
            <select
              className="form-select mt-2"
              value={migrateTarget}
              onChange={(e) => setMigrateTarget(e.target.value)}
              style={{ display: migrateAction === 'migrate-posts' ? 'block' : 'none' }}
            >
              <option value="">Выберите канал</option>
              <option value="ch2">⚙️ Технологии (корпоративный)</option>
              <option value="ch1">📰 Новости (корпоративный)</option>
              <option value="ch3">👥 Команда (корпоративный)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-checkbox">
              <input
                type="radio"
                name="migrate"
                checked={migrateAction === 'transfer-owner'}
                onChange={() => setMigrateAction('transfer-owner')}
              />
              <span>Передать канал другому сотруднику</span>
            </label>
          </div>
          <div className="form-group">
            <label className="form-checkbox">
              <input
                type="radio"
                name="migrate"
                checked={migrateAction === 'archive'}
                onChange={() => setMigrateAction('archive')}
              />
              <span>Архивировать канал целиком</span>
            </label>
          </div>
          <div className="modal__footer" style={{ marginTop: 16 }}>
            <Button variant="tertiary" onClick={() => setMigrateModal(null)}>Отмена</Button>
            <Button variant="primary" onClick={handleMigrateChannel}>Применить</Button>
          </div>
        </Modal>
      )}

      {/* Delete channel */}
      {deleteModal && (
        <Modal
          title={`🗑 Удалить канал «${deleteModal.name}»`}
          onClose={() => { setDeleteModal(null); setConfirmDelete(false); }}
          variant="danger"
        >
          <p className="text-sm text-secondary mb-4">
            Вы уверены, что хотите удалить канал «{deleteModal.name}»? Это действие необратимо.
          </p>
          <div className="form-group">
            <label className="form-label">
              Что делать с {deleteModal.postCount} оставшимися статьями?
            </label>
            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="radio"
                  name="delete-action"
                  checked={deleteAction === 'delete'}
                  onChange={() => setDeleteAction('delete')}
                />
                <span>Удалить все статьи</span>
              </label>
            </div>
            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="radio"
                  name="delete-action"
                  checked={deleteAction === 'archive'}
                  onChange={() => setDeleteAction('archive')}
                />
                <span>Перенести в архив</span>
              </label>
            </div>
            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="radio"
                  name="delete-action"
                  checked={deleteAction === 'migrate'}
                  onChange={() => setDeleteAction('migrate')}
                />
                <span>Перенести в другой канал</span>
              </label>
              <select
                className="form-select mt-2"
                value={deleteTargetChannel}
                onChange={(e) => setDeleteTargetChannel(e.target.value)}
                style={{ display: deleteAction === 'migrate' ? 'block' : 'none' }}
              >
                <option value="">Выберите канал</option>
                <option value="ch2">⚙️ Технологии</option>
                <option value="ch3">👥 Команда</option>
              </select>
            </div>
          </div>
          <FormCheckbox
            label="Я подтверждаю удаление"
            checked={confirmDelete}
            onChange={setConfirmDelete}
          />
          <div className="modal__footer" style={{ marginTop: 16 }}>
            <Button variant="tertiary" onClick={() => { setDeleteModal(null); setConfirmDelete(false); }}>Отмена</Button>
            <Button
              variant="danger"
              onClick={handleDeleteChannel}
              disabled={!confirmDelete}
            >
              🗑 Удалить канал
            </Button>
          </div>
        </Modal>
      )}

      {/* Channel stats */}
      {statsModal && (
        <Modal
          title={`📊 Статистика канала «${statsModal.name}»`}
          onClose={() => setStatsModal(null)}
        >
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card__value">{statsModal.postCount}</div>
              <div className="stat-card__label">Статей</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{statsModal.subscriberCount > 999 ? `${(statsModal.subscriberCount / 1000).toFixed(1)}K` : statsModal.subscriberCount}</div>
              <div className="stat-card__label">Подписчиков</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{statsModal.viewCount > 999 ? `${(statsModal.viewCount / 1000).toFixed(1)}K` : statsModal.viewCount}</div>
              <div className="stat-card__label">Просмотров</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{statsModal.likeCount > 999 ? `${(statsModal.likeCount / 1000).toFixed(1)}K` : statsModal.likeCount}</div>
              <div className="stat-card__label">Лайков</div>
            </div>
          </div>
          {statsModal.topPosts && statsModal.topPosts.length > 0 && (
            <>
              <h4 className="text-sm font-bold mb-2 mt-4">Топ-5 статей</h4>
              {statsModal.topPosts.map((post, i) => {
                const maxViews = statsModal.topPosts![0].views;
                const width = (post.views / maxViews) * 100;
                const colors = ['var(--accent)', 'var(--info)', 'var(--warning)', 'var(--border-strong)', 'var(--text-muted)'];
                return (
                  <div key={i} className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>{post.title}</span>
                      <span className="text-accent">{post.views > 999 ? `${(post.views / 1000).toFixed(1)}K просм.` : `${post.views} просм.`}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-tertiary)' }}>
                      <div style={{ width: `${width}%`, height: '100%', background: colors[i] || colors[0] }} />
                    </div>
                  </div>
                );
              })}
            </>
          )}
          <div className="modal__footer" style={{ marginTop: 16 }}>
            <Button variant="tertiary" onClick={() => setStatsModal(null)}>Закрыть</Button>
            <Button variant="primary">📤 Экспорт</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
