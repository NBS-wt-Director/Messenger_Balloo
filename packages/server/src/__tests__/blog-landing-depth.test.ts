/**
 * Depth-тесты blogLandingController (тикет 1790479920-02, п.7, В-93 (а)).
 *
 * blog.test.ts покрывает smoke-пути блога. Здесь — ветки публичного
 * лендинга блога (blog.balloo.su):
 *  - getFeaturedPosts: только published, максимум 5, сортировка desc;
 *  - getPosts: пагинация page/limit, cap limit<=50, фильтры channelId/
 *    categoryId, sort=recent|popular, hasMore;
 *  - getPost: 404 draft/несуществующий, счётчик views инкремент, related;
 *  - getCategories: postCount/totalViews только по published;
 *  - getChannels: postCount/followers/totalViews;
 *  - subscribeToNewsletter: 400 невалидный email, дубль-подписка, успех;
 *  - searchPosts: пустой q → пустой результат, поиск case-insensitive,
 *    фильтр channelId;
 *  - formatPost: excerpt с '…', coverEmoji/gradient по ключевым словам
 *    заголовка, extractTags, readTime, формат даты, initials автора.
 */
import request from 'supertest';
import { app } from './helpers';
import { PrismaClient, BlogPostStatus } from '@prisma/client';

const prisma = new PrismaClient();
const now = () => BigInt(Math.floor(Date.now() / 1000));

let authorId: string;
let channelId: string;
let otherChannelId: string;
let categoryId: string;

// Уникальные префиксы, чтобы не задевать данные других наборов и сидов.
const CH = 'depth-landing-канал';
const CH2 = 'depth-landing-второй';
const CAT = 'depth-landing-категория';
const TITLE_MARK = '[bld]';

async function createPost(overrides: {
  title?: string;
  content?: string;
  status?: BlogPostStatus;
  channelId?: string | null;
  views?: number;
  createdAt?: bigint;
}): Promise<{ id: string; title: string; content: string }> {
  const title = overrides.title ?? `${TITLE_MARK} пост`;
  const content = overrides.content ?? `${TITLE_MARK} тело поста для проверки`;
  const post = await prisma.blogPost.create({
    data: {
      authorId,
      channelId: overrides.channelId === null ? null : (overrides.channelId ?? channelId),
      title,
      content,
      status: overrides.status ?? BlogPostStatus.published,
      views: overrides.views ?? 0,
      createdAt: overrides.createdAt ?? now(),
      updatedAt: now(),
    },
  });
  return { id: post.id, title, content };
}

beforeAll(async () => {
  // Автор постов
  const user = await prisma.user.create({
    data: {
      email: `bld-author-${Date.now()}@test.balloo.ru`,
      username: `bld_author_${Date.now()}`,
      passwordHash: 'x',
      createdAt: now(),
      updatedAt: now(),
    },
  });
  authorId = user.id;

  const ch = await prisma.blogChannel.create({
    data: { name: CH, description: 'канал для depth-тестов', followers: 7, createdAt: now(), updatedAt: now() },
  });
  channelId = ch.id;
  const ch2 = await prisma.blogChannel.create({
    data: { name: CH2, description: 'второй канал', followers: 3, createdAt: now(), updatedAt: now() },
  });
  otherChannelId = ch2.id;

  const cat = await prisma.blogCategory.create({
    data: { name: CAT, slug: `depth-landing-${Date.now()}`, createdAt: now() },
  });
  categoryId = cat.id;
});

afterAll(async () => {
  // Чистим по уникальным маркерам
  await prisma.blogPost.deleteMany({ where: { title: { contains: TITLE_MARK } } });
  await prisma.blogPost.deleteMany({ where: { title: { contains: '9.9' } } });
  await prisma.blogPostCategory.deleteMany({ where: { category: { name: CAT } } });
  await prisma.blogComment.deleteMany({ where: { authorId } });
  await prisma.blogChannel.deleteMany({ where: { name: { in: [CH, CH2] } } });
  await prisma.blogCategory.deleteMany({ where: { name: CAT } });
  await prisma.user.deleteMany({ where: { id: authorId } });
  await prisma.$disconnect();
});

