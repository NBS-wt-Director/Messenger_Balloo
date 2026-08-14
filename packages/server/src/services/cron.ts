import { expireOldStories } from './storyService';
import { expireOldPolls } from './pollService';

let cronInterval: NodeJS.Timeout | null = null;

// Запуск cron job — очистка истекших историй и опросов
export const startCron = () => {
  const runCron = async () => {
    try {
      const now = new Date();

      // Удаляем истекшие истории
      const storyResult = await expireOldStories();
      if (storyResult.deletedCount > 0) {
        console.log(`[Cron ${now.toISOString()}] Deleted ${storyResult.deletedCount} expired stories`);
      }

      // Помечаем истекшие опросы
      const pollResult = await expireOldPolls();
      if (pollResult.expiredCount > 0) {
        console.log(`[Cron ${now.toISOString()}] Expired ${pollResult.expiredCount} polls`);
      }
    } catch (error) {
      console.error('[Cron] Error during cleanup:', error);
    }
  };

  // Запускаем сразу при старте
  runCron();

  // Затем каждые 15 минут
  cronInterval = setInterval(runCron, 15 * 60 * 1000);

  console.log('[Cron] Story/Poll cleanup scheduler started (every 15 min)');
};

// Остановка cron job (для тестов)
export const stopCron = () => {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    console.log('[Cron] Scheduler stopped');
  }
};
