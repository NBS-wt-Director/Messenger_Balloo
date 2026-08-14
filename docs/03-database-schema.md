# AI-Agent: Database Schema Specification

> Этот документ — прямая спецификация для генерации Prisma-схемы и миграций.

## Технологии
- **ORM:** Prisma
- **Миграции:** Prisma Migrate
- **БД:** PostgreSQL 16 (собственный, не Supabase)
- **Формат дат:** Unix Timestamp (seconds) — `BIGINT`

---

## Схема: Users

```prisma
model User {
  id              String   @id @default(cuid())
  email           String   @unique
  emailVerified   DateTime?
  name            String
  bio             String?
  statusText      String?  // до 255 символов
  statusPreset    String?  // "На работе", "Свободен" и т.д.
  avatarUrl       String?
  birthDate       DateTime?
  registeredAt    BigInt   // Unix timestamp
  lastSeen        BigInt?
  isOnline        Boolean  @default(false)
  showOnlineTo    String   @default("contacts") // "contacts" | "nobody"
  language        String   @default("ru")
  theme           String   @default("dark") // "dark" | "light" | "russian"
  yandexDiskToken String?  // OAuth токен Я.Диска
  yandexDiskLinked Boolean @default(false)
  role            String   @default("user") // "super_admin" | "mod" | "developer" | "support" | "user"
  isDeleted       Boolean  @default(false)
  deletedAt       BigInt?  // анонимизация через 90 дней
  createdAt       BigInt   @default(0)
  updatedAt       BigInt   @default(0)

  // Relations
  accounts        Account[]
  sessions        Session[]
  chats           ChatMember[]
  messages        Message[]
  groups          GroupMember[]
  groupRoles      GroupRole[]
  contacts        Contact[]      @relation("user_contacts")
  blockedUsers    BlockedUser[]  @relation("blocker")
  blockedBy       BlockedUser[]  @relation("blocked")
  devices         Device[]
  pairTokens      PairToken[]
  accountLinks    AccountDeviceLink[] // мультиаккаунт: связи с устройствами
  reports         Report[]       @relation("reporter")
  reportedBy      Report[]       @relation("reported")
  banAppeals      BanAppeal[]
  bans            Ban[]
  drafts          Draft[]
  notifications   Notification[]
  storyViews      StoryView[]
  calls           CallParticipant[]
}
```

## Схема: Accounts (OAuth)

```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  provider          String  // "email" | "yandex" | "mailru" | "rambler" | "gov" (v2)
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        BigInt?
  token_type        String?
  scope             String?
  user              User    @relation(fields: [userId], references: [id])
}
```

## Схема: Sessions & Devices

```prisma
model Session {
  id           String   @id @default(cuid())
  userId       String
  deviceId     String   // связь с устройством
  sessionToken String   @unique
  accessToken  String?  // JWT access token (короткий TTL)
  refreshToken String?  // JWT refresh token (длинный TTL)
  ipAddress    String?  // IP-адрес последнего подключения
  userAgent    String?  // User-Agent / платформа
  expires      BigInt   // Unix timestamp истечения
  isActive     Boolean  @default(true)
  createdAt    BigInt   @default(0)
  updatedAt    BigInt   @default(0)
  user         User     @relation(fields: [userId], references: [id])
  device       Device   @relation(fields: [deviceId], references: [id])
}

model Device {
  id           String  @id @default(cuid())
  userId       String  // владелец устройства (первый аккаунт)
  deviceName   String  // пользовательское название (можно переименовать)
  deviceType   String  // "web" | "desktop" | "ios" | "android"
  platform     String  // "windows" | "macos" | "linux" | "ios" | "android" | "web"
  appVersion   String? // версия приложения (e.g. "v1.0.0-beta")
  nodes        String[] // список узлов: ["balloo.su", "desktop", "mobile"]
  ipAddress    String?  // последний IP
  location     String?  // город/регион по IP
  lastActive   BigInt   // Unix timestamp
  pushToken    String?  // Expo push token (для мобильных)
  autoLaunch   Boolean  @default(false) // запуск при старте ОС (desktop)
  trayEnabled  Boolean  @default(true)  // tray icon включён (desktop)
  createdAt    BigInt  @default(0)
  updatedAt    BigInt  @default(0)
  user         User    @relation(fields: [userId], references: [id])
  sessions     Session[]
  accountLinks AccountDeviceLink[] // мультиаккаунт: связь устройства с аккаунтами
}

model PairToken {
  id           String   @id @default(cuid())
  token        String   @unique  // одноразовый токен привязки
  userId       String   // пользователь, инициировавший привязку
  deviceId     String?  // устройство, на котором сгенерирован токен
  status       String   @default("pending") // "pending" | "confirmed" | "expired"
  expiresAt    BigInt   // Unix timestamp (60 сек от создания)
  createdAt    BigInt   @default(0)
  confirmedAt  BigInt?
  confirmedDeviceId String? // устройство, которое подтвердило привязку
  user         User     @relation(fields: [userId], references: [id])
}

// Мультиаккаунт: связь аккаунта с устройством (одно устройство — много аккаунтов)
model AccountDeviceLink {
  id           String  @id @default(cuid())
  userId       String  // аккаунт (User)
  deviceId     String  // устройство
  isActive     Boolean @default(false) // активный аккаунт на устройстве
  notificationsEnabled Boolean @default(true) // push для этого аккаунта
  sessionToken String? // JWT сессия этого аккаунта на устройстве
  addedAt      BigInt  @default(0)
  lastActive   BigInt  @default(0)
  user         User    @relation(fields: [userId], references: [id])
  device       Device  @relation(fields: [deviceId], references: [id])

  @@unique([userId, deviceId]) // один аккаунт на одном устройстве — одна запись
}
```

## Схема: Chats & Messages

