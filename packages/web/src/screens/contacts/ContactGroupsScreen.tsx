// ContactGroupsScreen — управление группами контактов
// Макет: mockups/balloo-su/contact-groups.html (1_01_42, принят 17.11.2026)

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';

interface ContactGroup {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
  memberCount: number;
  previewMemberIds: string[];
  createdAt: number;
  updatedAt: number;
}

interface MemberPickerItem {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  status: string;
}

export default function ContactGroupsScreen() {
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ContactGroup | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');

  // Editor state
  const [groupName, setGroupName] = useState('');
  const [groupEmoji, setGroupEmoji] = useState('👥');
  const [groupDesc, setGroupDesc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<MemberPickerItem[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getContactGroups();
      setGroups(data || []);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchContacts = useCallback(async () => {
    try {
      const data = await api.getContacts();
      setMembers(data || []);
    } catch {
      setMembers([]);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    if (showEditor) {
      fetchContacts();
    }
  }, [showEditor, fetchContacts]);

  const openCreateEditor = () => {
    setEditingGroup(null);
    setGroupName('');
    setGroupEmoji('👥');
    setGroupDesc('');
    setSelectedMembers(new Set());
    setShowEditor(true);
  };

  const openEditEditor = (group: ContactGroup) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupEmoji(group.emoji);
    setGroupDesc(group.description || '');
    setShowEditor(true);
  };

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  const saveGroup = async () => {
    if (!groupName.trim()) return;
    try {
      if (editingGroup) {
        await api.updateContactGroup(editingGroup.id, {
          name: groupName.trim(),
          emoji: groupEmoji,
          description: groupDesc.trim() || undefined,
        });
      } else {
        await api.createContactGroup({
          name: groupName.trim(),
          emoji: groupEmoji,
          description: groupDesc.trim() || undefined,
          memberIds: Array.from(selectedMembers),
        });
      }
      setShowEditor(false);
      await fetchGroups();
    } catch {
      // ошибка — показать toast
    }
  };

  const confirmDelete = (group: ContactGroup) => {
    setDeleteGroupId(group.id);
    setDeleteName(group.name);
    setShowDeleteModal(true);
  };

  const doDelete = async () => {
    if (!deleteGroupId) return;
    try {
      await api.deleteContactGroup(deleteGroupId);
      setShowDeleteModal(false);
      setDeleteGroupId(null);
      await fetchGroups();
    } catch {
      // ошибка
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.displayName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="page-container">
      <h1 className="page-title">👥 Группы контактов</h1>
      <p className="page-subtitle">Именованные списки контактов: аудитория историй, рассылка, быстрый выбор</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button className="btn btn--tertiary btn--sm" onClick={() => (window.location.href = '/contacts')}>
          Контакты
        </button>
        <button className="btn btn--primary btn--sm">👥 Группы</button>
        <button className="btn btn--tertiary btn--sm" onClick={() => (window.location.href = '/blocked-users')}>
          🚫 Чёрный список
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
        <div className="card flex-1" style={{ minWidth: 140 }}>
          <div className="text-xs text-muted">Групп</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>
            {groups.length}
          </div>
        </div>
      </div>

      {/* Create button */}
      <button className="btn btn--primary" style={{ marginBottom: 16 }} onClick={openCreateEditor}>
        ➕ Создать группу
      </button>

      {/* Groups list */}
      {loading ? (
        <p>Загрузка...</p>
      ) : groups.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__animation">👥</div>
            <div className="empty-state__title">Групп контактов пока нет</div>
            <div className="empty-state__subtitle">
              Создайте первую группу — например «Семья» или «Коллеги» — и выбирайте её аудиторией в историях
            </div>
            <button className="btn btn--primary mt-3" onClick={openCreateEditor}>
              ➕ Создать группу
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          {groups.map((group, idx) => (
            <div key={group.id}>
              <div className="flex items-center gap-3" style={{ padding: idx === 0 ? 12 : '12px 0' }}>
                <div className="avatar avatar--md avatar--bordered avatar--ctx-family">
                  <div className="avatar__inner" style={{ fontSize: 20 }}>{group.emoji}</div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    {group.emoji} {group.name}
                  </div>
                  <div className="text-xs text-muted mt-1">
                    {group.memberCount} участников · обновлена{' '}
                    {new Date(group.updatedAt).toLocaleDateString('ru-RU')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn--secondary btn--sm" onClick={() => openEditEditor(group)}>
                    ✏️ Изменить
                  </button>
                  <button className="btn btn--tertiary btn--sm" title="Удалить" onClick={() => confirmDelete(group)}>
                    🗑
                  </button>
                </div>
              </div>
              {idx < groups.length - 1 && <div className="divider"></div>}
            </div>
          ))}
        </div>
      )}

      {/* Usage info */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3 className="card__title mb-3">ℹ️ Где используются группы контактов</h3>
        <ul className="text-sm text-secondary" style={{ paddingLeft: 20 }}>
          <li>
            <a href="/stories/create" style={{ color: 'var(--accent)' }}>
              Создание истории
            </a>{' '}
            → «Выборочный доступ»: группа выбирается целиком
          </li>
          <li>Группы видны только вам — контакты не узнают, что добавлены</li>
        </ul>
      </div>

      {/* Editor modal */}
      {showEditor && (
        <div className="modal-overlay" onClick={() => setShowEditor(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <span className="modal__title">
                {editingGroup ? `✏️ ${editingGroup.name}` : '➕ Новая группа контактов'}
              </span>
              <span className="modal__close" onClick={() => setShowEditor(false)}>✕</span>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label className="form-label">Название *</label>
                <input
                  type="text"
                  className="form-input"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Например: Коллеги"
                  maxLength={60}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Эмодзи группы</label>
                <select className="form-select" value={groupEmoji} onChange={(e) => setGroupEmoji(e.target.value)}>
                  <option>👥</option>
                  <option>💼</option>
                  <option>❤️</option>
                  <option>🎓</option>
                  <option>🤝</option>
                  <option>⚽</option>
                  <option>🎸</option>
                  <option>🏡</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Описание</label>
                <input
                  type="text"
                  className="form-input"
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  placeholder="Для чего эта группа"
                  maxLength={200}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Участники из контактов</label>
                <input
                  type="text"
                  className="form-input mb-2"
                  placeholder="🔍 Поиск контактов..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                  {filteredMembers.map((member) => (
                    <div key={member.id} style={{ border: 'none', padding: '8px 0' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={selectedMembers.has(member.id)}
                          onChange={() => toggleMember(member.id)}
                          style={{ width: 18, height: 18, cursor: 'pointer' }}
                        />
                        <div className="avatar avatar--sm avatar--bordered">
                          <div className="avatar__inner">{member.displayName.slice(0, 2).toUpperCase()}</div>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-bold">{member.displayName}</div>
                          <div className="text-xs text-muted">@{member.username}</div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted mt-2">
                  Выбрано: {selectedMembers.size}
                </div>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--tertiary" onClick={() => setShowEditor(false)}>
                Отмена
              </button>
              <button className="btn btn--primary" onClick={saveGroup}>
                💾 Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal modal--status-danger" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <span className="modal__title">🗑 Удалить группу?</span>
              <span className="modal__close" onClick={() => setShowDeleteModal(false)}>✕</span>
            </div>
            <div className="modal__body">
              <p className="text-sm text-secondary">
                Группа «<strong style={{ color: 'var(--text-primary)' }}>{deleteName}</strong>» будет удалена.
                Контакты останутся в списке. Истории, где группа была выбрана аудиторией, сохранят уже опубликованный доступ.
              </p>
            </div>
            <div className="modal__footer">
              <button className="btn btn--tertiary" onClick={() => setShowDeleteModal(false)}>
                Отмена
              </button>
              <button className="btn btn--danger" onClick={doDelete}>
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
