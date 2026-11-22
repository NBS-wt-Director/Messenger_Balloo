// Error 555 Screen — страница «Аккаунт заблокирован»
// Shared error screen (1_00_07) — макет mockups/shared/error-555.html

import { AppTopbar } from '@/components/chrome/AppTopbar';
import { AppFooter } from '@/components/chrome/AppFooter';

function Error555Screen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppTopbar title="Ошибка 555" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🦊🔒</div>
        <div style={{ fontSize: 120, fontWeight: 900, color: 'var(--danger)', lineHeight: 1, marginBottom: 8, letterSpacing: -4 }}>555</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Аккаунт заблокирован</h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 480, lineHeight: 1.6, marginBottom: 20 }}>
          Ваш аккаунт был заблокирован за нарушение правил платформы. Вы можете подать обжалование в течение ограниченного времени.
        </p>

        {/* Instruction Card */}
        <div style={{ maxWidth: 560, width: '100%', margin: '0 auto 24px', background: 'var(--bg-glass)', backdropFilter: 'blur(var(--blur))', border: '1px solid var(--border-color)', padding: '20px 24px', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '2px 8px', border: '1px solid var(--border-color)', letterSpacing: 0.3 }}>ID 55501</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Инструкция по разбану</span>
          </div>

          {[
            { num: 1, text: <><strong>Ознакомьтесь с причиной бана.</strong> Проверьте уведомление — в нём указано, какое правило нарушено и какие действия привели к блокировке.</> },
            { num: 2, text: <><strong>Подайте обжалование.</strong> Нажмите кнопку «Обжаловать бан» ниже. У вас есть <strong>72 часа</strong> с момента блокировки, чтобы подать заявку.</> },
            { num: 3, text: <><strong>Опишите ситуацию.</strong> В форме обжалования укажите, почему вы считаете бан ошибочным, или принесите извинения, если нарушение было случайным. Приложите доказательства при необходимости.</> },
            { num: 4, text: <><strong>Ожидайте решения.</strong> Администрация рассматривает обжалования в течение <strong>24 часов</strong>. Статус заявки можно отслеживать в окне обжалования.</> },
            { num: 5, text: <><strong>Решение принято.</strong> Если бан снят — вы получите уведомление и сможете продолжить пользоваться Balloo. Если отклонён — вы сможете подать повторное обжалование через <strong>30 дней</strong>.</> },
          ].map(step => (
            <div key={step.num} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: step.num === 5 ? 'none' : '1px solid var(--border-color)' }}>
              <span style={{ flexShrink: 0, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent)', color: 'var(--accent-text)', fontSize: 12, fontWeight: 800 }}>{step.num}</span>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{step.text}</span>
            </div>
          ))}

          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-color)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            ⚖️ Если вы считаете, что бан ошибочен, вы также можете обратиться в чат поддержки: <a href="mailto:support@balloo.su" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>support@balloo.su</a>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => (window.location.hash = '#/ban-appeal')}
            style={{ padding: '0.75rem 1.5rem', background: 'var(--accent)', color: '#fff', fontWeight: 600, borderRadius: 0, border: 'none', cursor: 'pointer', fontSize: 14 }}
          >
            📝 Обжаловать бан
          </button>
          <a
            href="mailto:support@balloo.su"
            style={{ padding: '0.75rem 1.5rem', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontWeight: 600, borderRadius: 0, cursor: 'pointer', textDecoration: 'none', fontSize: 14 }}
          >
            ✉️ Написать в поддержку
          </a>
        </div>
      </div>

      <AppFooter />
    </div>
  );
}

export default Error555Screen;