```prisma
model Chat {
  id          String   @id @default(cuid())
  type        String   // "direct" | "group"
  groupId     String?  // связь с группой, если type=group
  createdAt   BigInt   @default(0)
  updatedAt   BigInt   @default(0)

  members     ChatMember[]
  messages    Message[]
  pins        PinnedMessage[]
  drafts      Draft[]
  calls       Call[]
}

model ChatMember {
  id        String  @id @default(cuid())
  chatId    String
  userId    String
  joinedAt  BigInt  @default(0)
  mutedUntil BigInt?
  isArchived Boolean @default(false)
  chat      Chat    @relation(fields: [chatId], references: [id])
  user      User    @relation(fields: [userId], references: [id])

  @@unique([chatId, userId])
}

model Message {
  id            String   @id @default(cuid())
  chatId        String
  senderId      String
  text          String?
  replyToId     String?  // ответ на сообщение
  forwardedFrom String?  // ID оригинального автора
  forwardedAt   BigInt?  // дата оригинала
  isEdited      Boolean  @default(false)
  isDeleted     Boolean  @default(false) // soft delete — в базе, не выводится
  isHidden      Boolean  @default(false) // скрыто админом группы
  isAutoReply   Boolean  @default(false)
  isAd          Boolean  @default(false)
  isAIGenerated Boolean  @default(false)
  createdAt     BigInt   @default(0)
  editedAt      BigInt?
  readAt        BigInt?  // когда прочитано

  chat          Chat     @relation(fields: [chatId], references: [id])
  sender        User     @relation(fields: [senderId], references: [id])
  replyTo       Message? @relation("message_replies", fields: [replyToId], references: [id])
  replies       Message[] @relation("message_replies")
  attachments   Attachment[]
  reactions     Reaction[]
  editHistory   MessageEdit[]
  reads         MessageRead[]
}

model MessageEdit {
  id          String  @id @default(cuid())
  messageId   String
  oldText     String
  newText     String
  editedAt    BigInt  @default(0)
  message     Message @relation(fields: [messageId], references: [id])
}

model MessageRead {
  id          String  @id @default(cuid())
  messageId   String
  userId      String
  readAt      BigInt  @default(0)
  message     Message @relation(fields: [messageId], references: [id])
}

model Attachment {
  id          String  @id @default(cuid())
  messageId   String
  type        String  // "photo" | "video" | "audio" | "voice" | "document" | "file" | "geo" | "contact"
  url         String  // MinIO или Yandex Disk
  fileName    String?
  fileSize    Int?    // в байтах
  mimeType    String?
  thumbnailUrl String?
  width       Int?
  height      Int?
  duration    Int?    // для аудио/видео (секунды)
  latitude    Float?  // для гео
  longitude   Float?  // для гео
  contactName String? // для контакта
  contactPhone String?
  isFromYandexDisk Boolean @default(false)
  message     Message @relation(fields: [messageId], references: [id])
}

model Reaction {
  id          String  @id @default(cuid())
  messageId   String
  userId      String
  emoji       String
  createdAt   BigInt @default(0)
  message     Message @relation(fields: [messageId], references: [id])

  @@unique([messageId, userId, emoji])
}

model PinnedMessage {
  id          String  @id @default(cuid())
  chatId      String
  messageId   String
  pinnedBy    String
  pinnedAt    BigInt  @default(0)
  chat        Chat    @relation(fields: [chatId], references: [id])
}
```

## Схема: Groups

```prisma
model Group {
  id            String   @id @default(cuid())
  name          String
  description   String?
  avatarUrl     String?
  type          String   // "private" | "public" | "topic" | "media" | "corporate"
  rulesText     String?
  rulesRequired Boolean  @default(false) // обязательное ознакомление
  historyVisible String  @default("all") // "all" | "limited" | "from_join"
  historyLimit  Int?     // если limited
  memberLimit   Int      @default(1000)
  inviteExpiry  BigInt?  // срок действия ссылки (настраивается автором)
  isVerified    Boolean  @default(false) // для СМИ — подтверждение документами
  createdAt     BigInt   @default(0)
  updatedAt     BigInt   @default(0)

  chat          Chat?
  members       GroupMember[]
  roles         GroupRole[]
  polls         Poll[]
}

model GroupMember {
  id        String  @id @default(cuid())
  groupId   String
  userId    String
  joinedAt  BigInt  @default(0)
  group     Group   @relation(fields: [groupId], references: [id])
  user      User    @relation(fields: [userId], references: [id])

  @@unique([groupId, userId])
}

model GroupRole {
  id          String  @id @default(cuid())
  groupId     String
  userId      String
  role        String  // "super_admin" | "mod" | "author" | "user"
  canDeleteMessages Boolean @default(false)
  canPinMessages    Boolean @default(false)
  canInviteUsers    Boolean @default(false)
  canEditGroupInfo  Boolean @default(false)
  group       Group   @relation(fields: [groupId], references: [id])
  user        User    @relation(fields: [userId], references: [id])

  @@unique([groupId, userId])
}
```

## Схема: Polls / Quizzes / Lists / Personali

```prisma
model Poll {
  id          String  @id @default(cuid())
  groupId     String?
  chatId      String?
  creatorId   String
  type        String  // "poll" | "quiz" | "list_active" | "list_passive" | "personali"
  question    String
  isAnonymous Boolean @default(false)
  multipleChoice Boolean @default(false)
  correctOption Int?  // для quiz
  createdAt   BigInt @default(0)
  group       Group?  @relation(fields: [groupId], references: [id])
  options     PollOption[]
  votes       PollVote[]
}

model PollOption {
  id          String  @id @default(cuid())
  pollId      String
  text        String
  position    Int
  poll        Poll    @relation(fields: [pollId], references: [id])
  votes       PollVote[]
}

model PollVote {
  id          String  @id @default(cuid())
  pollId      String
  optionId    String
  userId      String
  votedAt     BigInt @default(0)
  poll        Poll        @relation(fields: [pollId], references: [id])
  option      PollOption  @relation(fields: [optionId], references: [id])
}
```

## Схема: Contacts & Blocklist

```prisma
model Contact {
  id          String  @id @default(cuid())
  userId      String  // владелец
  contactId   String  // кого добавили
  addedAt     BigInt @default(0)
  user        User    @relation("user_contacts", fields: [userId], references: [id])

  @@unique([userId, contactId])
}

model BlockedUser {
  id          String  @id @default(cuid())
  blockerId   String
  blockedId   String
  blockedAt   BigInt @default(0)
  blocker     User    @relation("blocker", fields: [blockerId], references: [id])
  blocked     User    @relation("blocked", fields: [blockedId], references: [id])

  @@unique([blockerId, blockedId])
}
```

## Схема: Reports & Bans

