// Create Group Screen — создание группового чата
// Макет: mockups/balloo-su/group-create.html
// Функция: 0_01_05 — Создание групп

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useChatStore } from '@/store/chatStore';

interface Contact {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

type GroupType = 'private' | 'public' | 'topic' | 'media' | 'corporate';

interface GroupTypeConfig {
  id: GroupType;
  icon: string;
  title: string;
  description: string;
  maxMembers: string;
  features: string[];
  badge?: string;
}

const GROUP_TYPES: GroupTypeConfig[] = [
  {
    id: 'private',
    icon: '🔒',
    title: 'Обычная (закрытая)',
    description: 'Вход по приглашению',
    maxMembers: '1 000',
    features: ['Закрытая группа'],
  },
  {
    id: 'public',
    icon: '🌐',
    title: 'Публичная (открытая)',
    description: 'Вход свободный',
    maxMembers: '1 000',
    features: ['Открытая группа'],
  },
  {
    id: 'topic',
    icon: '💡',
    title: 'Тема (по интересам)',
    description: 'Рекламный доход 25/75',
    maxMembers: '1 000',
    features: ['По интересам', 'Доход 25/75 (v2)'],
  },
  {
    id: 'media',
    icon: '📰',
    title: 'СМИ',
    description: 'Требуется подтверждение',
    maxMembers: '10 000 000',
    features: ['Большой размер', 'Подтверждение документов'],
    badge: 'Документы',
  },
  {
    id: 'corporate',
    icon: '🏢',
    title: 'Корпоративная',
    description: 'Сотрудники + клиенты',
    maxMembers: '20 000',
    features: ['2+ группы', 'Витрина', 'До 20 000'],
  },
];

const HISTORY_OPTIONS = [
  { value: 'all', label: 'Вся история' },
  { value: '100', label: 'Последние 100 сообщений' },
  { value: 'join', label: 'С момента вступления' },
];

const LINK_EXPIRY_OPTIONS = [
  { value: '24h', label: '24 часа' },
  { value: '7d', label: '7 дней' },
  { value: 'forever', label: 'Вечная' },
  { value: 'single', label: '1 использование' },
];

function CreateGroupScreen() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addChat = useChatStore((s) => s.addChat);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState<GroupType>('private');
  const [requireRules, setRequireRules] = useState(false);
  const [historyOption, setHistoryOption] = useState('all');
  const [linkExpiry, setLinkExpiry] = useState('forever');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Invite contacts
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [contactSearch, setContactSearch] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Rules
  const [rulesText, setRulesText] = useState('');

  // Media (СМИ)
  const [mediaCert, setMediaCert] = useState({
    certNumber: '', certIssuedAt: '', certIssuer: '',
    certMediaName: '', certFounder: '', certInn: '', certOgrn: '',
  });
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const mediaFileRef = useRef<HTMLInputElement>(null);

  const selectedGroupType = GROUP_TYPES.find((t) => t.id === selectedType)!;

