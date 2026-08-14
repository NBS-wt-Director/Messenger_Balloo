import sharp from 'sharp';
import { env } from '../config/env';
import { paths } from '../config/paths';

// ============================================================
// Допустимые MIME-типы и лимиты
// ============================================================

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

const ALL_ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_AUDIO_TYPES, ...ALLOWED_DOCUMENT_TYPES];

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_MESSAGE_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_STORY_SIZE = 100 * 1024 * 1024; // 100MB для видео
const MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024; // 50MB

// Размеры аватарок
const AVATAR_SIZES = [
  { width: 256, height: 256, suffix: '256' },
  { width: 128, height: 128, suffix: '128' },
  { width: 64, height: 64, suffix: '64' },
];

// ============================================================
// Утилиты
// ============================================================

/**
 * Генерация уникального имени файла
 */
const generateFileName = (originalName: string, prefix: string): string => {
  const ext = originalName.split('.').pop() || 'bin';
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}/${timestamp}-${random}.${ext}`;
};

/**
 * Проверка допустимого типа файла
 */
const validateFileType = (mimeType: string, maxSize: number): { valid: boolean; error?: string } => {
  if (!ALL_ALLOWED_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: `Недопустимый тип файла: ${mimeType}. Допустимые: ${ALL_ALLOWED_TYPES.join(', ')}`,
    };
  }
  return { valid: true };
};

/**
 * Генерация CDN URL
 */
const cdnUrl = (path: string): string => {
  return `${paths.cdn.baseUrl}/${path}`;
};

/**
 * Создание клиента MinIO
 */
const createMinIOClient = () => {
  const client = require('minio');
  return new client.Client({
    endPoint: env.MINIO_ENDPOINT,
    port: Number(env.MINIO_PORT),
    useSSL: env.MINIO_USE_SSL === 'true',
    accessKey: env.MINIO_ACCESS_KEY,
    secretKey: env.MINIO_SECRET_KEY,
  });
};

/**
 * Загрузка файла в MinIO
 */
const uploadToMinIO = async (
  bucket: string,
  fileName: string,
  buffer: Buffer
): Promise<string> => {
  try {
    const minioClient = createMinIOClient();

    // Создаём бакет, если не существует
    const bucketExists = await minioClient.bucketExists(bucket).catch(() => false);
    if (!bucketExists) {
      await minioClient.makeBucket(bucket);
      // Делаем бакет публично читаемым
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucket}/*`],
          },
        ],
      };
      await minioClient.setBucketPolicy(bucket, JSON.stringify(policy));
    }

    await minioClient.putObject(bucket, fileName, buffer, buffer.length, {
      'Content-Type': 'application/octet-stream',
    });

    return fileName;
  } catch (error: any) {
    throw new Error(`Ошибка загрузки в MinIO: ${error.message}`);
  }
};

/**
 * Удаление файла из MinIO
 */
const deleteFromMinIO = async (bucket: string, fileName: string): Promise<void> => {
  try {
    const minioClient = createMinIOClient();
    await minioClient.removeObject(bucket, fileName);
  } catch (error: any) {
    // Игнорируем ошибку, если файл не существует
    if (error.code !== 'NoSuchKey') {
      throw new Error(`Ошибка удаления из MinIO: ${error.message}`);
    }
  }
};

/**
 * Генерация thumbnail для изображения
 */
const generateThumbnail = async (buffer: Buffer, maxSize: number = 400): Promise<Buffer> => {
  return sharp(buffer)
    .resize(maxSize, maxSize, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 80 })
    .toBuffer();
};

/**
 * Resize аватарки до всех размеров
 */
const resizeAvatar = async (buffer: Buffer): Promise<Record<string, Buffer>> => {
  const resized: Record<string, Buffer> = {};

  for (const size of AVATAR_SIZES) {
    resized[size.suffix] = await sharp(buffer)
      .resize(size.width, size.height, {
        fit: 'cover',
        position: 'centre',
      })
      .jpeg({ quality: 90 })
      .toBuffer();
  }

  return resized;
};

