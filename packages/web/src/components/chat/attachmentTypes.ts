// Единая модель вложений сообщения (тикет 1795677071).
//
// Одно сообщение может содержать до 15 вложений разных типов (MVP1) и до 50
// (MVP2, сверх 15 — платно). Раньше панель умела только файлы (`PickedFile[]`),
// а опрос/квиз/списки уходили slash-командой как текст в чат.
//
// Серверная форма (MessageAttachment): файловые — непустой `url`, не-файловые —
// `data` (JSON) при пустом `url`.

export type FileAttachmentType = 'image' | 'video' | 'audio' | 'text' | 'file';

export type NonFileAttachmentType =
  | 'poll'
  | 'quiz'
  | 'list_active'
  | 'list_passive'
  | 'personali';

export const NON_FILE_TYPES: NonFileAttachmentType[] = [
  'poll',
  'quiz',
  'list_active',
  'list_passive',
  'personali',
];

export function isNonFileType(type: string): type is NonFileAttachmentType {
  return (NON_FILE_TYPES as string[]).includes(type);
}

/** Файл, ещё не загруженный на CDN. */
export interface PendingFile {
  kind: 'file';
  id: string;
  type: FileAttachmentType;
  file: File;
}

/** Не-файловое вложение: данные формы, загрузка не нужна. */
export interface PendingNonFile {
  kind: 'non-file';
  id: string;
  type: NonFileAttachmentType;
  data: Record<string, unknown>;
}

export type PendingAttachment = PendingFile | PendingNonFile;

/** Форма, уже готовая в POST /api/chats/:id/messages. */
export interface ReadyAttachment {
  type: string;
  url: string;
  thumbnail?: string;
  size?: number;
  name?: string;
  width?: number;
  height?: number;
  duration?: number;
  data?: Record<string, unknown>;
}

/** Данные не-файловых вложений (совпадают с формой рендера в MessageBubble). */
export interface PollData {
  question: string;
  options: string[];
  multiple: boolean;
  /** Только для quiz: индекс верного варианта. */
  correctIndex?: number;
}

export interface ListData {
  title: string;
  items: string[];
  /** Только для personali: можно выбрать несколько пунктов. */
  multiple?: boolean;
}

// Лимиты (MVP1 = 15 бесплатно, MVP2 = до 50 за баллы).
export const FREE_ATTACHMENT_LIMIT = 15;
export const MAX_ATTACHMENT_LIMIT = 50;
/** Стоимость платного сообщения: n + 5 баллов (требование 4 тикета). */
export const PAID_MESSAGE_BASE = 5;

export function attachmentCost(count: number): number {
  return count > FREE_ATTACHMENT_LIMIT ? count + PAID_MESSAGE_BASE : 0;
}

/** Тип сообщения по составу вложений: не-файловое задаёт тип, иначе — первый файл. */
export function messageTypeFor(attachments: Array<{ type: string }>): string {
  const nonFile = attachments.find((a) => isNonFileType(a.type));
  if (nonFile) return nonFile.type;
  const t = attachments[0]?.type;
  if (t === 'image') return 'image';
  if (t === 'video') return 'video';
  if (t === 'audio') return 'voice';
  return 'file';
}

/** Иконка типа для чипа в панели и карточки в пузыре. */
export function attachmentTypeIcon(type: string): string {
  switch (type) {
    case 'image':
      return '🖼';
    case 'video':
      return '🎥';
    case 'audio':
      return '🎵';
    case 'text':
      return '📝';
    case 'poll':
      return '📊';
    case 'quiz':
      return '🎯';
    case 'list_active':
      return '☑️';
    case 'list_passive':
      return '📋';
    case 'personali':
      return '🙋';
    default:
      return '📄';
  }
}

/** Подпись типа по-русски (чипы панели, пустые состояния карточек). */
export function attachmentTypeLabel(type: string): string {
  switch (type) {
    case 'poll':
      return 'Опрос';
    case 'quiz':
      return 'Квиз';
    case 'list_active':
      return 'Активный список';
    case 'list_passive':
      return 'Пассивный список';
    case 'personali':
      return 'Персонали';
    default:
      return 'Файл';
  }
}

let seq = 0;
export function nextAttachmentId(): string {
  seq += 1;
  return `att_${Date.now().toString(36)}_${seq}`;
}
