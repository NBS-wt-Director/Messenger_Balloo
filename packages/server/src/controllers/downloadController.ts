import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { AuthenticatedRequest } from '../middleware/auth';
import { internalError } from '../middleware/errorHandler';
import { env } from '../config/env';
import { paths } from '../config/paths';

const prisma = new PrismaClient();

// ============================================================
// Вспомогательная функция для создания записи DownloadFile
// ============================================================
async function createDownloadRecord(
  platform: string,
  format: string,
  version: string,
  arch: string | undefined,
  url: string,
  size: number,
  checksum: string | undefined
) {
  return prisma.downloadFile.create({
    data: {
      platform: `${platform}-${format}${arch ? `-${arch}` : ''}`,
      version,
      url,
      size: BigInt(size || 0),
      checksum: checksum || null,
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
    },
  });
}

// ============================================================
// Загрузить артефакт мобильной сборки (POST /api/downloads/upload-mobile)
// ============================================================
// Admin-only. Параметры:
//   platform: "android" | "ios"
//   format: "apk" | "aab" | "ipa"
//   version: semver (например, "1.0.0")
//   arch: "universal" | "arm64-v8a" | "armeabi-v7a" | "x86_64"
//   url: string (URL на CDN)
//   size: number (байты)
//   checksum: string (SHA-256)

export const uploadMobile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { platform, format, version, arch, url, size, checksum } = req.body;

    // Валидация обязательных полей
    if (!platform || !format || !version || !url) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Обязательные поля: platform, format, version, url',
      });
      return;
    }

    if (!['android', 'ios'].includes(platform)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'platform должен быть "android" или "ios"',
      });
      return;
    }

    if (!['apk', 'aab', 'ipa'].includes(format)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'format должен быть "apk", "aab" или "ipa"',
      });
      return;
    }

    // Создаём запись в БД
    const downloadFile = await createDownloadRecord(platform, format, version, arch, url, size, checksum);

    res.status(201).json({
      success: true,
      data: {
        id: downloadFile.id,
        platform: downloadFile.platform,
        version: downloadFile.version,
        url: downloadFile.url,
        size: downloadFile.size.toString(),
        checksum: downloadFile.checksum,
      },
    });
  } catch (error: any) {
    internalError(res, error, 'downloadController.uploadMobile');
  }
};

// ============================================================
// Список Android-пакетов (GET /api/downloads/android)
// ============================================================

export const listAndroidDownloads = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const files = await prisma.downloadFile.findMany({
      where: {
        platform: {
          startsWith: 'android',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const packages = files.map((f) => ({
      id: f.id,
      platform: f.platform,
      version: f.version,
      url: f.url,
      size: f.size.toString(),
      checksum: f.checksum,
      createdAt: Number(f.createdAt),
    }));

    res.json({ platform: 'android', packages });
  } catch (error: any) {
    internalError(res, error, 'downloadController.listAndroidDownloads');
  }
};

// ============================================================
// Пакет для конкретной архитектуры Android (GET /api/downloads/android/:arch)
// ============================================================

export const getAndroidArchPackage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { arch } = req.params;

    const validArches = ['universal', 'arm64-v8a', 'armeabi-v7a', 'x86_64'];
    if (!validArches.includes(arch)) {
      res.status(400).json({
        error: 'Bad Request',
        message: `arch должен быть одним из: ${validArches.join(', ')}`,
      });
      return;
    }

    // Ищем последнюю запись для этой архитектуры
    const files = await prisma.downloadFile.findMany({
      where: {
        platform: {
          startsWith: 'android-apk',
          contains: arch === 'universal' ? '' : arch,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1,
    });

    if (files.length === 0) {
      res.status(404).json({
        error: 'Not Found',
        message: `Пакет для архитектуры "${arch}" не найден`,
      });
      return;
    }

    const f = files[0];
    res.json({
      platform: f.platform,
      version: f.version,
      url: f.url,
      size: f.size.toString(),
      checksum: f.checksum,
      createdAt: Number(f.createdAt),
    });
  } catch (error: any) {
    internalError(res, error, 'downloadController.getAndroidArchPackage');
  }
};

// ============================================================
// Список iOS-пакетов (GET /api/downloads/ios)
// ============================================================

export const listIosDownloads = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const files = await prisma.downloadFile.findMany({
      where: {
        platform: {
          startsWith: 'ios',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const packages = files.map((f) => ({
      id: f.id,
      platform: f.platform,
      version: f.version,
      url: f.url,
      size: f.size.toString(),
      checksum: f.checksum,
      createdAt: Number(f.createdAt),
    }));

    res.json({ platform: 'ios', packages });
  } catch (error: any) {
    internalError(res, error, 'downloadController.listIosDownloads');
  }
};

// ============================================================
// Загрузить артефакт Desktop сборки (POST /api/downloads/upload-desktop)
// ============================================================
// Admin-only. Параметры:
//   platform: "win" | "linux" | "mac"
//   format: "exe" | "msi" | "portable" | "deb" | "rpm" | "appimage" | "tar.gz" | "dmg" | "zip"
//   version: semver (например, "1.0.0")
//   arch: "x64" | "ia32" | "arm64"
//   url: string (URL на CDN)
//   size: number (байты)
//   checksum: string (SHA-256)

export const uploadDesktop = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { platform, format, version, arch, url, size, checksum } = req.body;

    // Валидация обязательных полей
    if (!platform || !format || !version || !url) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Обязательные поля: platform, format, version, url',
      });
      return;
    }

    const validPlatforms = ['win', 'linux', 'mac'];
    if (!validPlatforms.includes(platform)) {
      res.status(400).json({
        error: 'Bad Request',
        message: `platform должен быть одним из: ${validPlatforms.join(', ')}`,
      });
      return;
    }

    const validFormats = ['exe', 'msi', 'portable', 'deb', 'rpm', 'appimage', 'tar.gz', 'dmg', 'zip'];
    if (!validFormats.includes(format)) {
      res.status(400).json({
        error: 'Bad Request',
        message: `format должен быть одним из: ${validFormats.join(', ')}`,
      });
      return;
    }

    // Создаём запись в БД
    const downloadFile = await createDownloadRecord(platform, format, version, arch, url, size, checksum);

    res.status(201).json({
      success: true,
      data: {
        id: downloadFile.id,
        platform: downloadFile.platform,
        version: downloadFile.version,
        url: downloadFile.url,
        size: downloadFile.size.toString(),
        checksum: downloadFile.checksum,
      },
    });
  } catch (error: any) {
    internalError(res, error, 'downloadController.uploadDesktop');
  }
};

