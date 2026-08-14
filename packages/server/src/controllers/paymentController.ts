import { Request, Response, NextFunction } from 'express';
import {
  createDonation as createDonationService,
  getDonationTiers,
  processYookassaWebhook,
  getUserDonations as getUserDonationsService,
  getAllDonations,
  confirmManualDonation,
  getOrCreatePaymentConfig,
  updatePaymentConfig,
} from '../services/paymentService';
import { AuthenticatedRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================
// GET /api/payments/config — публичная конфигурация платежей
// ============================================================

export const getConfig = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const config = await getOrCreatePaymentConfig();
    res.json({
      mode: config.mode,
      sbpQrUrl: config.sbpQrUrl,
      sbpPhoneNumber: config.sbpPhoneNumber,
      sbpPhoneName: config.sbpPhoneName,
      forKassaUrl: config.forKassaUrl,
      yookassaConnected: config.yookassaConnected,
      // В анонимном режиме показываем уведомление о ЮKassa
      notice: config.mode === 'anonymous'
        ? '🔔 Подключаем ЮKassa для полноценных платежей. Пока вы можете поддержать проект через СБП.'
        : undefined,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// ============================================================
// POST /api/payments/donate — создание платежа
// ============================================================

export const createDonation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { tierId, amount, currency } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Сумма доната должна быть больше 0',
      });
      return;
    }

    const result = await createDonationService({
      userId,
      tierId: tierId || undefined,
      amount: Number(amount),
      currency: currency || 'RUB',
    });

    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// ============================================================
// GET /api/payments/tiers — уровни донатов (публичный)
// ============================================================

export const getTiers = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tiers = await getDonationTiers();
    res.json({ tiers });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// ============================================================
// GET /api/payments/me/donations — история донатов пользователя
// ============================================================

export const getUserDonations = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 50);

    const result = await getUserDonationsService(userId, page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// ============================================================
// POST /api/payments/webhook/yookassa — HTTP-уведомления от ЮKassa
// ============================================================

export const yookassaWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const body = JSON.stringify(req.body);
    const headers: Record<string, string> = {};

    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') {
        headers[key] = value;
      }
    }

    const result = await processYookassaWebhook(body, headers);

    if (result.status === 'error') {
      res.status(400).json({ error: 'Webhook Error', message: result.message });
      return;
    }

    // ЮKassa ожидает 200 OK
    res.status(200).json({
      status: 'ok',
      donationId: result.donationId,
      message: result.message,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// ============================================================
// GET /api/payments/admin/config — получение настроек (админка)
// ============================================================

export const getAdminConfig = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const config = await prisma.paymentConfig.findFirst();
    res.json({
      config: config ? {
        id: config.id,
        mode: config.mode,
        shopId: config.shopId ? config.shopId.slice(0, 4) + '****' : null,
        hasSecretKey: !!config.secretKey,
        sbpQrUrl: config.sbpQrUrl,
        sbpPhoneNumber: config.sbpPhoneNumber,
        sbpPhoneName: config.sbpPhoneName,
        forKassaUrl: config.forKassaUrl,
        webhookActive: config.webhookActive,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      } : null,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// ============================================================
// PUT /api/payments/admin/config — обновление настроек (админка)
// ============================================================

export const updateAdminConfig = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { mode, shopId, secretKey, sbpQrUrl, sbpPhoneNumber, sbpPhoneName, forKassaUrl, webhookActive } = req.body;

    const config = await updatePaymentConfig({
      mode,
      shopId: shopId !== undefined ? shopId : undefined,
      secretKey: secretKey !== undefined ? secretKey : undefined,
      sbpQrUrl,
      sbpPhoneNumber,
      sbpPhoneName,
      forKassaUrl,
      webhookActive,
    });

    res.json({
      message: 'Настройки платежей обновлены',
      config,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// ============================================================
// GET /api/payments/admin/donations — список всех донатов (админка)
// ============================================================

export const getAdminDonations = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100);
    const status = req.query.status as string | undefined;

    const result = await getAllDonations(page, limit, status);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// ============================================================
// POST /api/payments/admin/confirm/:id — подтверждение ручного доната (админка)
// ============================================================

export const confirmDonation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const success = await confirmManualDonation(id);

    if (!success) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Донат не найден или уже обработан',
      });
      return;
    }

    res.json({ message: 'Донат подтверждён' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};
