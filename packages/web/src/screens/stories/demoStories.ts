// demoStories — предзаписанные демо-истории для пустого экрана (T2).
//
// Требование владельца (тик. 1795683301): «если нет историй — показываем
// предзаписанные видеоистории — 3 штуки (природа России, Урал, города России
// (без слов))».
//
// Файлы лежат в `packages/web/public/demo-stories/` (mp4 H.264 без звука +
// постер jpg). Источники и лицензии — `docs/demo-stories-attribution.md`.
// При замене роликов обновить и манифест, и файл атрибуции.

export interface DemoStory {
  id: string;
  title: string;
  subtitle: string;
  /** Видео без звука, mp4 */
  src: string;
  /** Постер (первый кадр) */
  poster: string;
  /** Короткая подпись источника для UI */
  credit: string;
}

export const DEMO_STORIES: DemoStory[] = [
  {
    id: 'demo-taiga',
    title: 'Тайга',
    subtitle: 'Низкие облака над русской тайгой',
    src: '/demo-stories/taiga.mp4',
    poster: '/demo-stories/taiga.jpg',
    credit: 'FlykitRu · CC BY 3.0 · Wikimedia Commons',
  },
  {
    id: 'demo-ural',
    title: 'Урал',
    subtitle: 'Лодки на реке Урал',
    src: '/demo-stories/ural.mp4',
    poster: '/demo-stories/ural.jpg',
    credit: 'RoyKabanlit · CC BY-SA 4.0 · Wikimedia Commons',
  },
  {
    id: 'demo-spb',
    title: 'Города России',
    subtitle: 'Санкт-Петербург, Петергофское шоссе',
    src: '/demo-stories/spb.mp4',
    poster: '/demo-stories/spb.jpg',
    credit: 'CC BY 4.0 · Wikimedia Commons',
  },
];
