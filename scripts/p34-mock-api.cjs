// Мок-API для скриншот-сверки P34 (временный, только для dev-сверки)
// Отвечает на эндпоинты, которые нужны ChatViewScreen/ChatList/AuthProvider.

const http = require('http');
const { URL } = require('url');

const PORT = 3199;

const me = { id: 'user1', username: 'me', displayName: 'Я Пользователь', email: 'me@balloo.su' };

const chats = [
  {
    id: 'chat1', type: 'direct', name: 'Мария Андреева',
    createdAt: 1784148000, updatedAt: 1784148600,
    joinedAt: 1784148000, pinned: true, muted: false, unreadCount: 3,
    lastMessage: { id: 'lm1', chatId: 'chat1', senderId: 'user2', type: 'text', content: 'Да, посмотрела. Отличная работа!', createdAt: 1784148600 },
  },
  {
    id: 'chat2', type: 'group', name: 'Команда разработки',
    createdAt: 1784147700, updatedAt: 1784148000,
    joinedAt: 1784147700, pinned: false, muted: false, unreadCount: 0,
    lastMessage: {
      id: 'lm2', chatId: 'chat2', senderId: 'user3', type: 'text',
      content: 'Отправил макеты в Figma', createdAt: 1784148000,
      sender: { id: 'user3', username: 'alexey', displayName: 'Алексей' },
    },
  },
  {
    id: 'chat3', type: 'channel', name: 'Российская Газета',
    createdAt: 1784146200, updatedAt: 1784146200,
    joinedAt: 1784146200, pinned: false, muted: true, unreadCount: 120,
    lastMessage: { id: 'lm3', chatId: 'chat3', senderId: 'user4', type: 'text', content: '📰 Главные новости дня', createdAt: 1784146200 },
  },
];

const T = 1784148600000; // ms — как в тестах

const messages = [
  {
    id: 'msg1', chatId: 'chat1', senderId: 'user2', type: 'text',
    content: 'Да, посмотрела. <strong>Отличная работа!</strong> Особенно понравился <em>дизайн аватарок</em> — восьмигранники смотрятся очень <code>fresh</code>',
    editCount: 0, deleted: false, status: 'sent', createdAt: T - 720000, updatedAt: T - 720000,
    forwarded: true,
    sender: { id: 'user2', username: 'maria', displayName: 'Мария Андреева' },
    replyTo: { id: 'msg0', content: 'Привет, посмотрите новые макеты', sender: { username: 'Алексей Козлов' } },
    reactions: [
      { emoji: '👍', userId: 'user1' }, { emoji: '👍', userId: 'user3' },
      { emoji: '❤', userId: 'user4' },
      { emoji: '🔥', userId: 'user5' }, { emoji: '🔥', userId: 'user6' }, { emoji: '🔥', userId: 'user7' },
    ],
  },
  {
    id: 'msg2', chatId: 'chat1', senderId: 'user1', type: 'text',
    content: 'Спасибо! Завтра отправлю финальную версию. ~~Старый вариант~~ — новый вариант почти готов.',
    editCount: 1, deleted: false, status: 'read', createdAt: T - 420000, updatedAt: T - 360000,
    sender: { id: 'user1', username: 'me', displayName: 'Я Пользователь' },
    editHistory: { old: 'Старый вариант почти готов', new: 'Старый вариант — новый вариант почти готов' },
  },
  {
    id: 'msg3', chatId: 'chat1', senderId: 'user2', type: 'poll',
    content: JSON.stringify({
      question: 'Какой цвет для акцента?',
      options: [
        { text: 'Зелёный', votes: 3 },
        { text: 'Мятный', votes: 7 },
        { text: 'Бирюзовый', votes: 2 },
      ],
      votes: 12, anonymous: true,
    }),
    editCount: 0, deleted: false, status: 'sent', createdAt: T - 240000, updatedAt: T - 240000,
    sender: { id: 'user2', username: 'maria', displayName: 'Мария Андреева' },
  },
  {
    id: 'msg4', chatId: 'chat1', senderId: 'user1', type: 'text',
    content: 'Автоматический ответ: Я сейчас занят, отвечу позже.',
    editCount: 0, deleted: false, status: 'delivered', createdAt: T - 120000, updatedAt: T - 120000,
    ai: true, autoReply: true,
    sender: { id: 'user1', username: 'me', displayName: 'Я Пользователь' },
  },
  {
    id: 'msg5', chatId: 'chat1', senderId: 'user2', type: 'voice',
    content: '', editCount: 0, deleted: false, status: 'sent', createdAt: T - 60000, updatedAt: T - 60000,
    sender: { id: 'user2', username: 'maria', displayName: 'Мария Андреева' },
    reactions: [{ emoji: '👍', userId: 'user1' }],
  },
];

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;
  res.setHeader('Content-Type', 'application/json');
  // Origin-эхо: '*' несовместим с credentials:'include' у клиента
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.writeHead(204);
    res.end();
    return;
  }

  if (path === '/api/users/me') {
    res.writeHead(200); res.end(JSON.stringify(me)); return;
  }
  if (path === '/api/chats') {
    res.writeHead(200); res.end(JSON.stringify(chats)); return;
  }
  const mChat = path.match(/^\/api\/chats\/([^/]+)$/);
  if (mChat) {
    const chat = chats.find((c) => c.id === mChat[1]);
    res.writeHead(200); res.end(JSON.stringify(chat || chats[0])); return;
  }
  const mMsgs = path.match(/^\/api\/chats\/([^/]+)\/messages$/);
  if (mMsgs) {
    res.writeHead(200); res.end(JSON.stringify(messages)); return;
  }
  if (path === '/api/auth/ws-token') {
    res.writeHead(401); res.end(JSON.stringify({ message: 'no auth (mock)' })); return;
  }
  res.writeHead(404); res.end(JSON.stringify({ message: 'not found (mock)' }));
});

server.listen(PORT, () => console.log(`[mock-api] listening on :${PORT}`));