  // Load contacts
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingContacts(true);
      try {
        const data = await api.get<any[]>('/api/users/contacts');
        if (!cancelled) setContacts(data || []);
      } catch { /* ignore */ } finally {
        if (!cancelled) setLoadingContacts(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggleContact = (id: string) => {
    setSelectedContactIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filteredContacts = contacts.filter((c) => {
    if (!contactSearch.trim()) return true;
    const q = contactSearch.toLowerCase();
    return c.displayName.toLowerCase().includes(q) || c.username.toLowerCase().includes(q);
  });

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      const data: any = await api.request('/api/upload/avatar', {
        method: 'POST',
        body: uploadFormData,
        headers: {},
      });
      setAvatarUrl(data.url);
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Введите название группы');
      return;
    }

    // Validate rules
    if (requireRules && !rulesText.trim()) {
      setError('Введите текст правил группы');
      return;
    }

    // Validate media docs
    if (selectedType === 'media' && !mediaCert.certNumber && !mediaFile) {
      setError('Для группы типа «СМИ» обязательны свидетельство и реквизиты (ст. 9 Закона РФ «О СМИ»)');
      return;
    }

    setLoading(true);
    try {
      // Upload media cert file if present
      let mediaCertDocuments: any[] = [];
      if (mediaFile) {
        try {
          const fd = new FormData();
          fd.append('file', mediaFile);
          const uploadResult: any = await api.request('/api/upload/file', {
            method: 'POST',
            body: fd,
            headers: {},
          });
          mediaCertDocuments = [{ type: 'certificate', url: uploadResult.url, name: mediaFile.name }];
        } catch {
          // continue without file
        }
      }

      const groupData: any = {
        name: name.trim(),
        description: description.trim(),
        type: selectedType === 'private' ? 'group' : selectedType === 'public' ? 'group' : 'channel',
        groupType: selectedType,
        avatarUrl,
        memberIds: Array.from(selectedContactIds),
        settings: {
          requireRules,
          rules: rulesText.trim(),
          historyForNewMembers: historyOption,
          inviteLinkExpiry: linkExpiry,
        },
      };

      // Attach media certificate for media groups
      if (selectedType === 'media') {
        groupData.mediaCert = {
          ...mediaCert,
          certIssuedAt: mediaCert.certIssuedAt ? Math.floor(new Date(mediaCert.certIssuedAt).getTime() / 1000) : undefined,
          documents: mediaCertDocuments,
        };
      }

      const created = await api.createGroup(groupData);
      addChat({
        id: created.id,
        name: created.name,
        type: 'group',
        avatarUrl: created.avatarUrl,
        role: 'owner' as const,
        joinedAt: Date.now(),
        pinned: false,
        muted: false,
        unreadCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      navigate(`/group/${created.id}/settings`, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Ошибка создания группы');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container page-container--narrow">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Создать группу</h1>
        <p className="text-muted">Настройте основную информацию и параметры группы</p>
      </div>

      <form onSubmit={handleCreate}>
        {/* Avatar */}
        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <div
              className="cursor-pointer"
              onClick={handleAvatarClick}
              style={{ width: '80px', height: '80px' }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  style={{
                    clipPath: 'var(--octagon-clip)',
                    border: '3px solid var(--accent)',
                  }}
                />
              ) : (
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: '80px',
                    height: '80px',
                    background: 'var(--surface)',
                    border: '2px dashed var(--border)',
                    clipPath: 'var(--octagon-clip)',
                    fontSize: '28px',
                  }}
                >
                  👥
                </div>
              )}
            </div>
            <div>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={handleAvatarClick}
              >
                Загрузить аватар
              </button>
              <p className="text-xs text-muted mt-2">Октагон, рекомендуется 256×256</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>
        </div>

        {/* Основная информация */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">Основное</h3>

          <div className="form-group">
            <label className="form-label">Название группы *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Моя группа"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={64}
            />
            <span className="text-xs text-muted">{name.length}/64</span>
          </div>

          <div className="form-group">
            <label className="form-label">Описание</label>
            <textarea
              className="form-input form-input--textarea"
              placeholder="О чём ваша группа..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <span className="text-xs text-muted">{description.length}/500</span>
          </div>
        </div>

        {/* Тип группы */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">Тип группы</h3>
          <p className="text-sm text-muted mb-4">
            Выберите тип для вашей группы. Это определяет возможности и ограничения.
          </p>

          <div className="group-type-list">
            {GROUP_TYPES.map((type) => (
              <div
                key={type.id}
                className={`group-type-item ${selectedType === type.id ? 'group-type-item--active' : ''}`}
                onClick={() => setSelectedType(type.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedType(type.id)}
              >
                <div className="group-type-item__header">
                  <span className="group-type-item__icon">{type.icon}</span>
                  <div className="group-type-item__info">
                    <div className="group-type-item__title">
                      {type.title}
                      {type.badge && (
                        <span className="chip chip--outline" style={{ marginLeft: '8px' }}>
                          {type.badge}
                        </span>
                      )}
                    </div>
                    <div className="group-type-item__desc">{type.description}</div>
                  </div>
                  {selectedType === type.id && (
                    <span className="chip chip--accent">✓ Выбрано</span>
                  )}
                </div>
                <div className="group-type-item__details">
                  <span className="text-sm text-muted">До {type.maxMembers} участников</span>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {type.features.map((f) => (
                      <span key={f} className="text-xs text-secondary bg-surface px-2 py-1 rounded">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Настройки */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">Настройки</h3>

          <div className="form-group form-group--flex">
            <div className="flex-1">
              <label className="form-label">Обязательное ознакомление с правилами</label>
              <p className="text-xs text-muted">Участники должны принять правила при вступлении</p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={requireRules}
                onChange={(e) => setRequireRules(e.target.checked)}
              />
              <span className="switch__slider" />
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">История для новых участников</label>
            <select
              className="form-input"
              value={historyOption}
              onChange={(e) => setHistoryOption(e.target.value)}
            >
              {HISTORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Срок действия ссылки-приглашения</label>
            <select
              className="form-input"
              value={linkExpiry}
              onChange={(e) => setLinkExpiry(e.target.value)}
            >
              {LINK_EXPIRY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Правила группы — при включённом переключателе */}
        {requireRules && (
          <div className="card mb-6">
            <div className="form-group">
              <label className="form-label">Правила группы *</label>
              <textarea
                className="form-input form-input--textarea"
                placeholder="Опишите правила группы..."
                value={rulesText}
                onChange={(e) => setRulesText(e.target.value)}
                rows={4}
                maxLength={2000}
              />
              <span className="text-xs text-muted">{rulesText.length}/2000</span>
            </div>
          </div>
        )}

        {/* Приглашение участников */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">📨 Пригласить участников сейчас</h3>
          <div className="form-group">
            <input
              type="text"
              className="form-input"
              placeholder="🔍 Поиск контактов..."
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
            />
          </div>
          <div className="text-sm text-muted mb-3">
            Выбрано: <strong>{selectedContactIds.size}</strong>
          </div>
          {loadingContacts ? (
            <div className="text-muted" style={{ padding: 16, textAlign: 'center' }}>Загрузка...</div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-muted" style={{ padding: 16, textAlign: 'center' }}>
              {contacts.length === 0 ? 'Нет контактов' : 'Не найдено'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
              {filteredContacts.map((c) => {
                const sel = selectedContactIds.has(c.id);
                return (
                  <div key={c.id} className="card" style={{
                    background: sel ? 'var(--accent)' : 'var(--surface)',
                    color: sel ? 'white' : 'inherit', opacity: 0.8, cursor: 'pointer', padding: '8px 12px',
                  }} onClick={() => toggleContact(c.id)}>
                    <div className="flex items-center gap-3">
                      <div className="avatar avatar--sm avatar--bordered" style={{ clipPath: 'var(--octagon-clip)', flexShrink: 0 }}>
                        {c.avatarUrl ? <img src={c.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
                          <div className="avatar__inner"><span>{c.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}</span></div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="font-semibold" style={{ fontSize: 13 }}>{c.displayName}</div>
                        <div className="text-xs" style={{ opacity: 0.7 }}>@{c.username}</div>
                      </div>
                      <span style={{ fontSize: 18 }}>{sel ? '✅' : '⬜'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Правовые документы СМИ */}
        {selectedType === 'media' && (
          <div className="card mb-6">
            <h3 className="text-lg font-semibold mb-4">📰 Правовые документы СМИ *</h3>
            <p className="text-sm text-muted mb-4">
              Свидетельство о регистрации СМИ (ст. 9 Закона РФ «О СМИ»).
            </p>

            <div className="form-group">
              <label className="form-label">Свидетельство (скан/PDF) *</label>
              <input
                ref={mediaFileRef}
                type="file"
                accept="image/*,application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
              />
              <div className="flex gap-2 items-center">
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => mediaFileRef.current?.click()}>
                  📎 Выбрать файл
                </button>
                {mediaFile && <span className="text-sm">{mediaFile.name}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Серия/номер свидетельства</label>
              <input type="text" className="form-input" placeholder="ФС77-XXXXX" value={mediaCert.certNumber} onChange={(e) => setMediaCert({ ...mediaCert, certNumber: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Дата выдачи</label>
              <input type="date" className="form-input" value={mediaCert.certIssuedAt} onChange={(e) => setMediaCert({ ...mediaCert, certIssuedAt: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Кем выдан</label>
              <input type="text" className="form-input" placeholder="Роскомнадзор" value={mediaCert.certIssuer} onChange={(e) => setMediaCert({ ...mediaCert, certIssuer: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Название СМИ</label>
              <input type="text" className="form-input" value={mediaCert.certMediaName} onChange={(e) => setMediaCert({ ...mediaCert, certMediaName: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Учредитель</label>
              <input type="text" className="form-input" value={mediaCert.certFounder} onChange={(e) => setMediaCert({ ...mediaCert, certFounder: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">ИНН</label>
              <input type="text" className="form-input" placeholder="7701234567" value={mediaCert.certInn} onChange={(e) => setMediaCert({ ...mediaCert, certInn: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">ОГРН</label>
              <input type="text" className="form-input" placeholder="1027701234567" value={mediaCert.certOgrn} onChange={(e) => setMediaCert({ ...mediaCert, certOgrn: e.target.value })} />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="card mb-6"
            style={{ background: 'var(--danger)', color: 'white' }}
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <button
          type="submit"
          className="btn btn--primary btn--block btn--lg"
          disabled={loading || !name.trim()}
          style={{ opacity: loading || !name.trim() ? 0.6 : 1 }}
        >
          {loading ? 'Создание...' : 'Создать группу'}
        </button>
      </form>
    </div>
  );
}

export default CreateGroupScreen;