```prisma
model Report {
  id          String  @id @default(cuid())
  reporterId  String
  reportedId  String
  chatId      String?
  messageId   String?
  reason      String  // "spam" | "insults" | "adult_content" | "misinformation" | "privacy" | "illegal" | "other"
  comment     String? // опциональный комментарий (ранее description)
  createdAt   BigInt @default(0)
  status      String  @default("pending") // "pending" | "reviewing" | "resolved" | "rejected"
  reporter    User    @relation("reporter", fields: [reporterId], references: [id])
  reported    User    @relation("reported", fields: [reportedId], references: [id])
}

model Ban {
  id              String  @id @default(cuid())
  userId          String
  reason          String  // причина бана
  type            String  // "temporary" | "permanent"
  reportIds       String[] // жалобы, на основе которых выдан бан (минимум 5)
  confirmedBy     String[] // ID администраторов, подтвердивших бан (минимум 4)
  createdAt       BigInt @default(0)
  expiresAt       BigInt? // null = перманентный
  appealDeadline  BigInt  // deadline для обжалования (createdAt + 72 часа)
  status          String  @default("active") // "active" | "lifted" | "expired"
  appeals         BanAppeal[]
  user            User    @relation(fields: [userId], references: [id])
}

model BanAppeal {
  id              String  @id @default(cuid())
  banId           String
  userId          String
  text            String  // текст обжалования (max 2000 символов)
  createdAt       BigInt @default(0)
  status          String  @default("pending") // "pending" | "approved" | "rejected"
  confirmations   Int     @default(0) // подтверждения администраторов (0/4)
  decisionAt      BigInt? // время принятия решения
  ban             Ban     @relation(fields: [banId], references: [id])
  user            User    @relation(fields: [userId], references: [id])
}
```

## Схема: Calls

```prisma
model Call {
  id          String  @id @default(cuid())
  chatId      String
  initiatorId String
  type        String  // "audio" | "video"
  isGroup     Boolean @default(false)
  startedAt   BigInt?
  endedAt     BigInt?
  status      String  @default("ringing") // "ringing" | "active" | "ended" | "missed"
  chat        Chat    @relation(fields: [chatId], references: [id])
  participants CallParticipant[]
}

model CallParticipant {
  id          String  @id @default(cuid())
  callId      String
  userId      String
  joinedAt    BigInt?
  leftAt      BigInt?
  isMuted     Boolean @default(false)
  isVideoOn   Boolean @default(false)
  isScreenSharing Boolean @default(false)
  call        Call    @relation(fields: [callId], references: [id])
  user        User    @relation(fields: [userId], references: [id])
}
```

## Схема: Drafts & Notifications

```prisma
model Draft {
  id          String  @id @default(cuid())
  chatId      String
  userId      String
  text        String
  updatedAt   BigInt @default(0)
  chat        Chat    @relation(fields: [chatId], references: [id])
  user        User    @relation(fields: [userId], references: [id])

  @@unique([chatId, userId])
}

model Notification {
  id          String  @id @default(cuid())
  userId      String
  type        String  // "message" | "call" | "mention" | "reaction" | "system"
  title       String
  body        String  // превью до 20 символов
  data        Json?
  isRead      Boolean @default(false)
  createdAt   BigInt @default(0)
  user        User    @relation(fields: [userId], references: [id])
}
```

## Схема: Stories

```prisma
model Story {
  id            String  @id @default(cuid())
  userId        String
  mediaUrl      String  // Yandex Disk
  type          String  // "photo" | "video"
  duration      Int?    // для видео
  replyToChatId String? // ID чата для ответа на сторис (пересылка реакции в чат)
  createdAt     BigInt @default(0)
  expiresAt     BigInt  // 24 часа
  views         StoryView[]
}

model StoryView {
  id          String  @id @default(cuid())
  storyId     String
  userId      String
  viewedAt    BigInt @default(0)
  story       Story   @relation(fields: [storyId], references: [id])
  user        User    @relation(fields: [userId], references: [id])

  @@unique([storyId, userId])
}
```

## Схема: Invites

```prisma
model Invite {
  id            String  @id @default(cuid())
  inviterId     String
  inviteeEmail  String?
  inviteeId     String?
  token         String  @unique
  groupIds      String[] // приглашение в конкретные группы
  durationType  String  @default("permanent") // "permanent" | "timed" | "once"
  durationDays  Int?    // количество дней (только при durationType = "timed")
  createdAt     BigInt @default(0)
  expiresAt     BigInt? // вычисляется: createdAt + durationDays (при "timed"), null при "permanent"
  acceptedAt    BigInt?
  status        String  @default("pending") // "pending" | "accepted" | "expired" | "used"
}
```

## Схема: Onboarding & Text Content

```prisma
// Шаг онбординга — управляется через админку (раздел «Тексты»)
model OnboardingStep {
  id              String   @id @default(cuid())
  order           Int      // порядок отображения (drag-to-reorder)
  illustrationUrl String?  // PNG/SVG в MinIO
  isActive        Boolean  @default(true)
  createdAt       BigInt   @default(0)
  updatedAt       BigInt   @default(0)
  translations    OnboardingStepTranslation[]
}

// Локализация шага онбординга (6 языков)
model OnboardingStepTranslation {
  id          String  @id @default(cuid())
  stepId      String
  lang        String  // "ru" | "en" | "zh" | "fr" | "be" | "hi"
  title       String
  text        String
  step        OnboardingStep @relation(fields: [stepId], references: [id])

  @@unique([stepId, lang])
}

// Информационная страница (Правила, Политика неразглашения, О компании, О Balloo)
// Правила и политика неразглашения — контент из md-файлов корня монорепо (RULES.md, PRIVACY.md)
// Остальные страницы — контент из БД (управляется через админку)
model TextPage {
  id          String   @id @default(cuid())
  slug        String   @unique // "rules" | "privacy" | "about-company" | "about-balloo"
  source      String   @default("db") // "db" | "mdfile" — источник контента
  mdFile      String?  // путь к md-файлу в корне монорепо (при source = "mdfile")
  createdAt   BigInt   @default(0)
  updatedAt   BigInt   @default(0)
  translations TextPageTranslation[]
}

// Локализация информационной страницы
model TextPageTranslation {
  id          String  @id @default(cuid())
  pageId      String
  lang        String  // "ru" | "en" | "zh" | "fr" | "be" | "hi"
  title       String
  content     String  // markdown
  page        TextPage @relation(fields: [pageId], references: [id])

  @@unique([pageId, lang])
}
```

---

## Схема: Blog (корпоративный блог — узел у_11)

