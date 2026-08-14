import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

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
    res.status(500).json({ error: 'Internal Error', message: error.message });
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
    res.status(500).json({ error: 'Internal Error', message: error.message });
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
    res.status(500).json({ error: 'Internal Error', message: error.message });
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
    res.status(500).json({ error: 'Internal Error', message: error.message });
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
    res.status(500).json({ error: 'Internal Error', message: error.message });
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
    res.status(500).json({ error: 'Internal Error', message: error.message });
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
    res.status(500).json({ error: 'Internal Error', message: error.message });
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
    res.status(500).json({ error: 'Internal Error', message: error.message });
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
    res.status(500).json({ error: 'Internal Error', message: error.message });
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
    res.status(500).json({ error: 'Internal Error', message: error.message });
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
    res.status(500).json({ error: 'Internal Error', message: error.message });
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
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};