// ============================================================
// Upload Avatar (пользователя)
// ============================================================

interface AvatarResult {
  url: string;
  thumbnails: Record<string, string>;
  originalName: string;
  size: number;
  mimeType: string;
}

export const uploadAvatar = async (
  file: Express.Multer.File,
  userId: string
): Promise<AvatarResult> => {
  // Валидация
  const validation = validateFileType(file.mimetype, MAX_AVATAR_SIZE);
  if (!validation.valid) {
    throw new Error(validation.error!);
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    throw new Error('Для аватарки допустимы только изображения');
  }

  if (file.size > MAX_AVATAR_SIZE) {
    throw new Error('Размер аватарки не должен превышать 5MB');
  }

  const bucket = env.MINIO_BUCKET;

  // Генерация имени файла
  const fileName = generateFileName(file.originalname, `avatars/${userId}`);

  // Загрузка оригинала
  await uploadToMinIO(bucket, fileName, file.buffer);

  // Генерация thumbnail для превью
  const thumbnail = await generateThumbnail(file.buffer, 256);
  const thumbnailName = generateFileName('thumbnail.jpg', `avatars/${userId}/thumbs`);
  await uploadToMinIO(bucket, thumbnailName, thumbnail);

  // Resize аватарки
  const resized = await resizeAvatar(file.buffer);
  const resizedUrls: Record<string, string> = {};

  for (const size of AVATAR_SIZES) {
    const sizeFileName = generateFileName(`avatar-${size.suffix}.jpg`, `avatars/${userId}/sizes`);
    await uploadToMinIO(bucket, sizeFileName, resized[size.suffix]);
    resizedUrls[size.suffix] = cdnUrl(sizeFileName);
  }

  return {
    url: cdnUrl(fileName),
    thumbnails: {
      preview: cdnUrl(thumbnailName),
      ...resizedUrls,
    },
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
  };
};

// ============================================================
// Upload Chat Avatar
// ============================================================

export const uploadChatAvatar = async (
  file: Express.Multer.File,
  chatId: string
): Promise<AvatarResult> => {
  // Валидация
  const validation = validateFileType(file.mimetype, MAX_AVATAR_SIZE);
  if (!validation.valid) {
    throw new Error(validation.error!);
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    throw new Error('Для аватарки чата допустимы только изображения');
  }

  if (file.size > MAX_AVATAR_SIZE) {
    throw new Error('Размер аватарки не должен превышать 5MB');
  }

  const bucket = env.MINIO_BUCKET;

  // Генерация имени файла
  const fileName = generateFileName(file.originalname, `chat-avatars/${chatId}`);

  // Загрузка оригинала
  await uploadToMinIO(bucket, fileName, file.buffer);

  // Генерация thumbnail
  const thumbnail = await generateThumbnail(file.buffer, 256);
  const thumbnailName = generateFileName('thumbnail.jpg', `chat-avatars/${chatId}/thumbs`);
  await uploadToMinIO(bucket, thumbnailName, thumbnail);

  // Resize
  const resized = await resizeAvatar(file.buffer);
  const resizedUrls: Record<string, string> = {};

  for (const size of AVATAR_SIZES) {
    const sizeFileName = generateFileName(`avatar-${size.suffix}.jpg`, `chat-avatars/${chatId}/sizes`);
    await uploadToMinIO(bucket, sizeFileName, resized[size.suffix]);
    resizedUrls[size.suffix] = cdnUrl(sizeFileName);
  }

  return {
    url: cdnUrl(fileName),
    thumbnails: {
      preview: cdnUrl(thumbnailName),
      ...resizedUrls,
    },
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
  };
};

// ============================================================
// Upload Message File (вложение в сообщение)
// ============================================================

interface FileAttachmentResult {
  url: string;
  thumbnailUrl?: string;
  name: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  duration?: number;
}