```prisma
// Канал блога: корпоративный или личный
// Корпоративный — создаётся админом, авторы/модераторы назначаются
// Личный — выдаётся админом сотруднику, он автор+модератор, компания не может удалять посты
model BlogChannel {
  id            String   @id @default(cuid())
  slug          String   @unique // URL-слаг
  type          String   // "corporate" | "personal"
  ownerId       String?  // владелец (для personal — сотрудник; для corporate — null)
  avatarUrl     String?
  bannerUrl     String?
  accentColor   String   @default("#a855f7") // акцентный цвет (для personal — настраивается владельцем)
  isActive      Boolean  @default(true)
  isArchived    Boolean  @default(false)
  createdAt     BigInt   @default(0)
  updatedAt     BigInt   @default(0)

  posts         BlogPost[]
  members       BlogChannelMember[]
  translations  BlogChannelTranslation[]
}

// Локализация канала (6 языков)
model BlogChannelTranslation {
  id          String  @id @default(cuid())
  channelId   String
  lang        String  // "ru" | "en" | "zh" | "fr" | "be" | "hi"
  name        String
  description String?
  channel     BlogChannel @relation(fields: [channelId], references: [id])

  @@unique([channelId, lang])
}

// Автор или модератор канала
model BlogChannelMember {
  id          String  @id @default(cuid())
  channelId   String
  userId      String
  role        String  // "author" | "moderator"
  assignedAt  BigInt  @default(0)
  channel     BlogChannel @relation(fields: [channelId], references: [id])

  @@unique([channelId, userId, role])
}

// Статья блога
model BlogPost {
  id            String   @id @default(cuid())
  channelId     String
  authorId      String   // сотрудник-автор (→ User)
  categoryId    String?  // → BlogCategory
  slug          String   @unique
  coverImageUrl String?
  status        String   @default("draft") // "draft" | "pending_review" | "published" | "rejected" | "changes_requested" | "archived"
  isPinned      Boolean  @default(false)
  isFeatured    Boolean  @default(false)
  readingTime   Int?     // минут чтения (расчётное)
  viewsCount    Int      @default(0)  // денормализованный счётчик
  reactionsCount Int     @default(0)
  commentsCount Int      @default(0)
  publishedAt   BigInt?  // null = не опубликован
  createdAt     BigInt   @default(0)
  updatedAt     BigInt   @default(0)

  channel       BlogChannel     @relation(fields: [channelId], references: [id])
  category      BlogCategory?   @relation(fields: [categoryId], references: [id])
  tags          BlogPostTag[]
  translations  BlogPostTranslation[]
  comments      BlogComment[]
  media         BlogMedia[]
  reactions     BlogReaction[]
  views         BlogPostView[]
  reviews       BlogReview[]
}

// Локализация статьи (6 языков)
model BlogPostTranslation {
  id          String  @id @default(cuid())
  postId      String
  lang        String  // "ru" | "en" | "zh" | "fr" | "be" | "hi"
  title       String
  excerpt     String? // анонс (до 300 символов)
  content     String  // markdown
  post        BlogPost @relation(fields: [postId], references: [id])

  @@unique([postId, lang])
}

// Категория блога
model BlogCategory {
  id          String   @id @default(cuid())
  slug        String   @unique
  order       Int      // порядок (drag-to-reorder)
  isActive    Boolean  @default(true)
  createdAt   BigInt   @default(0)
  updatedAt   BigInt   @default(0)

  posts       BlogPost[]
  translations BlogCategoryTranslation[]
}

// Локализация категории (6 языков)
model BlogCategoryTranslation {
  id          String  @id @default(cuid())
  categoryId  String
  lang        String
  name        String
  description String?
  category    BlogCategory @relation(fields: [categoryId], references: [id])

  @@unique([categoryId, lang])
}

// Тег статьи
model BlogTag {
  id          String  @id @default(cuid())
  name        String  @unique
  slug        String  @unique
  createdAt   BigInt  @default(0)

  posts       BlogPostTag[]
}

// Связь пост↔тег (m2m)
model BlogPostTag {
  id          String  @id @default(cuid())
  postId      String
  tagId       String
  post        BlogPost @relation(fields: [postId], references: [id])
  tag         BlogTag  @relation(fields: [tagId], references: [id])

  @@unique([postId, tagId])
}

// Комментарий к статье (дерево, вложенность)
model BlogComment {
  id          String   @id @default(cuid())
  postId      String
  authorId    String   // → User (авторизованный)
  parentId    String?  // → BlogComment (вложенность)
  text        String   // markdown
  isDeleted   Boolean  @default(false) // soft-delete
  isHidden    Boolean  @default(false) // скрыт модератором/админом
  createdAt   BigInt   @default(0)
  updatedAt   BigInt   @default(0)

  post        BlogPost     @relation(fields: [postId], references: [id])
  parent      BlogComment? @relation("blog_comment_replies", fields: [parentId], references: [id])
  replies     BlogComment[] @relation("blog_comment_replies")
}

// Медиа поста (изображения/видео в теле, помимо обложки)
model BlogMedia {
  id          String  @id @default(cuid())
  postId      String
  type        String  // "photo" | "video" | "gif"
  url         String  // MinIO / Yandex Disk
  altText     String?
  width       Int?
  height      Int?
  order       Int     // порядок в посте
  post        BlogPost @relation(fields: [postId], references: [id])
}

// Реакция на статью (эмодзи, до 5 на пользователя)
model BlogReaction {
  id          String  @id @default(cuid())
  postId      String
  userId      String
  emoji       String
  createdAt   BigInt  @default(0)
  post        BlogPost @relation(fields: [postId], references: [id])

  @@unique([postId, userId, emoji])
}

// Просмотр статьи (аналитика, анти-фрод)
model BlogPostView {
  id          String  @id @default(cuid())
  postId      String
  userId      String? // null = гость
  ipAddress   String?
  userAgent   String?
  viewedAt    BigInt  @default(0)
  post        BlogPost @relation(fields: [postId], references: [id])

  @@unique([postId, userId])
}

// Очередь ревью (workflow: draft → pending_review → published/rejected/changes_requested)
model BlogReview {
  id          String  @id @default(cuid())
  postId      String
  reviewerId  String  // → User (кто ревьюит)
  status      String  // "approved" | "rejected" | "changes_requested"
  comment     String? // комментарий автору
  reviewedAt  BigInt  @default(0)
  post        BlogPost @relation(fields: [postId], references: [id])
}
```

---

## Схема: Bots (узел у_01 — Bot API)