describe('Blog landing controller depth (В-93 а)', () => {
  describe('GET /api/blog-landing/featured', () => {
    it('возвращает только published, максимум 5, сортировка createdAt desc', async () => {
      // Параллельные воркеры Jest создают свои published-посты с createdAt=now()
      // — они могут быть новее base. Свои 7 постов создаём В БУДУЩЕМ
      // (base+93…base+99, шаг 1 с): гарантированно новее любых постов других
      // наборов в пределах прогона (прогон сервера ~30 с < 93 с запаса).
      const base = now();
      for (let i = 1; i <= 7; i++) {
        await createPost({ title: `${TITLE_MARK} feat ${i}`, createdAt: base + BigInt(100 - i) });
      }
      await createPost({ title: `${TITLE_MARK} черновик`, status: BlogPostStatus.draft, createdAt: base + BigInt(100) });

      const res = await request(app).get('/api/blog-landing/featured');
      expect(res.status).toBe(200);
      const mine = res.body.posts.filter((p: { title: string }) => p.title.startsWith(TITLE_MARK));
      // Топ-5 по createdAt desc — ровно 5 моих самых свежих; draft отфильтрован
      expect(mine.length).toBe(5);
      const mineTitles = mine.map((p: { title: string }) => p.title);
      expect(mineTitles.join(' ')).not.toContain('черновик');
      // Порядок desc: feat 1 (base+99) первый
      expect(mineTitles[0]).toBe(`${TITLE_MARK} feat 1`);
    });

    it('coverEmoji/gradient по ключевым словам: релиз, дизайн, websocket, команда, метрики', async () => {
      // Посты в будущем (base1+300…304) и БЕЗ канала: не попадут в related
      // related-теста (тот же канал), но будут топ-5 в featured
      const base1 = now() + BigInt(300);
      await createPost({ title: `${TITLE_MARK} релиз 9.9 alpha`, createdAt: base1, channelId: null });
      await createPost({ title: `${TITLE_MARK} дизайн 9.9 ui`, createdAt: base1 + BigInt(1), channelId: null });
      await createPost({ title: `${TITLE_MARK} websocket 9.9 realtime`, createdAt: base1 + BigInt(2), channelId: null });
      await createPost({ title: `${TITLE_MARK} команда 9.9 team`, createdAt: base1 + BigInt(3), channelId: null });
      await createPost({ title: `${TITLE_MARK} метрики 9.9 analytics`, createdAt: base1 + BigInt(4), channelId: null });

      const res = await request(app).get('/api/blog-landing/featured');
      expect(res.status).toBe(200);
      // take:5 — все 5 свежих постов канала, это созданные выше
      const emojis: string[] = [];
      for (const p of res.body.posts) {
        emojis.push(p.coverEmoji);
        expect(p.coverGradient).toContain('linear-gradient');
      }
      expect(emojis).toEqual(expect.arrayContaining(['🚀', '🎨', '⚡', '👥', '📊']));
    });

    it('emoji: безопасность/docker/prisma и дефолт 📝', async () => {
      // Ещё дальше в будущем (base2+310…313), БЕЗ канала
      const base2 = now() + BigInt(310);
      await createPost({ title: `${TITLE_MARK} безопасность 9.9 auth`, createdAt: base2, channelId: null });
      await createPost({ title: `${TITLE_MARK} docker 9.9 compose`, createdAt: base2 + BigInt(1), channelId: null });
      await createPost({ title: `${TITLE_MARK} prisma 9.9 database`, createdAt: base2 + BigInt(2), channelId: null });
      await createPost({ title: `${TITLE_MARK} обычный 9.9 пост`, createdAt: base2 + BigInt(3), channelId: null });

      const res = await request(app).get('/api/blog-landing/featured');
      expect(res.status).toBe(200);
      const byTitle: Record<string, string> = {};
      for (const p of res.body.posts) {
        byTitle[p.title] = p.coverEmoji;
      }
      expect(byTitle[`${TITLE_MARK} безопасность 9.9 auth`]).toBe('🔒');
      expect(byTitle[`${TITLE_MARK} docker 9.9 compose`]).toBe('🐳');
      expect(byTitle[`${TITLE_MARK} prisma 9.9 database`]).toBe('🗄️');
      expect(byTitle[`${TITLE_MARK} обычный 9.9 пост`]).toBe('📝');
    });
  });

  describe('GET /api/blog-landing/posts', () => {
    it('пагинация: page, limit, total, hasMore', async () => {
      const res = await request(app).get('/api/blog-landing/posts?page=1&limit=2');
      expect(res.status).toBe(200);
      expect(res.body.posts.length).toBeLessThanOrEqual(2);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(2);
      expect(typeof res.body.total).toBe('number');
      expect(res.body.hasMore).toBe(res.body.page * res.body.limit < res.body.total);
    });

    it('limit cap: limit=999 → фактически 50', async () => {
      const res = await request(app).get('/api/blog-landing/posts?limit=999');
      expect(res.status).toBe(200);
      expect(res.body.limit).toBe(50);
      expect(res.body.posts.length).toBeLessThanOrEqual(50);
    });

    it('sort=popular упорядочивает по views desc', async () => {
      await createPost({ title: `${TITLE_MARK} популярный`, views: 500 });
      await createPost({ title: `${TITLE_MARK} непопулярный`, views: 1 });

      const res = await request(app).get('/api/blog-landing/posts?sort=popular&limit=50');
      expect(res.status).toBe(200);
      const views = res.body.posts.map((p: { views: number }) => p.views);
      const sorted = [...views].sort((a, b) => b - a);
      expect(views).toEqual(sorted);
    });

    it('фильтр channelId', async () => {
      await createPost({ title: `${TITLE_MARK} в первом канале`, channelId });
      await createPost({ title: `${TITLE_MARK} во втором канале`, channelId: otherChannelId });

      const res = await request(app).get(`/api/blog-landing/posts?channelId=${channelId}&limit=50`);
      expect(res.status).toBe(200);
      const titles = res.body.posts.map((p: { title: string }) => p.title);
      expect(titles).toContain(`${TITLE_MARK} в первом канале`);
      expect(titles).not.toContain(`${TITLE_MARK} во втором канале`);
    });

    it('фильтр categoryId — только посты категории', async () => {
      const p1 = await createPost({ title: `${TITLE_MARK} категория да` });
      const p2 = await createPost({ title: `${TITLE_MARK} категория нет` });
      await prisma.blogPostCategory.create({
        data: { postId: p1.id, categoryId, createdAt: now() },
      });

      const res = await request(app).get(`/api/blog-landing/posts?categoryId=${categoryId}&limit=50`);
      expect(res.status).toBe(200);
      const ids = res.body.posts.map((p: { id: string }) => p.id);
      expect(ids).toContain(p1.id);
      expect(ids).not.toContain(p2.id);
    });

    it('формат formatPost: author/channel/categories/comments/initials', async () => {
      const p = await createPost({ title: `${TITLE_MARK} формат` });
      await prisma.blogPostCategory.create({ data: { postId: p.id, categoryId, createdAt: now() } });
      await prisma.blogComment.create({
        data: { postId: p.id, authorId, content: 'коммент', createdAt: now(), updatedAt: now() },
      });

      const res = await request(app).get('/api/blog-landing/posts?limit=50');
      const item = res.body.posts.find((x: { id: string }) => x.id === p.id);
      expect(item).toBeTruthy();
      expect(item.author.id).toBe(authorId);
      expect(item.author.initials).toBe(item.author.name.slice(0, 2).toUpperCase());
      expect(item.channel.id).toBe(channelId);
      expect(item.categories[0].id).toBe(categoryId);
      expect(item.comments).toBe(1);
      expect(item.reactions).toBe(0);
      expect(typeof item.publishedAtFormatted).toBe('string');
      expect(item.readTime).toBeGreaterThanOrEqual(1);
      expect(item.tags).toEqual([]);
    });

    it('tags извлекаются из контента, уникальны, максимум 6', async () => {
      const p = await createPost({
        title: `${TITLE_MARK} теги`,
        content: 'тело #alpha #beta #alpha #gamma #delta #epsilon #zeta #eta #theta',
      });

      const res = await request(app).get('/api/blog-landing/posts?limit=50');
      const item = res.body.posts.find((x: { id: string }) => x.id === p.id);
      expect(item.tags).toEqual(['#alpha', '#beta', '#gamma', '#delta', '#epsilon', '#zeta']);
    });

    it('excerpt: короткий контент без многоточия, длинный с …', async () => {
      const short = await createPost({ title: `${TITLE_MARK} короткий`, content: 'короткое тело' });
      const long = await createPost({ title: `${TITLE_MARK} длинный`, content: 'x'.repeat(250) });

      const res = await request(app).get('/api/blog-landing/posts?limit=50');
      const s = res.body.posts.find((x: { id: string }) => x.id === short.id);
      const l = res.body.posts.find((x: { id: string }) => x.id === long.id);
      expect(s.excerpt).toBe('короткое тело');
      expect(l.excerpt.endsWith('…')).toBe(true);
      expect(l.excerpt.length).toBe(201); // 200 символов + многоточие
    });
  });

  describe('GET /api/blog-landing/posts/:id', () => {
    it('404 несуществующий id', async () => {
      const res = await request(app).get('/api/blog-landing/posts/nonexistent-id');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Пост не найден');
    });

    it('draft → 404', async () => {
      const p = await createPost({ title: `${TITLE_MARK} драфт 404`, status: BlogPostStatus.draft });
      const res = await request(app).get(`/api/blog-landing/posts/${p.id}`);
      expect(res.status).toBe(404);
    });

    it('успех: views инкремент, related из того же канала', async () => {
      // createdAt задаётся явно: колонка в секундах, а параллельные воркеры
      // создают посты с createdAt=now(). featured-тест этого набора создаёт
      // посты base+93…99 (base — его собственный now()), поэтому здесь
      // сдвигаемся на +200 с: main/rel гарантированно новее всего.
      const base = now() + BigInt(200);
      const main = await createPost({ title: `${TITLE_MARK} главная`, views: 5, createdAt: base });
      const rel = await createPost({ title: `${TITLE_MARK} релейшен`, views: 0, createdAt: base + BigInt(10) });

      const res = await request(app).get(`/api/blog-landing/posts/${main.id}`);
      expect(res.status).toBe(200);
      // Примечание: инкремент выполняется после findFirst, поэтому в ответе
      // значение ДО инкремента (5). Фактический инкремент проверяем в БД.
      expect(res.body.post.views).toBe(5);
      const dbPost = await prisma.blogPost.findUnique({ where: { id: main.id } });
      expect(dbPost?.views).toBe(6);
      // related: тот же канал, id != main, take 3, sort createdAt desc.
      // rel — самый свежий published пост канала → обязан быть первым.
      const ids = res.body.related.map((p: { id: string }) => p.id);
      expect(ids).not.toContain(main.id);
      expect(res.body.related.length).toBeLessThanOrEqual(3);
      for (const r of res.body.related) {
        expect(r.channel.id).toBe(channelId);
      }
      expect(ids[0]).toBe(rel.id);
    });
  });

  describe('GET /api/blog-landing/categories', () => {
    it('postCount/totalViews только по published', async () => {
      // Собственная категория и канал — изоляция от постов других тестов набора
      const cat = await prisma.blogCategory.create({
        data: { name: 'depth-landing-cat-iso', slug: `depth-landing-iso-${Date.now()}`, createdAt: now() },
      });
      try {
        const published = await createPost({ title: `${TITLE_MARK} кат паб`, views: 10, channelId: null });
        const draft = await createPost({ title: `${TITLE_MARK} кат драфт`, status: BlogPostStatus.draft, views: 99, channelId: null });
        await prisma.blogPostCategory.create({ data: { postId: published.id, categoryId: cat.id, createdAt: now() } });
        await prisma.blogPostCategory.create({ data: { postId: draft.id, categoryId: cat.id, createdAt: now() } });

        const res = await request(app).get('/api/blog-landing/categories');
        expect(res.status).toBe(200);
        const found = res.body.categories.find((c: { id: string }) => c.id === cat.id);
        expect(found).toBeTruthy();
        expect(found.postCount).toBe(1);
        expect(found.totalViews).toBe(10);
      } finally {
        await prisma.blogPostCategory.deleteMany({ where: { categoryId: cat.id } });
        await prisma.blogCategory.delete({ where: { id: cat.id } });
      }
    });
  });

  describe('GET /api/blog-landing/channels', () => {
    it('postCount/followers/totalViews по published', async () => {
      // Собственный канал — изоляция от постов других тестов набора
      const ch = await prisma.blogChannel.create({
        data: { name: `depth-landing-канал-iso-${Date.now()}`, followers: 42, createdAt: now(), updatedAt: now() },
      });
      try {
        await createPost({ title: `${TITLE_MARK} канал-пост`, views: 3, channelId: ch.id });
        await createPost({ title: `${TITLE_MARK} канал-драфт`, status: BlogPostStatus.draft, views: 77, channelId: ch.id });

        const res = await request(app).get('/api/blog-landing/channels');
        expect(res.status).toBe(200);
        const found = res.body.channels.find((c: { id: string }) => c.id === ch.id);
        expect(found).toBeTruthy();
        expect(found.postCount).toBe(1);
        expect(found.followers).toBe(42);
        expect(found.totalViews).toBe(3);
      } finally {
        await prisma.blogPost.deleteMany({ where: { channelId: ch.id } });
        await prisma.blogChannel.delete({ where: { id: ch.id } });
      }
    });
  });

  describe('POST /api/blog-landing/subscribe', () => {
    it('400 невалидный email', async () => {
      const res = await request(app).post('/api/blog-landing/subscribe').send({ email: 'not-an-email' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Некорректный email');
    });

    it('400 без email', async () => {
      const res = await request(app).post('/api/blog-landing/subscribe').send({});
      expect(res.status).toBe(400);
    });

    it('успешная подписка → повторная даёт «уже подписаны»', async () => {
      const email = `bld-sub-${Date.now()}@test.balloo.ru`;
      const res1 = await request(app).post('/api/blog-landing/subscribe').send({ email });
      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);
      expect(res1.body.message).toBe('Подписка оформлена успешно');

      const res2 = await request(app).post('/api/blog-landing/subscribe').send({ email });
      expect(res2.status).toBe(200);
      expect(res2.body.message).toBe('Вы уже подписаны на рассылку');
    });
  });

  describe('GET /api/blog-landing/search', () => {
    it('пустой q → пустой результат', async () => {
      const res = await request(app).get('/api/blog-landing/search?q=');
      expect(res.status).toBe(200);
      expect(res.body.posts).toEqual([]);
      expect(res.body.total).toBe(0);
      expect(res.body.hasMore).toBe(false);
    });

    it('поиск case-insensitive по title', async () => {
      const p = await createPost({ title: `${TITLE_MARK} UniqueTokenCase` });
      const res = await request(app).get('/api/blog-landing/search?q=uniquetokencase');
      expect(res.status).toBe(200);
      const ids = res.body.posts.map((x: { id: string }) => x.id);
      expect(ids).toContain(p.id);
      const item = res.body.posts.find((x: { id: string }) => x.id === p.id);
      expect(item.highlightQuery).toBe('uniquetokencase');
    });

    it('поиск по content', async () => {
      const p = await createPost({ title: `${TITLE_MARK} поиск по телу`, content: 'секретное слово ZzQqWw в теле' });
      const res = await request(app).get('/api/blog-landing/search?q=zzqqww');
      expect(res.status).toBe(200);
      const ids = res.body.posts.map((x: { id: string }) => x.id);
      expect(ids).toContain(p.id);
    });

    it('фильтр channelId при поиске', async () => {
      await createPost({ title: `${TITLE_MARK} поиск в первом` });
      await createPost({ title: `${TITLE_MARK} поиск во втором`, channelId: otherChannelId });

      const res = await request(app).get(`/api/blog-landing/search?q=${encodeURIComponent(TITLE_MARK)}&channelId=${otherChannelId}&limit=50`);
      expect(res.status).toBe(200);
      const titles = res.body.posts.map((p: { title: string }) => p.title);
      expect(titles).toContain(`${TITLE_MARK} поиск во втором`);
      expect(titles).not.toContain(`${TITLE_MARK} поиск в первом`);
    });
  });
});