// ============================================================
// Список всех Desktop-пакетов (GET /api/downloads/desktop)
// ============================================================

export const listDesktopDownloads = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const files = await prisma.downloadFile.findMany({
      where: {
        OR: [
          { platform: { startsWith: 'win' } },
          { platform: { startsWith: 'linux' } },
          { platform: { startsWith: 'mac' } },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Группируем по платформе
    const grouped: Record<string, any[]> = {
      win: [],
      linux: [],
      mac: [],
    };

    for (const f of files) {
      const plat = f.platform.split('-')[0]; // "win", "linux", "mac"
      if (grouped[plat]) {
        grouped[plat].push({
          id: f.id,
          platform: f.platform,
          version: f.version,
          url: f.url,
          size: f.size.toString(),
          checksum: f.checksum,
          createdAt: Number(f.createdAt),
        });
      }
    }

    res.json({ desktop: grouped });
  } catch (error: any) {
    internalError(res, error, 'downloadController.listDesktopDownloads');
  }
};

// ============================================================
// Пакеты для конкретной ОС (GET /api/downloads/desktop/:platform)
// ============================================================

export const getDesktopPlatformPackages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { platform } = req.params;

    const validPlatforms = ['win', 'linux', 'mac'];
    if (!validPlatforms.includes(platform)) {
      res.status(400).json({
        error: 'Bad Request',
        message: `platform должен быть одним из: ${validPlatforms.join(', ')}`,
      });
      return;
    }

    const files = await prisma.downloadFile.findMany({
      where: {
        platform: {
          startsWith: platform,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const packages = files.map((f) => ({
      id: f.id,
      platform: f.platform,
      version: f.version,
      url: f.url,
      size: f.size.toString(),
      checksum: f.checksum,
      createdAt: Number(f.createdAt),
    }));

    res.json({ platform, packages });
  } catch (error: any) {
    internalError(res, error, 'downloadController.getDesktopPlatformPackages');
  }
};

// ============================================================
// Конкретный формат для ОС (GET /api/downloads/desktop/:platform/:format)
// ============================================================

export const getDesktopPlatformFormat = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { platform, format } = req.params;

    const validPlatforms = ['win', 'linux', 'mac'];
    if (!validPlatforms.includes(platform)) {
      res.status(400).json({
        error: 'Bad Request',
        message: `platform должен быть одним из: ${validPlatforms.join(', ')}`,
      });
      return;
    }

    const files = await prisma.downloadFile.findMany({
      where: {
        platform: {
          startsWith: `${platform}-${format}`,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const packages = files.map((f) => ({
      id: f.id,
      platform: f.platform,
      version: f.version,
      url: f.url,
      size: f.size.toString(),
      checksum: f.checksum,
      createdAt: Number(f.createdAt),
    }));

    res.json({ platform, format, packages });
  } catch (error: any) {
    internalError(res, error, 'downloadController.getDesktopPlatformFormat');
  }
};

// ============================================================
// Общий список всех загрузок (GET /api/downloads)
// ============================================================
// Возвращает сгруппированный список: desktop (win/linux/mac) + mobile (android/ios)

export const getDownloads = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const files = await prisma.downloadFile.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const desktop: Record<string, any[]> = { win: [], linux: [], mac: [] };
    const mobile: Record<string, any[]> = { android: [], ios: [] };

    const mapFile = (f: any) => ({
      id: f.id,
      platform: f.platform,
      version: f.version,
      url: f.url,
      size: f.size.toString(),
      checksum: f.checksum,
      createdAt: Number(f.createdAt),
    });

    for (const f of files) {
      const plat = f.platform.split('-')[0];
      if (desktop[plat]) {
        desktop[plat].push(mapFile(f));
      } else if (mobile[plat]) {
        mobile[plat].push(mapFile(f));
      }
    }

    res.json({ desktop, mobile });
  } catch (error: any) {
    internalError(res, error, 'downloadController.getDownloads');
  }
};

// ============================================================
// Пакеты для конкретной мобильной платформы (GET /api/downloads/:platform)
// ============================================================
// platform: "android" | "ios"

export const getPlatformDownloads = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { platform } = req.params;

    const validPlatforms = ['android', 'ios'];
    if (!validPlatforms.includes(platform)) {
      res.status(400).json({
        error: 'Bad Request',
        message: `platform должен быть одним из: ${validPlatforms.join(', ')}`,
      });
      return;
    }

    const files = await prisma.downloadFile.findMany({
      where: { platform: { startsWith: platform } },
      orderBy: { createdAt: 'desc' },
    });

    const packages = files.map((f) => ({
      id: f.id,
      platform: f.platform,
      version: f.version,
      url: f.url,
      size: f.size.toString(),
      checksum: f.checksum,
      createdAt: Number(f.createdAt),
    }));

    res.json({ platform, packages });
  } catch (error: any) {
    internalError(res, error, 'downloadController.getPlatformDownloads');
  }
};

// ============================================================
// Получить ссылку на скачивание по ID (GET /api/downloads/:id/url)
// ============================================================

export const getDownloadUrl = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const file = await prisma.downloadFile.findUnique({ where: { id } });

    if (!file) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Файл не найден',
      });
      return;
    }

    res.json({
      id: file.id,
      url: file.url,
      version: file.version,
      checksum: file.checksum,
      size: file.size.toString(),
    });
  } catch (error: any) {
    internalError(res, error, 'downloadController.getDownloadUrl');
  }
};

