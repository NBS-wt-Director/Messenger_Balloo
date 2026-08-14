// BlogShareButtons — кнопки шаринга
// Тикет №60 — Blog: корпоративный блог

interface BlogShareButtonsProps {
  title: string;
  url?: string;
}

export function BlogShareButtons({ title, url }: BlogShareButtonsProps) {
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const share = (platform: string) => {
    const encodedTitle = encodeURIComponent(title);
    const encodedUrl = encodeURIComponent(shareUrl);
    const links: Record<string, string> = {
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      vk: `https://vk.com/share.php?url=${encodedUrl}&title=${encodedTitle}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
      copy: '',
    };

    if (platform === 'copy') {
      navigator.clipboard?.writeText(shareUrl).catch(() => {});
      return;
    }

    if (links[platform]) {
      window.open(links[platform], '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="blog-share flex gap-2">
      <button className="btn btn--tertiary btn--sm" onClick={() => share('telegram')} title="Поделиться в Telegram">
        ✈️
      </button>
      <button className="btn btn--tertiary btn--sm" onClick={() => share('vk')} title="Поделиться ВКонтакте">
        📌
      </button>
      <button className="btn btn--tertiary btn--sm" onClick={() => share('email')} title="Отправить по email">
        ✉️
      </button>
      <button className="btn btn--tertiary btn--sm" onClick={() => share('copy')} title="Копировать ссылку">
        🔗
      </button>
    </div>
  );
}