```prisma
// Бот пользователя — выступает как авторизованный субъект (bot token)
model Bot {
  id          String   @id @default(cuid())
  ownerId     String   // → User (владелец бота)
  name        String
  username    String   @unique // уникальный @username бота
  avatarUrl   String?
  description String?
  isVerified  Boolean  @default(false)
  createdAt   BigInt   @default(0)
  updatedAt   BigInt   @default(0)

  tokens      BotToken[]
}

// Токен бота — хранится хэш, не сам токен. Несколько токенов на бота (окружения)
model BotToken {
  id          String   @id @default(cuid())
  botId       String
  tokenHash   String   @unique // хэш токена (не plaintext)
  name        String   // название токена (e.g. "production", "dev")
  scopes      String[] // права: ["messages:send","chats:read", ...]
  lastUsedAt  BigInt?
  revokedAt   BigInt?  // null = активен
  createdAt   BigInt   @default(0)
  bot         Bot      @relation(fields: [botId], references: [id])
}
```

## Схема: Donate (узлы у_01/04/05/06/08/09 — донат)

```prisma
// Запись пожертвования (разового или подписочного платежа)
model Donation {
  id                String   @id @default(cuid())
  userId            String?  // null = анонимный донор
  amount            Int      // в минорных единицах (копейки)
  currency          String   @default("RUB")
  method            String   // "card" | "sbp" | "crypto"
  source            String   // "balloo" | "features" | "history" | "download" | "mobile" | "desktop"
  type              String   // "one_time" | "subscription"
  status            String   // "pending" | "completed" | "failed" | "refunded"
  externalPaymentId String?  // ID платежа в платёжной системе
  subscriptionId    String?  // связь с подпиской (при type=subscription)
  createdAt         BigInt   @default(0)
}

// Цель сбора (управляется из админки: /admin/donations/goal)
model DonateGoal {
  id              String   @id @default(cuid())
  title           String
  description     String?
  targetAmount    Int      // минорные единицы
  collectedAmount Int      @default(0)
  currency        String   @default("RUB")
  startDate       BigInt
  endDate         BigInt?
  isActive        Boolean  @default(true) // одна активная цель
  createdAt       BigInt   @default(0)
  updatedAt       BigInt   @default(0)
}

// Уровни поддержки (кофе/спонсор/VIP) — seed при первом деплое, редактируется админом
model DonateTier {
  id          String   @id @default(cuid())
  name        String
  description String?
  minAmount   Int      // минимальная сумма уровня
  perks       Json     // массив строк-привилегий
  order       Int      // порядок отображения
  isActive    Boolean  @default(true)
}
```

## Схема: Support (узел у_01 — чат с поддержкой)

```prisma
// Тикет поддержки (приоритизация, назначение админа)
model SupportTicket {
  id              String   @id @default(cuid())
  userId          String   // → User (кто обратился)
  subject         String
  status          String   @default("open") // "open" | "in_progress" | "resolved" | "closed"
  priority        String   @default("normal") // "low" | "normal" | "high" | "urgent"
  assignedAdminId String?  // → User (админ поддержки)
  createdAt       BigInt   @default(0)
  updatedAt       BigInt   @default(0)

  messages        SupportMessage[]
}

// Сообщение в чате поддержки (привязано к тикету)
model SupportMessage {
  id          String   @id @default(cuid())
  ticketId    String
  authorId    String   // → User (пользователь или админ)
  text        String
  isInternal  Boolean  @default(false) // внутренняя заметка админа (не видна пользователю)
  readAt      BigInt?
  createdAt   BigInt   @default(0)
  ticket      SupportTicket @relation(fields: [ticketId], references: [id])
}
```

## Схема: Admin & Feature Flags (узел у_02 — админ-панель)

```prisma
// Feature flag — управление функциями платформы
model FeatureFlag {
  id              String   @id @default(cuid())
  key             String   @unique // e.g. "stories_enabled"
  description     String?
  isEnabled       Boolean  @default(false)
  rolloutPercent  Int      @default(0) // 0–100
  targetSegment   Json?    // {"platforms":["ios"],"roles":["user"]}
  updatedAt       BigInt   @default(0)
  updatedBy       String   // → User (админ)
}

// Глобальное объявление/баннер (часть функции Feature Flags)
model Announcement {
  id              String   @id @default(cuid())
  title           String
  body            String
  audience        String   @default("all") // "all" | "employees" | "admins"
  startsAt        BigInt
  endsAt          BigInt?
  isDismissible   Boolean  @default(true)
  createdByAdminId String? // → User (админ, создавший объявление)
  createdAt       BigInt   @default(0)
}

// Журнал действий администраторов (критичные операции: баны, миграции, выдача каналов)
model AuditLog {
  id          String   @id @default(cuid())
  adminId     String   // → User
  action      String   // e.g. "ban.create", "blog.channel.migrate"
  target      String?  // ID объекта
  targetType  String?  // "user" | "channel" | "department"
  before      Json?    // состояние до
  after       Json?    // состояние после
  ip          String?
  createdAt   BigInt   @default(0)
}

// Секрет 2FA администратора (email-код, не TOTP)
model Admin2FASecret {
  id              String   @id @default(cuid())
  adminId         String   @unique // → User
  emailCode       String   // последний отправленный email-код (хэш)
  codeExpires     BigInt   // срок действия кода
  enabledAt       BigInt   @default(0)
}

// Снимок статистики хранилища (MinIO / Yandex Disk) — time-series, без чтения файлов
model FileStorageStat {
  id          String   @id @default(cuid())
  bucket      String   // "minio" | "yandex_disk"
  totalSize   BigInt   // байт
  filesCount  Int
  byType      Json?    // {"photo":123,"video":45,...}
  snapshotAt  BigInt   @default(0)
}
```

## Схема: Departments & Employees (узел у_03 — портал сотрудников)

```prisma
// Отдел компании (дерево через parentId)
model Department {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  parentId    String?  // self-reference (дерево подразделений)
  headId      String?  // → User (руководитель)
  description String?
  createdAt   BigInt   @default(0)
  updatedAt   BigInt   @default(0)

  members     DepartmentMember[]
  vacancies   Vacancy[]
  sprints     Sprint[]
}

// Членство сотрудника в отделе + матрица прав
model DepartmentMember {
  id            String   @id @default(cuid())
  departmentId  String
  userId        String
  role          String   @default("member") // "head" | "member"
  permissions   Json     // матрица прав {"can_manage_tasks":true,...}
  joinedAt      BigInt   @default(0)
  department    Department @relation(fields: [departmentId], references: [id])

  @@unique([departmentId, userId])
}

// Профиль сотрудника (расширение User — не все пользователи сотрудники)
model Employee {
  id              String   @id @default(cuid())
  userId          String   @unique // → User
  position        String
  hiredAt         BigInt
  firedAt         BigInt?
  status          String   @default("active") // "onboarding" | "active" | "fired"
  corporateEmail  String?
  createdAt       BigInt   @default(0)
  updatedAt       BigInt   @default(0)
}
```