// ============================================================
// Записать факт скачивания — статистика (POST /api/downloads/:id/download)
// ============================================================

export const recordDownload = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const file = await prisma.downloadFile.findUnique({ where: { id } });

    if (!file) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Файл не найден',
      });
      return;
    }

    // Записываем метрику скачивания (ServiceMetric)
    await prisma.serviceMetric.create({
      data: {
        name: `download:${file.platform}`,
        value: 1,
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
      },
    });

    res.json({ success: true, id: file.id });
  } catch (error: any) {
    internalError(res, error, 'downloadController.recordDownload');
  }
};

// ============================================================
// APK self-update (тикеты 1791927977)
// ============================================================

// Разрешённые архитектуры Android (совпадают с getAndroidArchPackage)
const ANDROID_ARCHES = ['universal', 'arm64-v8a', 'armeabi-v7a', 'x86_64'];

// SHA-256 файла потоковым чтением (APK до 200 МБ в память не грузим)
function sha256OfFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    fs.createReadStream(filePath)
      .on('error', reject)
      .on('data', (chunk) => hash.update(chunk))
      .on('end', () => resolve(hash.digest('hex')));
  });
}

// ============================================================
// Загрузить файл мобильной сборки (POST /api/downloads/upload-mobile-file)
// ============================================================
// Admin-only, multipart/form-data (поле file — сам APK/AAB).
// Поля: version (semver, обязательно), versionCode (int, обязательно),
//       arch (по умолчанию universal), format (apk|aab, по умолчанию apk).
// Файл сохраняется в DOWNLOADS_DIR/android/balloo-v<version>-<arch>.<ext>,
// sha256 и размер считаются по факту записи, запись — в DownloadFile.