export const uploadMessageFile = async (
  file: Express.Multer.File,
  _userId: string
): Promise<FileAttachmentResult> => {
  // Валидация
  const validation = validateFileType(file.mimetype, MAX_ATTACHMENT_SIZE);
  if (!validation.valid) {
    throw new Error(validation.error!);
  }

  if (file.size > MAX_ATTACHMENT_SIZE) {
    throw new Error('Размер вложения не должен превышать 50MB');
  }

  const bucket = env.MINIO_BUCKET;
  const fileName = generateFileName(file.originalname, `attachments`);

  // Загрузка в MinIO
  await uploadToMinIO(bucket, fileName, file.buffer);

  const result: FileAttachmentResult = {
    url: cdnUrl(fileName),
    name: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
  };

  // Для изображений — генерируем thumbnail и извлекаем размеры
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    const metadata = await sharp(file.buffer).metadata();
    const thumbFileName = generateFileName('thumb.jpg', `attachments/thumbs`);
    result.thumbnailUrl = cdnUrl(thumbFileName);
    const thumb = await generateThumbnail(file.buffer, 400);
    await uploadToMinIO(bucket, thumbFileName, thumb);
    result.width = metadata.width;
    result.height = metadata.height;
  }

  // Для видео — извлекаем длительность и размеры
  if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    const metadata = await sharp(file.buffer).metadata();
    result.width = metadata.width;
    result.height = metadata.height;
    // Duration нужно извлекать через ffprobe или аналогичную библиотеку
    // Пока ставим null
    result.duration = undefined;
  }

  return result;
};

// ============================================================
// Upload Story Media
// ============================================================

export const uploadStoryMedia = async (
  file: Express.Multer.File,
  userId: string
): Promise<FileAttachmentResult> => {
  // Валидация
  const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Для историй допустимы только изображения и видео');
  }

  const maxSize = ALLOWED_VIDEO_TYPES.includes(file.mimetype) ? MAX_STORY_SIZE : MAX_AVATAR_SIZE;

  if (file.size > maxSize) {
    throw new Error(`Размер медиа для истории не должен превышать ${maxSize / 1024 / 1024}MB`);
  }

  const bucket = env.MINIO_BUCKET;
  const fileName = generateFileName(file.originalname, `stories/${userId}`);

  // Загрузка в MinIO
  await uploadToMinIO(bucket, fileName, file.buffer);

  const result: FileAttachmentResult = {
    url: cdnUrl(fileName),
    name: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
  };

  // Для изображений — thumbnail
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    const metadata = await sharp(file.buffer).metadata();
    const thumbFileName = generateFileName('thumb.jpg', `stories/${userId}/thumbs`);
    result.thumbnailUrl = cdnUrl(thumbFileName);
    const thumb = await generateThumbnail(file.buffer, 400);
    await uploadToMinIO(bucket, thumbFileName, thumb);
    result.width = metadata.width;
    result.height = metadata.height;
  }

  // Для видео — thumbnail и длительность
  if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    const metadata = await sharp(file.buffer).metadata();
    const thumbFileName = generateFileName('thumb.jpg', `stories/${userId}/thumbs`);
    result.thumbnailUrl = cdnUrl(thumbFileName);
    const thumb = await generateThumbnail(file.buffer, 400);
    await uploadToMinIO(bucket, thumbFileName, thumb);
    result.width = metadata.width;
    result.height = metadata.height;
  }

  return result;
};

// ============================================================
// Delete File
// ============================================================

interface DeleteFileInput {
  bucket: string;
  fileName: string;
}

export const deleteFile = async ({ bucket, fileName }: DeleteFileInput): Promise<{ success: boolean; message: string }> => {
  try {
    await deleteFromMinIO(bucket, fileName);
    return { success: true, message: 'Файл удалён' };
  } catch (error: any) {
    throw new Error(error.message || 'Ошибка удаления файла');
  }
};

// ============================================================
// Get File Info (metadata из MinIO)
// ============================================================

export const getFileInfo = async (bucket: string, fileName: string): Promise<any> => {
  try {
    const minioClient = createMinIOClient();
    return await minioClient.statObject(bucket, fileName);
  } catch (error: any) {
    if (error.code === 'NoSuchKey') {
      return null;
    }
    throw new Error(`Ошибка получения информации о файле: ${error.message}`);
  }
};
