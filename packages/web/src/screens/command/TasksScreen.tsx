// TasksScreen — Kanban board for employee portal
// Портал сотрудников: задачи и проекты

import { useState, useMemo, useEffect } from 'react';
import { api } from '@/services/api';

// --- Types ---

type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
type TaskType = 'feature' | 'bug' | 'task' | 'improvement';

interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  assignee: string;
  assigneeAvatar: string;
  dueDate: string;
  tags: string[];
  comments: number;
  votes: number;
  createdAt: string;
}

// --- Mock Data ---

// --- Constants ---

const COLUMNS: { id: TaskStatus; title: string; color: string; icon: string }[] = [
  { id: 'backlog', title: 'Backlog', color: '#6b7280', icon: '📋' },
  { id: 'todo', title: 'To Do', color: '#3b82f6', icon: '📝' },
  { id: 'in_progress', title: 'In Progress', color: '#f59e0b', icon: '⚡' },
  { id: 'in_review', title: 'In Review', color: '#8b5cf6', icon: '👀' },
  { id: 'done', title: 'Done', color: '#22c55e', icon: '✅' },
];

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; icon: string; bg: string }> = {
  low: { label: 'Низкий', color: '#6b7280', icon: '⬇️', bg: '#f3f4f6' },
  medium: { label: 'Средний', color: '#3b82f6', icon: '➡️', bg: '#eff6ff' },
  high: { label: 'Высокий', color: '#f97316', icon: '⬆️', bg: '#fff7ed' },
  urgent: { label: 'Срочный', color: '#ef4444', icon: '🔥', bg: '#fef2f2' },
};

const TYPE_CONFIG: Record<TaskType, { label: string; color: string }> = {
  feature: { label: 'Фича', color: '#3b82f6' },
  bug: { label: 'Баг', color: '#ef4444' },
  task: { label: 'Задача', color: '#8b5cf6' },
  improvement: { label: 'Улучшение', color: '#22c55e' },
};

const TEAM_MEMBERS = [
  { name: 'Алексей К.', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=AK' },
  { name: 'Мария Д.', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=MD' },
  { name: 'Дмитрий В.', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=ДВ' },
  { name: 'Иван С.', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=ИС' },
  { name: 'Елена Р.', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=ЕР' },
  { name: 'Не назначен', avatar: '' },
];

// --- Components ---

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        fontSize: '11px',
        fontWeight: 600,
        borderRadius: '4px',
        color: config.color,
        backgroundColor: config.bg,
        border: `1px solid ${config.color}20`,
      }}
    >
      {config.icon} {config.label}
    </span>
  );
}

function TypeBadge({ type }: { type: TaskType }) {
  const config = TYPE_CONFIG[type];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        fontSize: '11px',
        fontWeight: 600,
        borderRadius: '4px',
        color: '#fff',
        backgroundColor: config.color,
      }}
    >
      {config.label}
    </span>
  );
}

