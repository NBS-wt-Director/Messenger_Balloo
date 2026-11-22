// sectionTitles — заголовок раздела для единой шапки (тик. 1795292000).
// MainLayout рендерит один и тот же AppTopbar на всех экранах приложения;
// заголовок в нём должен соответствовать текущему разделу, а не «Чаты» всегда.

/** Заголовок раздела по пути (hash-роутер: pathname без '#' и query). */
export function sectionTitleForPath(pathname: string): string {
  const path = (pathname || '/').replace(/\/+$/, '') || '/';

  // Точные совпадения — раньше префиксных (иначе /chat/:id/poll попадёт в /chat)
  if (path === '/chat') return 'Чаты';
  if (path === '/archive') return 'Архив';
  if (path === '/profile') return 'Профиль';
  if (path === '/accounts') return 'Аккаунты';
  if (path === '/contacts') return 'Контакты';
  if (path === '/contact-groups') return 'Группы контактов';
  if (path === '/settings') return 'Настройки';
  if (path === '/settings/notifications') return 'Уведомления';
  if (path === '/settings/privacy') return 'Приватность';
  if (path === '/settings/blocked') return 'Заблокированные';
  if (path === '/search') return 'Поиск';
  if (path === '/stories') return 'Истории';
  if (path === '/stories/create') return 'Новая история';
  if (path === '/polls') return 'Опросы';
  if (path === '/calls') return 'Звонки';
  if (path === '/knowledge') return 'База знаний';
  if (path === '/knowledge/create') return 'Новая страница';
  if (path === '/group/create') return 'Новая группа';
  if (path === '/channel/create') return 'Новый канал';
  if (path === '/hiring/vacancies' || path === '/hiring/why-us') return 'Вакансии';
  if (path === '/hiring/applications') return 'Мои отклики';

  // Префиксные правила
  if (path.startsWith('/chat/') && path.endsWith('/poll')) return 'Опрос';
  if (path.startsWith('/chat/')) return 'Чаты';
  if (path.startsWith('/profile/')) return 'Профиль';
  if (path.startsWith('/settings/')) return 'Настройки';
  if (path.startsWith('/group/') && path.endsWith('/settings')) return 'Настройки группы';
  if (path.startsWith('/channel/') && path.endsWith('/settings')) return 'Настройки канала';
  if (path.startsWith('/channel/')) return 'Канал';
  if (path.startsWith('/stories/')) return 'Истории';
  if (path.startsWith('/polls/')) return 'Опросы';
  if (path.startsWith('/knowledge/page/') || path.startsWith('/knowledge/edit/')) return 'База знаний';
  if (path.startsWith('/hiring/vacancy/')) return 'Вакансия';
  if (path.startsWith('/hiring/apply/')) return 'Отклик';
  if (path.startsWith('/hiring/application/')) return 'Собеседование';
  if (path.startsWith('/hiring/')) return 'Вакансии';

  return 'Balloo';
}
