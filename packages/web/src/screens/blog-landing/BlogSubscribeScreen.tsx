// BlogSubscribeScreen — подтверждение подписки на рассылку (blog.balloo.su)
// Тикет №60 — Blog: корпоративный блог (узел 11)

import { useNavigate } from 'react-router-dom';
import { BlogTopBar } from './BlogTopBar';
import { BlogSubscribeForm } from './BlogSubscribeForm';

export default function BlogSubscribeScreen() {
  const navigate = useNavigate();

  return (
    <div>
      <BlogTopBar title="Подписка" />
      <div className="main">
        <div className="content overflow-y-auto">
          <div className="page-container">
            <div className="text-center" style={{ padding: '40px 0' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
              <h1 className="page-title">Вы подписаны!</h1>
              <p className="page-subtitle mb-6">
                Теперь вы будете получать уведомления о новых статьях, релизах и событиях Balloo на почту.
              </p>

              <div className="flex gap-2 justify-center mb-6">
                <button className="btn btn--accent" onClick={() => navigate('/blog')}>
                  📝 Перейти в блог
                </button>
                <button className="btn btn--secondary" onClick={() => navigate('/')}>
                  🏠 На главную
                </button>
              </div>
            </div>

            {/* Manage subscription / subscribe another email */}
            <div style={{ maxWidth: 500, margin: '0 auto' }}>
              <BlogSubscribeForm />

              <div className="card mt-4">
                <h3 className="card__title mb-3">📬 Управление подпиской</h3>
                <p className="text-secondary text-sm mb-4">
                  Вы можете отписаться от рассылки в любой момент, перейдя по ссылке
                  «Отписаться» в любом письме от Balloo.
                </p>
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  <span className="chip">📧 Email-рассылка</span>
                  <span className="chip">🔔 Новые статьи</span>
                  <span className="chip">🚀 Релизы</span>
                  <span className="chip">📢 События</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