## Схема: Meetings (узел у_03 — совещания)

```prisma
// Запланированная встреча (порождает Call при начале)
model Meeting {
  id            String   @id @default(cuid())
  title         String
  organizerId   String   // → User
  departmentId  String?  // → Department
  startsAt      BigInt
  endsAt        BigInt?
  status        String   @default("scheduled") // "scheduled" | "ongoing" | "completed" | "cancelled"
  meetingLink   String?
  callId        String?  // связь с Call при начале
  createdAt     BigInt   @default(0)
  updatedAt     BigInt   @default(0)
}

// Протокол встречи (текстовый документ, отдельно от записи)
model MeetingProtocol {
  id          String   @id @default(cuid())
  meetingId   String   @unique
  content     String   // markdown
  createdBy   String   // → User
  createdAt   BigInt   @default(0)
  updatedAt   BigInt   @default(0)
}
```

## Схема: Tasks & Sprints (узел у_03 — TODO)

```prisma
// Задача (личная при departmentId=null, отдела при заполненном)
model Task {
  id            String   @id @default(cuid())
  title         String
  description   String?
  assigneeId    String?  // → User
  departmentId  String?  // null = личная задача (scope=personal)
  status        String   @default("todo") // "todo" | "in_progress" | "done"
  priority      String   @default("medium")
  sprintId      String?  // → Sprint
  dueDate       BigInt?
  order         Int      @default(0)
  createdAt     BigInt   @default(0)
  updatedAt     BigInt   @default(0)
}

// Спринт отдела
model Sprint {
  id            String   @id @default(cuid())
  departmentId  String
  name          String
  startDate     BigInt
  endDate       BigInt
  goal          String?
  status        String   @default("active") // "active" | "closed"
  createdAt     BigInt   @default(0)
  updatedAt     BigInt   @default(0)

  department    Department @relation(fields: [departmentId], references: [id])
  tasks         Task[]
}
```

## Схема: Knowledge Base (узел у_03 — база знаний)

```prisma
// Статья базы знаний (внутренняя документация, отдельно от BlogPost)
model KnowledgeArticle {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  body        String   // markdown
  categoryId  String?  // → KnowledgeCategory
  authorId    String   // → User
  version     Int      @default(1)
  isPublished Boolean  @default(false)
  createdAt   BigInt   @default(0)
  updatedAt   BigInt   @default(0)
}

// Категория базы знаний (seed при первом деплое)
model KnowledgeCategory {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  parentId  String?  // дерево
  order     Int      @default(0)
}
```

## Схема: Vacancies & Applications (узел у_03 — найм)

```prisma
// Вакансия (публичная, связь с отделом)
model Vacancy {
  id          String   @id @default(cuid())
  title       String
  departmentId String  // → Department
  description String
  requirements String
  salaryMin   Int?
  salaryMax   Int?
  location    String?
  type        String   // "full" | "part" | "remote"
  status      String   @default("open") // "draft" | "open" | "closed"
  publishedAt BigInt?
  createdAt   BigInt   @default(0)
  updatedAt   BigInt   @default(0)

  department    Department @relation(fields: [departmentId], references: [id])
  translations  VacancyTranslation[]
  applications  Application[]
}

// Локализация вакансии (6 языков, SSR для SEO)
model VacancyTranslation {
  id          String   @id @default(cuid())
  vacancyId   String
  lang        String   // "ru" | "en" | "zh" | "fr" | "be" | "hi"
  title       String
  description String
  requirements String
  vacancy     Vacancy  @relation(fields: [vacancyId], references: [id])

  @@unique([vacancyId, lang])
}

// Заявка кандидата (candidate может быть не-пользователем — public submit)
model Application {
  id            String   @id @default(cuid())
  vacancyId     String   // → Vacancy
  candidateName String
  email         String
  phone         String?
  experience    String?
  coverLetter   String?
  resumeUrl     String?
  currentStage  String   @default("screening") // → ApplicationStage.name
  createdAt     BigInt   @default(0)
  updatedAt     BigInt   @default(0)
  vacancy       Vacancy  @relation(fields: [vacancyId], references: [id])
}

// Этап воронки найма (seed-справочник)
model ApplicationStage {
  id          String   @id @default(cuid())
  name        String   @unique // "screening" | "interview" | "offer" | "hired" | "rejected"
  order       Int
  isRejection Boolean  @default(false)
}
```

## Схема: HR (узел у_03 — HR-модуль)

```prisma
// Универсальная HR-заявка (онбординг, рассылки, кадровые процессы)
model HrRequest {
  id          String   @id @default(cuid())
  type        String   // "onboarding" | "mailing" | "firing" | "vacation"
  requesterId String   // → User
  payload     Json     // тип-специфичные данные
  status      String   @default("open") // "open" | "in_progress" | "done"
  assigneeId  String?  // → User (HR-менеджер)
  createdAt   BigInt   @default(0)
  updatedAt   BigInt   @default(0)
}
```

## Схема: Features (узел у_04 — фич-реквесты)

```prisma
// Фич-реквест
model Feature {
  id          String   @id @default(cuid())
  title       String
  description String
  authorId    String?  // null при гостевом предложении
  categoryId  String?  // → FeatureCategory
  status      String   @default("pending") // "pending" | "approved" | "in_progress" | "done" | "rejected"
  votesCount  Int      @default(0)
  createdAt   BigInt   @default(0)
  updatedAt   BigInt   @default(0)

  votes       FeatureVote[]
  comments    FeatureComment[]
  changelog   FeatureChangeLog[]
}

// Категория фич-реквестов (seed)
model FeatureCategory {
  id    String   @id @default(cuid())
  name  String
  slug  String   @unique
  icon  String?
  order Int      @default(0)
}

// Голос за фичу (userId null для гостевого, дедупликация по fingerprint)
model FeatureVote {
  id              String   @id @default(cuid())
  featureId       String
  userId          String?  // null = гость
  voterFingerprint String  // hash(IP + UA) для дедупликации гостевых голосов
  createdAt       BigInt   @default(0)
  feature         Feature  @relation(fields: [featureId], references: [id])

  @@unique([featureId, voterFingerprint])
}

// Комментарий к фиче (дерево)
model FeatureComment {
  id          String   @id @default(cuid())
  featureId   String
  authorId    String?  // null для гостя
  parentId    String?  // дерево
  text        String
  createdAt   BigInt   @default(0)
  feature     Feature  @relation(fields: [featureId], references: [id])
}

// История изменений статуса фичи
model FeatureChangeLog {
  id              String   @id @default(cuid())
  featureId       String
  fromStatus      String
  toStatus        String
  changedByAdminId String  // → User
  comment         String?
  createdAt       BigInt   @default(0)
  feature         Feature  @relation(fields: [featureId], references: [id])
}
```

