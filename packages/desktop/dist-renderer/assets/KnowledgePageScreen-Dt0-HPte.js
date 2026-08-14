import{u as v,r as p,j as e}from"./index-B97IgFNk.js";import{B as j,C as d}from"./Button-CJOqEJ8L.js";const b={id:"1",title:"Регистрация и вход в Balloo",content:`Эта страница поможет вам создать аккаунт в Balloo и войти в систему.

## Создание аккаунта

Для регистрации вам понадобится:
- Действующий адрес электронной почты
- Придуманный пароль (минимум 8 символов)
- Желаемое имя пользователя

### Шаг 1: Переход на страницу регистрации

Откройте Balloo и нажмите кнопку "Регистрация" на экране входа.

### Шаг 2: Заполнение формы

Введите ваш email, придумайте пароль и укажите имя пользователя. Имя пользователя должно быть уникальным — оно будет использоваться для поиска вас другими пользователями.

### Шаг 3: Подтверждение email

После регистрации вам на почту придёт письмо со ссылкой подтверждения. Перейдите по ссылке, чтобы активировать аккаунт.

## Вход в систему

### По email

Введите email и пароль, указанные при регистрации.

### Через OAuth

Balloo поддерживает вход через:
- Яндекс ID
- VK ID
- Mail.ru ID

Нажмите на иконку нужного провайдера и авторизуйтесь.

> **Совет:** Если вы используете устройство впервые, отметьте "Запомнить устройство", чтобы не вводить код 2FA при каждом входе.

## Двухфакторная аутентификация

Рекомендуем включить 2FA для дополнительной защиты:
1. Откройте **Настройки** → **Безопасность**
2. Нажмите "Включить 2FA"
3. Отсканируйте QR-код в вашем TOTP-приложении
4. Сохраните резервные коды в безопасном месте`,category:{name:"Начало работы",icon:"🚀",id:"getting-started"},author:"Администрация",updatedAt:"15 июля 2026",version:3,isOfficial:!0,relatedPages:[{id:"2",title:"Настройка профиля и аватарки"},{id:"4",title:"Настройка 2FA для безопасности"}]};function B(){const a=v(),[r]=p.useState(b),[x,g]=p.useState({}),h=n=>{g(t=>({...t,[n]:!t[n]}))},y=()=>{a(`/knowledge/edit/${r.id}`)},f=n=>{a(`/knowledge/page/${n}`)},c=()=>{a("/knowledge")},m=()=>{const n=r.content.split(`
`),t=[];let i=!1;return n.forEach((u,s)=>{const o=u.trim();if(o.startsWith("## ")){i&&(t.push(e.jsx("ul",{style:{marginBottom:"12px"}},`close-${s}`)),i=!1);const l=`section-${s}`;t.push(e.jsxs("button",{onClick:()=>h(l),style:{fontSize:"17px",fontWeight:700,color:"var(--text-primary)",margin:"24px 0 12px",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:"8px",padding:0},children:[e.jsx("span",{style:{transition:"transform 0.2s",transform:x[l]?"rotate(90deg)":"rotate(0deg)"},children:"▶"}),o.slice(3)]},l))}else o.startsWith("### ")?(i&&(t.push(e.jsx("ul",{style:{marginBottom:"12px"}},`close-${s}`)),i=!1),t.push(e.jsx("h4",{style:{fontSize:"15px",fontWeight:600,color:"var(--text-primary)",margin:"16px 0 8px"},children:o.slice(4)},`h3-${s}`))):o.startsWith("> ")?(i&&(t.push(e.jsx("ul",{style:{marginBottom:"12px"}},`close-${s}`)),i=!1),t.push(e.jsx("blockquote",{style:{borderLeft:"3px solid var(--accent)",padding:"12px 16px",background:"var(--bg-tertiary)",margin:"12px 0",color:"var(--text-secondary)",fontSize:"14px",lineHeight:"1.6"},children:o.slice(2)},`bq-${s}`))):o.startsWith("- ")?(i||(t.push(e.jsx("ul",{style:{marginBottom:"12px",paddingLeft:"24px"}},`open-${s}`)),i=!0),t.push(e.jsx("li",{style:{marginBottom:"4px",fontSize:"14px",lineHeight:"1.6",color:"var(--text-primary)"},children:o.slice(2).replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>")},`li-${s}`))):o===""?i&&(t.push(e.jsx("ul",{style:{marginBottom:"12px"}},`close-${s}`)),i=!1):(i&&(t.push(e.jsx("ul",{style:{marginBottom:"12px"}},`close-${s}`)),i=!1),t.push(e.jsx("p",{style:{marginBottom:"12px",fontSize:"14px",lineHeight:"1.7",color:"var(--text-primary)"},children:o},`p-${s}`)))}),i&&t.push(e.jsx("ul",{style:{marginBottom:"12px"}},"close-final")),t};return e.jsx("div",{style:{display:"flex",height:"100vh",background:"var(--bg-primary)"},children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 24px",background:"var(--bg-secondary)",borderBottom:"1px solid var(--bg-tertiary)",flexShrink:0},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"12px"},children:[e.jsx("button",{onClick:c,style:{background:"none",border:"none",color:"var(--text-secondary)",fontSize:"14px",cursor:"pointer",padding:"4px 8px"},children:"← Назад"}),e.jsx("div",{style:{width:"36px",height:"36px",background:"#3b82f6",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px"},children:"📚"}),e.jsxs("span",{style:{fontWeight:700,fontSize:"16px",color:"var(--text-primary)"},children:[r.category.icon," ",r.category.name]})]}),e.jsx("div",{style:{display:"flex",gap:"8px"},children:e.jsx(j,{variant:"secondary",size:"sm",onClick:y,style:{fontSize:"13px"},children:"✏️ Редактировать"})})]}),e.jsx("div",{style:{flex:1,overflowY:"auto",padding:"24px"},children:e.jsxs("div",{style:{maxWidth:"760px",margin:"0 auto"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px",marginBottom:"16px",fontSize:"13px",color:"var(--text-muted)"},children:[e.jsx("span",{style:{cursor:"pointer",color:"var(--accent)"},onClick:c,children:"База знаний"}),e.jsx("span",{children:"→"}),e.jsxs("span",{children:[r.category.icon," ",r.category.name]}),e.jsx("span",{children:"→"}),e.jsx("span",{style:{color:"var(--text-secondary)"},children:r.title})]}),e.jsx("h1",{style:{fontSize:"24px",fontWeight:800,color:"var(--text-primary)",marginBottom:"8px",lineHeight:"1.3"},children:r.title}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"12px",marginBottom:"24px",flexWrap:"wrap"},children:[e.jsxs(d,{variant:"default",style:{fontSize:"12px"},children:[r.category.icon," ",r.category.name]}),r.isOfficial&&e.jsx(d,{variant:"accent",style:{fontSize:"12px"},children:"Официальная"}),e.jsxs("span",{style:{fontSize:"12px",color:"var(--text-muted)"},children:[r.author," · ",r.updatedAt]}),e.jsxs("span",{style:{fontSize:"12px",color:"var(--text-muted)"},children:["v",r.version]})]}),e.jsx("div",{style:{background:"var(--bg-secondary)",borderRadius:"12px",padding:"24px",lineHeight:"1.8",fontSize:"15px",color:"var(--text-primary)"},children:m()}),e.jsxs("div",{style:{marginTop:"32px"},children:[e.jsx("h3",{style:{fontSize:"16px",fontWeight:700,color:"var(--text-primary)",marginBottom:"12px"},children:"Связанные страницы"}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"8px"},children:r.relatedPages.map(n=>e.jsxs("div",{onClick:()=>f(n.id),style:{background:"var(--bg-secondary)",borderRadius:"10px",padding:"12px 16px",cursor:"pointer",transition:"background 0.15s",fontSize:"14px",color:"var(--accent)"},onMouseEnter:t=>t.currentTarget.style.background="var(--bg-tertiary)",onMouseLeave:t=>t.currentTarget.style.background="var(--bg-secondary)",children:["→ ",n.title]},n.id))})]})]})})]})})}export{B as KnowledgePageScreen};