export const uploadMobileFile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const tmpPath = req.file?.path;
  // Удаляет временный файл multer на ЛЮБОЙ ветке отказа (400/500).
  // Без этого неудачные попытки забивают DOWNLOADS_DIR мусором.
  const cleanupTmp = () => {
    try {
      if (tmpPath && fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    } catch {
      /* best-effort */
    }
  };
  try {
    const { version, versionCode, arch = 'universal', format = 'apk' } = req.body;

    if (!req.file) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Поле file (APK/AAB) обязательно — multipart/form-data',
      });
      return;
    }

    if (!version || !/^\d+\.\d+\.\d+([-+][0-9A-Za-z.-]+)?$/.test(version)) {
      cleanupTmp();
      res.status(400).json({
        error: 'Bad Request',
        message: 'version обязателен и должен быть semver (например, 1.0.0)',
      });
      return;
    }

    const versionCodeNum = Number(versionCode);
    if (!Number.isInteger(versionCodeNum) || versionCodeNum < 1) {
      cleanupTmp();
      res.status(400).json({
        error: 'Bad Request',
        message: 'versionCode обязателен и должен быть целым числом >= 1',
      });
      return;
    }

    if (!ANDROID_ARCHES.includes(arch)) {
      cleanupTmp();
      res.status(400).json({
        error: 'Bad Request',
        message: `arch должен быть одним из: ${ANDROID_ARCHES.join(', ')}`,
      });
      return;
    }

    if (!['apk', 'aab'].includes(format)) {
      cleanupTmp();
      res.status(400).json({
        error: 'Bad Request',
        message: 'format должен быть "apk" или "aab"',
      });
      return;
    }

    // Каноническое имя: баллоо-версия-архитектура. Перезагрузка той же версии
    // перезаписывает файл (rename поверх) — запись в БД остаётся новой.
    const fileName = `balloo-v${version}-${arch}.${format}`;
    const dir = path.join(paths.downloads, 'android');
    fs.mkdirSync(dir, { recursive: true });
    const finalPath = path.join(dir, fileName);
    fs.renameSync(tmpPath!, finalPath);

    const checksum = await sha256OfFile(finalPath);
    const size = fs.statSync(finalPath).size;
    const url = `${env.DOWNLOAD_BASE_URL.replace(/\/+$/, '')}/downloads/android/${fileName}`;

    const downloadFile = await prisma.downloadFile.create({
      data: {
        platform: `android-${format}-${arch}`,
        version,
        versionCode: versionCodeNum,
        url,
        size: BigInt(size),
        checksum,
        createdAt: BigInt(Math.floor(Date.now() / 1000)),
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: downloadFile.id,
        platform: downloadFile.platform,
        version: downloadFile.version,
        versionCode: downloadFile.versionCode,
        url: downloadFile.url,
        size: downloadFile.size.toString(),
        checksum: downloadFile.checksum,
      },
    });
  } catch (error: any) {
    // Не оставляем осиротевший временный файл при ошибке
    cleanupTmp();
    internalError(res, error, 'downloadController.uploadMobileFile');
  }
};

// ============================================================
// Последняя Android-сборка для self-update (GET /api/downloads/android/latest)
// ============================================================
// Публичный. Query: arch (по умолчанию universal).
// Сортировка: versionCode desc (NULLs last), затем createdAt desc.
// 404 — пакетов ещё нет (приложение молча продолжает работать).

export const getAndroidLatest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const arch = String(req.query.arch ?? 'universal');
    if (!ANDROID_ARCHES.includes(arch)) {
      res.status(400).json({
        error: 'Bad Request',
        message: `arch должен быть одним из: ${ANDROID_ARCHES.join(', ')}`,
      });
      return;
    }

    const orderBy = [
      { versionCode: { sort: 'desc' as const, nulls: 'last' as const } },
      { createdAt: 'desc' as const },
    ];

    let f = await prisma.downloadFile.findFirst({
      where: { platform: `android-apk-${arch}` },
      orderBy,
    });

    // Legacy-записи без архива в имени (uploadMobile без arch) — только для universal
    if (!f && arch === 'universal') {
      f = await prisma.downloadFile.findFirst({
        where: { platform: 'android-apk' },
        orderBy,
      });
    }

    if (!f) {
      res.status(404).json({
        error: 'Not Found',
        message: `APK для архитектуры "${arch}" ещё не опубликован`,
      });
      return;
    }

    res.json({
      platform: f.platform,
      version: f.version,
      versionCode: f.versionCode,
      url: f.url,
      size: f.size.toString(),
      checksum: f.checksum,
      arch,
      createdAt: Number(f.createdAt),
    });
  } catch (error: any) {
    internalError(res, error, 'downloadController.getAndroidLatest');
  }
};
