import{c as b,u as j,r as c,j as e}from"./index-B97IgFNk.js";const p={title:"🚀 Быстрый старт для разработчика",description:"Как развернуть проект локально: pnpm install, docker compose up, настройка переменных окружения.",tags:["onboarding","setup"],readTime:"15 мин",progress:{current:1,total:5},lastUpdated:"28 июля 2026",author:"Иван Иванов",sections:[{id:"s1",title:"1. Требования",content:`Для локальной разработки потребуется:

• Node.js 20+
• pnpm (npm install -g pnpm)
• Docker и Docker Compose
• PostgreSQL 16
• Redis 7

Убедитесь, что все зависимости установлены и работают.`},{id:"s2",title:"2. Клонирование и установка",content:`git clone https://github.com/balloo/messenger.git
cd messenger
pnpm install

Монорепо использует pnpm workspaces. Все зависимости устанавливаются автоматически в корневой директории.`},{id:"s3",title:"3. Настройка окружения",content:`Скопируйте .env.example в .env:
cp .env.example .env

Заполните переменные:
• DATABASE_URL — URL подключения к PostgreSQL
• REDIS_URL — URL подключения к Redis
• JWT_SECRET — секрет для JWT токенов
• SETUP_PASSWORD — пароль установки`},{id:"s4",title:"4. Запуск сервисов",content:`docker compose up -d postgres redis

cd packages/shared
npx prisma db push
npx prisma db seed

cd ../../packages/server
pnpm dev

cd ../../packages/web
pnpm dev

Сервер запустится на порту 3100, web — на 5173.`},{id:"s5",title:"5. Проверка",content:`Откройте http://localhost:5173 — должна появиться landing page.

Проверьте API: curl http://localhost:3100/health

Ожидаемый ответ: {"status":"ok","timestamp":...}`}]};function f(){const{pageId:v}=b(),i=j(),[n,x]=c.useState(new Set(["s1"])),[l,r]=c.useState(!1),[m,h]=c.useState(p.sections[0].content),t=p,o=s=>{x(a=>{const d=new Set(a);return d.has(s)?d.delete(s):d.add(s),d})},g=()=>{alert("Статья отмечена как прочитанная!")};return e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-3 mb-4",children:[e.jsx("button",{className:"btn btn--tertiary btn--sm",onClick:()=>i("/command/knowledge"),style:{padding:"6px 12px"},children:"← Назад"}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("h1",{className:"page-title",style:{margin:0},children:t.title}),e.jsx("span",{className:"chip chip--danger",children:"Новое"}),t.isUpdated&&e.jsx("span",{className:"chip chip--info",children:"Обновлено"})]}),e.jsx("p",{className:"page-subtitle mb-0",children:t.description})]})]}),e.jsxs("div",{className:"card mb-4",style:{padding:"12px 16px",display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"},children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"avatar avatar--sm avatar--bordered avatar--status-online avatar--ctx-contact",children:e.jsx("div",{className:"avatar__inner",children:e.jsx("span",{children:"ИВ"})})}),e.jsx("span",{style:{fontSize:13},children:t.author})]}),e.jsx("span",{className:"chip",children:t.readTime}),e.jsxs("span",{className:"text-xs text-muted",children:["Обновлено: ",t.lastUpdated]}),e.jsx("div",{style:{flex:1}}),e.jsxs("span",{className:"text-xs text-muted",children:["Прогресс: ",t.progress.current,"/",t.progress.total]}),e.jsx("button",{className:"btn btn--primary btn--sm",onClick:g,children:"✅ Отметить прочитанным"}),e.jsx("button",{className:"btn btn--tertiary btn--sm",onClick:()=>r(!l),children:l?"❌ Отмена":"✏️ Редактировать"})]}),e.jsx("div",{className:"flex gap-2 mb-4",children:t.tags.map(s=>e.jsx("span",{className:"chip",children:s},s))}),e.jsxs("div",{className:"card mb-4",children:[e.jsx("div",{style:{padding:"12px 16px",borderBottom:"1px solid var(--border-color)"},children:e.jsx("h3",{style:{margin:0,fontSize:14,fontWeight:600},children:"📑 Содержание"})}),e.jsx("div",{style:{padding:"8px 0"},children:t.sections.map((s,a)=>e.jsxs("div",{className:"tab",onClick:()=>o(s.id),style:{padding:"8px 16px",cursor:"pointer",borderLeft:n.has(s.id)?"3px solid var(--accent)":"3px solid transparent",background:n.has(s.id)?"var(--bg-elevated)":"transparent",fontSize:13},children:[a+1,". ",s.title]},s.id))})]}),e.jsx("div",{children:t.sections.map(s=>e.jsxs("div",{className:"card mb-2",style:{borderLeft:`3px solid ${n.has(s.id)?"var(--accent)":"var(--border-color)"}`},children:[e.jsxs("div",{className:"flex items-center justify-between",style:{padding:"12px 16px",cursor:"pointer"},onClick:()=>o(s.id),children:[e.jsxs("h3",{style:{margin:0,fontSize:15,fontWeight:600},children:[t.sections.indexOf(s)+1,". ",s.title]}),e.jsx("span",{style:{fontSize:12,color:"var(--text-muted)"},children:n.has(s.id)?"▲ Свернуть":"▼ Развернуть"})]}),n.has(s.id)&&e.jsxs("div",{style:{padding:"0 16px 16px"},children:[l?e.jsx("textarea",{className:"form-input",value:m,onChange:a=>h(a.target.value),rows:8,style:{width:"100%",fontFamily:"monospace",fontSize:13}}):e.jsx("div",{className:"card__body",style:{whiteSpace:"pre-line",lineHeight:1.7},children:s.content}),l&&e.jsxs("div",{className:"flex gap-2 mt-2",children:[e.jsx("button",{className:"btn btn--primary btn--sm",onClick:()=>{r(!1),alert("Сохранено!")},children:"💾 Сохранить"}),e.jsx("button",{className:"btn btn--tertiary btn--sm",onClick:()=>r(!1),children:"Отмена"})]})]})]},s.id))}),e.jsxs("div",{className:"card mt-6",children:[e.jsx("h3",{style:{margin:"0 0 12px 0",fontSize:14,fontWeight:600},children:"📌_related_ статьи"}),e.jsxs("div",{className:"flex gap-2 flex-wrap",children:[e.jsxs("div",{className:"card card--hover",style:{padding:"10px 14px",cursor:"pointer",flex:"1 1 200px"},onClick:()=>i("/command/knowledge/2"),children:[e.jsx("div",{style:{fontSize:13,fontWeight:600},children:"🎨 Дизайн-система Balloo"}),e.jsx("div",{className:"text-xs text-muted mt-1",children:"Восьмигранные аватарки, пузыри..."})]}),e.jsxs("div",{className:"card card--hover",style:{padding:"10px 14px",cursor:"pointer",flex:"1 1 200px"},onClick:()=>i("/command/knowledge/3"),children:[e.jsx("div",{style:{fontSize:13,fontWeight:600},children:"🔐 Авторизация и NextAuth.js"}),e.jsx("div",{className:"text-xs text-muted mt-1",children:"Настройка OAuth..."})]}),e.jsxs("div",{className:"card card--hover",style:{padding:"10px 14px",cursor:"pointer",flex:"1 1 200px"},onClick:()=>i("/command/knowledge/4"),children:[e.jsx("div",{style:{fontSize:13,fontWeight:600},children:"🗄️ База данных и Prisma"}),e.jsx("div",{className:"text-xs text-muted mt-1",children:"Схема БД, миграции..."})]})]})]}),e.jsxs("div",{className:"card mt-4",style:{padding:"12px 16px",display:"flex",alignItems:"center",gap:12},children:[e.jsx("button",{className:"btn btn--tertiary btn--sm",children:"👍 Полезно"}),e.jsx("button",{className:"btn btn--tertiary btn--sm",children:"👎 Не полезно"}),e.jsx("button",{className:"btn btn--tertiary btn--sm",children:"🔗 Поделиться"}),e.jsx("button",{className:"btn btn--tertiary btn--sm",children:"🚩 Пожаловаться"}),e.jsx("div",{style:{flex:1}}),e.jsx("button",{className:"btn btn--tertiary btn--sm",children:"🖨️ Печать"})]})]})}export{f as KnowledgePageScreen};