## Схема: Versions (узел у_05 — история версий)

```prisma
// Версия приложения (released / planned)
model Version {
  id          String   @id @default(cuid())
  version     String   @unique // semver, e.g. "1.2.0"
  codename    String?
  releaseDate BigInt?  // null для planned
  status      String   @default("planned") // "released" | "planned"
  isMajor     Boolean  @default(false)
  createdAt   BigInt   @default(0)
  updatedAt   BigInt   @default(0)

  changes     VersionChange[]
}

// Пункт changelog версии
model VersionChange {
  id          String   @id @default(cuid())
  versionId   String
  category    String   // "feature" | "fix" | "security" | "breaking"
  title       String
  description String?
  order       Int      @default(0)
  version     Version  @relation(fields: [versionId], references: [id])

  translations VersionTranslation[]
}

// Локализация пункта changelog (6 языков, SSR для SEO)
model VersionTranslation {
  id              String   @id @default(cuid())
  versionChangeId String
  lang            String   // "ru" | "en" | "zh" | "fr" | "be" | "hi"
  title           String
  description     String?
  versionChange   VersionChange @relation(fields: [versionChangeId], references: [id])

   @@unique([versionChangeId, lang])
}
```

---

## Схема: Auth tokens, Media requests, Subscriptions, Service Status (новые таблицы v1)

> Добавлено в v1: восстановление пароля, верификация email, пользовательский 2FA (email-код), заявки на СМИ-группу, подписки на каналы блога, статус сервиса. Всего +8 таблиц (81 → 89). Поля `stories.replyToChatId` и `announcements.createdByAdminId` добавлены в соответствующие модели выше.

```prisma
// Токен восстановления пароля (срок жизни ~30 минут)
model PasswordResetToken {
  id        String  @id @default(cuid())
  userId    String
  tokenHash String  @unique // хэш токена (не сам токен)
  expiresAt BigInt  // Unix timestamp
  usedAt    BigInt? // когда сбросил пароль
  createdAt BigInt @default(0)

  @@unique([userId, tokenHash])
}

// Токен подтверждения email (при регистрации / смене email)
model EmailVerificationToken {
  id        String  @id @default(cuid())
  userId    String
  tokenHash String  @unique
  expiresAt BigInt
  usedAt    BigInt?
  createdAt BigInt @default(0)
}

// Секрет 2FA пользователя (email-код, не TOTP)
model User2FASecret {
  id          String   @id @default(cuid())
  userId      String   @unique
  emailCode   String   // последний отправленный email-код (хэш)
  codeExpires BigInt   // срок действия кода
  enabledAt   BigInt   @default(0)
  updatedAt   BigInt   @default(0)
}

// Заявка на получение/подтверждение СМИ-статуса группы
model GroupMediaRequest {
  id              String   @id @default(cuid())
  groupId         String
  submittedById   String   // → User (создатель/админ группы)
  documents       Json     // массив ссылок на документы (MinIO)
  status          String   @default("pending") // "pending" | "approved" | "rejected"
  reviewedByAdminId String? // → User (админ)
  reviewComment   String?
  reviewedAt      BigInt?
  createdAt       BigInt   @default(0)
  updatedAt       BigInt   @default(0)
}

// Подписка пользователя на канал блога (для ленты «Мои подписки»)
model BlogSubscription {
  id        String   @id @default(cuid())
  userId    String
  channelId String
  createdAt BigInt   @default(0)

  @@unique([userId, channelId])
}

// Инцидент сервиса (создаётся/закрывается админом)
model ServiceStatusIncident {
  id              String   @id @default(cuid())
  title           String
  body            String
  severity        String   // "minor" | "major" | "critical"
  affectedNodes   Json     // массив узлов: ["balloo","admin",...]
  startsAt        BigInt
  endsAt          BigInt?
  status          String   @default("investigating") // "investigating" | "identified" | "monitoring" | "resolved"
  createdByAdminId String? // → User
  createdAt       BigInt   @default(0)
  updatedAt       BigInt   @default(0)
}

// Time-series снимок статуса узла (health-check воркер, cron)
model ServiceStatusSnapshot {
  id        String   @id @default(cuid())
  nodeId    String   // "balloo" | "admin" | "command" | "features" | "history" | "download" | "docs" | "blog"
  status    String   // "up" | "degraded" | "down"
  latencyMs Int?
  checkedAt BigInt
}
```

---

## Новые таблицы (2026-07-22, тикет №6 реестра)

### ChannelSettings — настройки каналов (channel-create.html)

```prisma
model ChannelSettings {
  id               String   @id @default(cuid())
  groupId          String   @unique // → Group (тип media)
  writeAccess      String   @default("admin_only") // "admin_only" | "admin_mods" | "all_subscribers"
  editDuration     String   @default("24h") // "24h" | "forever" | "none"
  allowForwarding  Boolean  @default(true)
  hideSubscriberCount Boolean @default(false)
  requireApproval  Boolean  @default(false)
  botCommands      Json?    // [{botId, command, enabled}]
  createdAt        BigInt   @default(0)
  updatedAt        BigInt   @default(0)

  // Relations
  group            Group    @relation(fields: [groupId], references: [id])
}
```

### Candidate — кандидаты (candidate-interview.html, application-form.html)

```prisma
model Candidate {
  id              String   @id @default(cuid())
  userId          String?  // → User (если зарегистрирован)
  name            String
  email           String
  phone           String?
  city            String?  // город + часовой пояс
  resumeUrl       String?
  githubUrl       String?
  portfolioUrl    String?
  experienceYears Int
  expectedSalary  Int?
  status          String   @default("new") // "new" | "in_progress" | "hired" | "rejected" | "reserve"
  createdAt       BigInt   @default(0)
  updatedAt       BigInt   @default(0)

  // Relations
  user            User?         @relation(fields: [userId], references: [id])
  applications    Application[]
  interviews      Interview[]
  matchScores     CandidateMatchScore[]
}
```

### Interview — запланированные интервью

