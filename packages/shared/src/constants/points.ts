// Баллы Balloo — единица внутренней экономики (тикет 1795686329).
//
// MVP1: платных услуг нет, баланс существует как подготовленная сущность.
// MVP2: из баланса списывается стоимость платных сообщений
// (сообщение с >15 вложениями стоит n + 5 баллов, тикет 1795677071).

/** Приветственный бонус при регистрации (email/пароль и OAuth). */
export const REGISTRATION_BONUS = 555;

/** Бесплатный лимит вложений в одном сообщении (MVP1). */
export const FREE_ATTACHMENTS_LIMIT = 15;

/** Жёсткий лимит вложений в одном сообщении (MVP2). */
export const MAX_ATTACHMENTS_LIMIT = 50;

/** Стоимость платного сообщения: n + 5 баллов, n — число вложений. */
export const PAID_MESSAGE_SURCHARGE = 5;

/**
 * Стоимость отправки сообщения с n вложениями в баллах.
 * 1–15 вложений — бесплатно, 16–50 — n + 5.
 */
export function messageCostPoints(attachmentsCount: number): number {
  if (attachmentsCount <= FREE_ATTACHMENTS_LIMIT) return 0;
  return attachmentsCount + PAID_MESSAGE_SURCHARGE;
}