function TaskCard({ task, onEdit, onDelete }: { task: Task; onEdit: (task: Task) => void; onDelete: (id: string) => void }) {
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <div
      style={{
        backgroundColor: '#1e1e2e',
        borderRadius: '8px',
        padding: '12px',
        cursor: 'pointer',
        border: isOverdue ? '1px solid #ef4444' : '1px solid #2a2a3e',
        transition: 'all 0.2s',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = '#3b82f6';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = isOverdue ? '#ef4444' : '#2a2a3e';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      {/* Header: type + priority */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <TypeBadge type={task.type} />
        <PriorityBadge priority={task.priority} />
      </div>

      {/* Title */}
      <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#e4e4e7', margin: '0 0 6px 0', lineHeight: '1.4' }}>
        {task.title}
      </h4>

      {/* Description preview */}
      {task.description && (
        <p style={{ fontSize: '12px', color: '#a1a1aa', margin: '0 0 10px 0', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '3px',
                backgroundColor: '#2a2a3e',
                color: '#a1a1aa',
                border: '1px solid #3a3a4e',
              }}
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span style={{ fontSize: '10px', color: '#71717a' }}>+{task.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer: assignee + due date + meta */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {task.assigneeAvatar ? (
            <img
              src={task.assigneeAvatar}
              alt={task.assignee}
              style={{ width: '22px', height: '22px', borderRadius: '4px', backgroundColor: '#3a3a4e' }}
            />
          ) : (
            <div style={{ width: '22px', height: '22px', borderRadius: '4px', backgroundColor: '#3a3a4e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#71717a' }}>
              ?
            </div>
          )}
          <span style={{ fontSize: '11px', color: '#a1a1aa' }}>{task.assignee}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isOverdue && (
            <span style={{ fontSize: '10px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '2px' }}>
              ⚠ Просрочено
            </span>
          )}
          <span style={{ fontSize: '10px', color: '#71717a', display: 'flex', alignItems: 'center', gap: '2px' }}>
              📅 {new Date(task.dueDate).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
            </span>
            {task.comments > 0 && (
            <span style={{ fontSize: '10px', color: '#71717a', display: 'flex', alignItems: 'center', gap: '2px' }}>
              💬 {task.comments}
            </span>
          )}
          {task.votes > 0 && (
            <span style={{ fontSize: '10px', color: '#71717a', display: 'flex', alignItems: 'center', gap: '2px' }}>
              ▲ {task.votes}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons (visible on hover) */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          display: 'flex',
          gap: '4px',
          opacity: 0,
          transition: 'opacity 0.2s',
        }}
        className="task-card-actions"
      >
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(task); }}
          style={{
            background: '#2a2a3e',
            border: 'none',
            borderRadius: '4px',
            padding: '3px 6px',
            cursor: 'pointer',
            fontSize: '11px',
            color: '#a1a1aa',
          }}
          title="Редактировать"
        >
          ✏️
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          style={{
            background: '#2a2a3e',
            border: 'none',
            borderRadius: '4px',
            padding: '3px 6px',
            cursor: 'pointer',
            fontSize: '11px',
            color: '#a1a1aa',
          }}
          title="Удалить"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

function KanbanColumn({
  column,
  tasks,
  onEditTask,
  onDeleteTask,
  onDropTask,
}: {
  column: typeof COLUMNS[0];
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onDropTask: (taskId: string, newStatus: TaskStatus) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onDropTask(taskId, column.id);
    }
  };

  return (
    <div
      style={{
        flex: '1 1 0',
        minWidth: '280px',
        maxWidth: '340px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isDragOver ? '#1a1a2e' : '#16161e',
        borderRadius: '10px',
        border: isDragOver ? `2px dashed ${column.color}` : '2px solid transparent',
        transition: 'all 0.2s',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div style={{ padding: '12px 14px', borderBottom: `1px solid #2a2a3e`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>{column.icon}</span>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#e4e4e7', margin: 0 }}>{column.title}</h3>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '1px 8px',
              borderRadius: '10px',
              backgroundColor: `${column.color}20`,
              color: column.color,
            }}
          >
            {tasks.length}
          </span>
        </div>
        <button
          style={{
            background: 'none',
            border: 'none',
            color: '#71717a',
            cursor: 'pointer',
            fontSize: '18px',
            lineHeight: 1,
            padding: '2px 4px',
            borderRadius: '4px',
          }}
          title="Добавить задачу"
        >
          ➕
        </button>
      </div>

      {/* Tasks list */}
      <div style={{ flex: 1, padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {tasks.map((task) => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => {
              (e.dataTransfer as any).setData('taskId', task.id);
            }}
          >
            <TaskCard task={task} onEdit={onEditTask} onDelete={onDeleteTask} />
          </div>
        ))}
        {tasks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 12px', color: '#52525b', fontSize: '12px' }}>
            Перетащите задачу сюда
          </div>
        )}
      </div>
    </div>
  );
}

// --- Modal ---

function TaskModal({
  task,
  onClose,
  onSave,
}: {
  task: Task | null;
  onClose: () => void;
  onSave: (task: Task) => void;
}) {
  const isNew = task === null;
  const [form, setForm] = useState<Omit<Task, 'id' | 'comments' | 'votes' | 'createdAt'>>({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'backlog',
    priority: task?.priority || 'medium',
    type: task?.type || 'task',
    assignee: task?.assignee || '',
    assigneeAvatar: task?.assigneeAvatar || '',
    dueDate: task?.dueDate || '',
    tags: task?.tags || [],
  });
  const [tagInput, setTagInput] = useState('');

  const handleSave = () => {
    if (!form.title.trim()) return;
    const savedTask: Task = {
      ...form,
      id: task?.id || `tsk_${Date.now()}`,
      comments: task?.comments || 0,
      votes: task?.votes || 0,
      createdAt: task?.createdAt || new Date().toISOString().split('T')[0],
    };
    onSave(savedTask);
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setForm({ ...form, tags: form.tags.filter((t) => t !== tag) });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div
        style={{
          backgroundColor: '#1e1e2e',
          borderRadius: '12px',
          width: '520px',
          maxHeight: '90vh',
          overflow: 'auto',
          border: '1px solid #2a2a3e',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #2a2a3e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#e4e4e7', margin: 0 }}>
            {isNew ? 'Новая задача' : 'Редактирование задачи'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '20px', padding: '4px 8px', borderRadius: '4px' }}>
            ✕
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a1a1aa', marginBottom: '6px' }}>Название *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Введите название задачи..."
              style={{
                width: '100%', padding: '10px 12px', backgroundColor: '#16161e', border: '1px solid #2a2a3e', borderRadius: '6px',
                color: '#e4e4e7', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
              }}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a1a1aa', marginBottom: '6px' }}>Описание</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Опишите задачу подробнее..."
              rows={3}
              style={{
                width: '100%', padding: '10px 12px', backgroundColor: '#16161e', border: '1px solid #2a2a3e', borderRadius: '6px',
                color: '#e4e4e7', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Type + Priority */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a1a1aa', marginBottom: '6px' }}>Тип</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as TaskType })}
                style={{
                  width: '100%', padding: '10px 12px', backgroundColor: '#16161e', border: '1px solid #2a2a3e', borderRadius: '6px',
                  color: '#e4e4e7', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                }}
              >
                <option value="feature">Фича</option>
                <option value="bug">Баг</option>
                <option value="task">Задача</option>
                <option value="improvement">Улучшение</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a1a1aa', marginBottom: '6px' }}>Приоритет</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
                style={{
                  width: '100%', padding: '10px 12px', backgroundColor: '#16161e', border: '1px solid #2a2a3e', borderRadius: '6px',
                  color: '#e4e4e7', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                }}
              >
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
                <option value="urgent">Срочный</option>
              </select>
            </div>
          </div>

          {/* Status + Assignee */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a1a1aa', marginBottom: '6px' }}>Статус</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
                style={{
                  width: '100%', padding: '10px 12px', backgroundColor: '#16161e', border: '1px solid #2a2a3e', borderRadius: '6px',
                  color: '#e4e4e7', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                }}
              >
                {COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>{col.icon} {col.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a1a1aa', marginBottom: '6px' }}>Исполнитель</label>
              <select
                value={form.assignee}
                onChange={(e) => {
                  const member = TEAM_MEMBERS.find((m) => m.name === e.target.value);
                  setForm({ ...form, assignee: e.target.value, assigneeAvatar: member?.avatar || '' });
                }}
                style={{
                  width: '100%', padding: '10px 12px', backgroundColor: '#16161e', border: '1px solid #2a2a3e', borderRadius: '6px',
                  color: '#e4e4e7', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                }}
              >
                <option value="">Не назначен</option>
                {TEAM_MEMBERS.filter((m) => m.name !== 'Не назначен').map((m) => (
                  <option key={m.name} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date + Tags */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a1a1aa', marginBottom: '6px' }}>Срок</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                style={{
                  width: '100%', padding: '10px 12px', backgroundColor: '#16161e', border: '1px solid #2a2a3e', borderRadius: '6px',
                  color: '#e4e4e7', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a1a1aa', marginBottom: '6px' }}>Теги</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  placeholder="Добавить тег..."
                  style={{
                    flex: 1, padding: '10px 12px', backgroundColor: '#16161e', border: '1px solid #2a2a3e', borderRadius: '6px',
                    color: '#e4e4e7', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={addTag}
                  style={{ padding: '10px 12px', backgroundColor: '#2a2a3e', border: 'none', borderRadius: '6px', color: '#a1a1aa', cursor: 'pointer', fontSize: '14px' }}
                >
                  +
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                {form.tags.map((tag) => (
                  <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', backgroundColor: '#2a2a3e', borderRadius: '4px', fontSize: '11px', color: '#a1a1aa' }}>
                    {tag}
                    <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: 0, fontSize: '12px', lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #2a2a3e', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', backgroundColor: '#2a2a3e', border: 'none', borderRadius: '6px', color: '#a1a1aa', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            Отмена
          </button>
          <button onClick={handleSave} style={{ padding: '10px 20px', backgroundColor: '#3b82f6', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            {isNew ? 'Создать задачу' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main Screen ---

export function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTasks().then((res) => {
      const mapped: Task[] = (res || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description || '',
        status: (t.status || 'backlog') as Task['status'],
        priority: (t.priority || 'medium') as Task['priority'],
        type: (t.type || 'task') as Task['type'],
        assignee: t.assignee || 'Не назначен',
        assigneeAvatar: t.assigneeAvatar || '',
        dueDate: t.dueDate || '',
        tags: t.tags || [],
        comments: t.comments || 0,
        votes: t.votes || 0,
        createdAt: t.createdAt || '',
      }));
      setTasks(mapped);
      setLoading(false);
    }).catch(() => {
      setTasks([]);
      setLoading(false);
    });
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);

  // Stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const overdue = tasks.filter((t) => new Date(t.dueDate) < new Date() && t.status !== 'done').length;
    const done = tasks.filter((t) => t.status === 'done').length;
    return { total, inProgress, overdue, done };
  }, [tasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = !searchQuery || task.title.toLowerCase().includes(searchQuery.toLowerCase()) || task.description.toLowerCase().includes(searchQuery.toLowerCase()) || task.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesAssignee = filterAssignee === 'all' || task.assignee === filterAssignee;
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
      return matchesSearch && matchesAssignee && matchesPriority && matchesStatus;
    });
  }, [tasks, searchQuery, filterAssignee, filterPriority, filterStatus]);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = { backlog: [], todo: [], in_progress: [], in_review: [], done: [] };
    filteredTasks.forEach((task) => {
      grouped[task.status].push(task);
    });
    return grouped;
  }, [filteredTasks]);

  // Handlers
  const handleSaveTask = async (savedTask: Task) => {
    try {
      if (modalTask) {
        await api.updateTask(modalTask.id, {
          title: savedTask.title,
          description: savedTask.description,
          status: savedTask.status,
          priority: savedTask.priority,
          assignee: savedTask.assignee,
          dueDate: savedTask.dueDate,
          tags: savedTask.tags,
        });
        setTasks((prev) => prev.map((t) => (t.id === savedTask.id ? savedTask : t)));
      } else {
        const created = await api.createTask({
          title: savedTask.title,
          description: savedTask.description,
          status: savedTask.status,
          priority: savedTask.priority,
          type: savedTask.type,
          assignee: savedTask.assignee,
          dueDate: savedTask.dueDate,
          tags: savedTask.tags,
        });
        setTasks((prev) => [...prev, { ...savedTask, id: created.id }]);
      }
    } catch {
      // Опционально: показать ошибку
    }
    setShowModal(false);
    setModalTask(null);
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await api.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch {
      // Опционально: показать ошибку
    }
  };

  const handleDropTask = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    } catch {
      // Опционально: показать ошибку
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#0e0e12' }}>
      {/* Top bar */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #1e1e2e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#e4e4e7', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏁 Задачи
          </h1>

          {/* Stats pills */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', backgroundColor: '#1e1e2e', color: '#a1a1aa', border: '1px solid #2a2a3e' }}>
              Всего: {stats.total}
            </span>
            <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', backgroundColor: '#1e1e2e', color: '#f59e0b', border: '1px solid #f59e0b30' }}>
              В работе: {stats.inProgress}
            </span>
            {stats.overdue > 0 && (
              <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', backgroundColor: '#1e1e2e', color: '#ef4444', border: '1px solid #ef444430', display: 'flex', alignItems: 'center', gap: '3px' }}>
                ⚠️ Просрочено: {stats.overdue}
              </span>
            )}
            <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', backgroundColor: '#1e1e2e', color: '#22c55e', border: '1px solid #22c55e30' }}>
              Готово: {stats.done}
            </span>
          </div>
        </div>

        <button
          onClick={() => { setModalTask(null); setShowNewModal(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#3b82f6', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
          onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.backgroundColor = '#2563eb')}
          onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.backgroundColor = '#3b82f6')}
        >
          ➕ Новая задача
        </button>
      </div>

      {/* Filters bar */}
      <div style={{ padding: '12px 24px', borderBottom: '1px solid #1e1e2e', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px' }}>🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск задач..."
            style={{ width: '100%', padding: '8px 12px 8px 32px', backgroundColor: '#16161e', border: '1px solid #2a2a3e', borderRadius: '6px', color: '#e4e4e7', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px', backgroundColor: showFilters ? '#2a2a3e' : '#16161e', border: '1px solid #2a2a3e', borderRadius: '6px', color: showFilters ? '#3b82f6' : '#a1a1aa', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
        >
          🔽 Фильтры {showFilters ? ' ▾' : ''}
        </button>

        {/* Active filters */}
        {(filterAssignee !== 'all' || filterPriority !== 'all' || filterStatus !== 'all') && (
          <div style={{ display: 'flex', gap: '6px' }}>
            {filterAssignee !== 'all' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', backgroundColor: '#1e1e2e', borderRadius: '12px', fontSize: '11px', color: '#a1a1aa', border: '1px solid #2a2a3e' }}>
                👤 {filterAssignee} <button onClick={() => setFilterAssignee('all')} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: 0, fontSize: '12px' }}>×</button>
              </span>
            )}
            {filterPriority !== 'all' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', backgroundColor: '#1e1e2e', borderRadius: '12px', fontSize: '11px', color: '#a1a1aa', border: '1px solid #2a2a3e' }}>
                {PRIORITY_CONFIG[filterPriority as TaskPriority]?.icon} {PRIORITY_CONFIG[filterPriority as TaskPriority]?.label} <button onClick={() => setFilterPriority('all')} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: 0, fontSize: '12px' }}>×</button>
              </span>
            )}
            {filterStatus !== 'all' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', backgroundColor: '#1e1e2e', borderRadius: '12px', fontSize: '11px', color: '#a1a1aa', border: '1px solid #2a2a3e' }}>
                {COLUMNS.find((c) => c.id === filterStatus)?.icon} {COLUMNS.find((c) => c.id === filterStatus)?.title} <button onClick={() => setFilterStatus('all')} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: 0, fontSize: '12px' }}>×</button>
              </span>
            )}
            <button onClick={() => { setFilterAssignee('all'); setFilterPriority('all'); setFilterStatus('all'); }} style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
              Сбросить всё
            </button>
          </div>
        )}

        {/* Results count */}
        <span style={{ fontSize: '11px', color: '#52525b', marginLeft: 'auto' }}>
          Показано: {filteredTasks.length} из {tasks.length}
        </span>
      </div>

      {/* Filter panel (expandable) */}
      {showFilters && (
        <div style={{ padding: '12px 24px', borderBottom: '1px solid #1e1e2e', display: 'flex', gap: '16px', flexShrink: 0 }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#71717a', marginBottom: '4px' }}>Исполнитель</label>
            <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} style={{ padding: '6px 10px', backgroundColor: '#16161e', border: '1px solid #2a2a3e', borderRadius: '4px', color: '#a1a1aa', fontSize: '12px', outline: 'none' }}>
              <option value="all">Все</option>
              {TEAM_MEMBERS.filter((m) => m.name !== 'Не назначен').map((m) => (
                <option key={m.name} value={m.name}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#71717a', marginBottom: '4px' }}>Приоритет</label>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} style={{ padding: '6px 10px', backgroundColor: '#16161e', border: '1px solid #2a2a3e', borderRadius: '4px', color: '#a1a1aa', fontSize: '12px', outline: 'none' }}>
              <option value="all">Все</option>
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
              <option value="urgent">Срочный</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#71717a', marginBottom: '4px' }}>Статус</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')} style={{ padding: '6px 10px', backgroundColor: '#16161e', border: '1px solid #2a2a3e', borderRadius: '4px', color: '#a1a1aa', fontSize: '12px', outline: 'none' }}>
              <option value="all">Все</option>
              {COLUMNS.map((col) => (
                <option key={col.id} value={col.id}>{col.icon} {col.title}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Kanban board */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px', display: 'flex', gap: '14px' }}>
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasksByStatus[column.id]}
            onEditTask={(task) => { setModalTask(task); setShowModal(true); }}
            onDeleteTask={handleDeleteTask}
            onDropTask={handleDropTask}
          />
        ))}
      </div>

      {/* Edit/Create Modal */}
      {(showModal || showNewModal) && (
        <TaskModal
          task={showNewModal ? null : modalTask}
          onClose={() => { setShowModal(false); setShowNewModal(false); setModalTask(null); }}
          onSave={handleSaveTask}
        />
      )}
    </div>
  );
}