```prisma
model Interview {
  id             String   @id @default(cuid())
  applicationId  String   // → Application
  candidateId    String   // → Candidate
  interviewerId  String   // → Employee (интервьюер)
  type           String   // "screening" | "technical" | "final" | "culture"
  status         String   @default("scheduled") // "scheduled" | "in_progress" | "completed" | "cancelled"
  scheduledAt    BigInt
  duration       Int      @default(60) // минуты
  videoLink      String?
  timerSeconds   Int      @default(0) // обратный таймер
  result         String?
  createdAt      BigInt   @default(0)
  updatedAt      BigInt   @default(0)

  // Relations
  application    Application          @relation(fields: [applicationId], references: [id])
  candidate      Candidate            @relation(fields: [candidateId], references: [id])
  interviewer    Employee             @relation(fields: [interviewerId], references: [id])
  ratings        InterviewRating[]
  notes          InterviewNote[]
  decisions      InterviewDecision[]
}
```

### InterviewCriterion — критерии оценки (seed)

```prisma
model InterviewCriterion {
  id          String   @id @default(cuid())
  name        String
  description String?
  order       Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   BigInt   @default(0)

  // Relations
  ratings     InterviewRating[]
}
```

### InterviewRating — оценки по критериям

```prisma
model InterviewRating {
  id           String   @id @default(cuid())
  interviewId  String   // → Interview
  criterionId  String   // → InterviewCriterion
  score        Int      // 1-5
  comment      String?
  createdAt    BigInt   @default(0)

  // Relations
  interview    Interview         @relation(fields: [interviewId], references: [id])
  criterion    InterviewCriterion @relation(fields: [criterionId], references: [id])
}
```

### InterviewNote — заметки интервьюера

```prisma
model InterviewNote {
  id          String   @id @default(cuid())
  interviewId String   // → Interview
  body        String   // markdown
  createdAt   BigInt   @default(0)
  updatedAt   BigInt   @default(0)

  // Relations
  interview   Interview @relation(fields: [interviewId], references: [id])
}
```

### InterviewDecision — решения по кандидатам

```prisma
model InterviewDecision {
  id               String   @id @default(cuid())
  interviewId      String   // → Interview
  decision         String   // "accept" | "reject" | "other_role"
  comment          String
  otherRoleVacancyId String? // → Vacancy (если other_role)
  createdAt        BigInt   @default(0)

  // Relations
  interview        Interview  @relation(fields: [interviewId], references: [id])
  otherRoleVacancy Vacancy?   @relation(fields: [otherRoleVacancyId], references: [id])
}
```

### CandidateMatchScore — процент совпадения

```prisma
model CandidateMatchScore {
  id             String   @id @default(cuid())
  candidateId    String   // → Candidate
  vacancyId      String   // → Vacancy
  matchPercent   Int      // 0-100
  avgScore       Float?
  calculatedAt   BigInt?

  // Relations
  candidate      Candidate @relation(fields: [candidateId], references: [id])
  vacancy        Vacancy   @relation(fields: [vacancyId], references: [id])
}
```

### TimeOffRequest — запросы на отсутствие (time-off.html)

```prisma
model TimeOffRequest {
  id                   String   @id @default(cuid())
  employeeId           String   // → Employee
  type                 String   // "annual_leave" | "non_annual_leave" | "sick_leave" | "unpaid_leave" | "decree" | "training" | "remote_work"
  startDate            BigInt
  endDate              BigInt
  days                 Float    // 0.5 для полудня
  status               String   @default("pending") // "pending" | "approved" | "rejected" | "active" | "expired"
  approverId           String?  // → Employee (руководитель)
  substituteEmployeeId String?  // → Employee (замещающий)
  reason               String?
  createdAt            BigInt   @default(0)
  updatedAt            BigInt   @default(0)

  // Relations
  employee             Employee       @relation(fields: [employeeId], references: [id])
  approver             Employee?      @relation(fields: [approverId], references: [id])
  substitute           Employee?      @relation(fields: [substituteEmployeeId], references: [id])
}
```

### SprintMetric — метрики спринта (manager-dashboard.html)

```prisma
model SprintMetric {
  id                   String   @id @default(cuid())
  sprintId             String   // → Sprint
  totalTasks           Int      @default(0)
  activeTasks          Int      @default(0)
  completedTasks       Int      @default(0)
  overdueTasks         Int      @default(0)
  totalStoryPoints     Int      @default(0)
  remainingStoryPoints Int      @default(0)
  dailyData            Json?    // [{day, ideal, actual, date}]
  updatedAt            BigInt   @default(0)

  // Relations
  sprint               Sprint   @relation(fields: [sprintId], references: [id])
}
```

### ApplicationDocument — документы к заявке

```prisma
model ApplicationDocument {
  id          String   @id @default(cuid())
  applicationId String // → Application
  type        String   // "cv" | "portfolio" | "certificate" | "other"
  url         String
  fileName    String
  uploadedAt  BigInt   @default(0)

  // Relations
  application Application @relation(fields: [applicationId], references: [id])
}
```

### VacancyView — просмотры вакансий

```prisma
model VacancyView {
  id         String   @id @default(cuid())
  vacancyId  String   // → Vacancy
  userId     String?  // → User (null для гостей)
  viewedAt   BigInt   @default(0)

  // Relations
  vacancy    Vacancy  @relation(fields: [vacancyId], references: [id])
  user       User?    @relation(fields: [userId], references: [id])
}
```

### BlogPersonalChannel — персональные каналы блога (personal-feed.html)

```prisma
model BlogPersonalChannel {
  id         String   @id @default(cuid())
  employeeId String   @unique // → Employee
  slug       String   @unique
  avatarUrl  String?
  bio        String?
  isActive   Boolean  @default(true)
  createdAt  BigInt   @default(0)
  updatedAt  BigInt   @default(0)

  // Relations
  employee   Employee @relation(fields: [employeeId], references: [id])
}
```

---

## Правила для AI-агента

1. Все `createdAt`, `updatedAt`, `expiresAt` — `BIGINT` (Unix timestamp в секундах).
2. Soft-delete для сообщений (`isDeleted = true`) — запись остаётся в БД, не выводится.
3. Удаление аккаунта — `isDeleted = true`, анонимизация через 90 дней.
4. `isHidden` для сообщений — скрытие админом группы (видна пиктограмма "скрыто").
5. Реакции — до 5 разных эмодзи на сообщение (`@@unique` на `[messageId, userId, emoji]`).
6. Лимиты групп: private/public/topic — 1000; corporate — 20000; media — 10000000.
7. Бэкапы: ежедневно в MinIO, хранение 3 дня.
8. Логи: 7 дней общие, 10 дней ошибки.
