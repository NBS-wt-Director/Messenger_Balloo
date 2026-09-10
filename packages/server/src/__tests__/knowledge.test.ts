import request from 'supertest';
import { app, registerTestUser } from './helpers';

describe('Knowledge & Hiring API (база знаний + вакансии)', () => {
  let user: { id: string; accessToken: string };

  beforeAll(async () => {
    user = await registerTestUser();
  });

  const auth = () => ['Authorization', `Bearer ${user.accessToken}`] as const;

  // ============================================================
  // Categories
  // ============================================================
  describe('Categories', () => {
    it('POST /api/knowledge/categories creates a category', async () => {
      const [key, value] = auth();
      const res = await request(app)
        .post('/api/knowledge/categories')
        .set(key, value)
        .send({ name: `Test Cat ${Date.now()}`, slug: `test-cat-${Date.now()}` });

      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('id');
    });

    it('POST /api/knowledge/categories rejects missing fields', async () => {
      const [key, value] = auth();
      const res = await request(app)
        .post('/api/knowledge/categories')
        .set(key, value)
        .send({ name: 'Only name' });

      expect(res.status).toBe(400);
    });

    it('POST /api/knowledge/categories rejects without auth', async () => {
      const res = await request(app)
        .post('/api/knowledge/categories')
        .send({ name: 'X', slug: 'x' });

      expect(res.status).toBe(401);
    });

    it('GET /api/knowledge/categories returns list', async () => {
      const res = await request(app).get('/api/knowledge/categories');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/knowledge/categories/:slug returns 404 for unknown slug', async () => {
      const res = await request(app).get('/api/knowledge/categories/no-such-slug-xyz');
      expect(res.status).toBe(404);
    });
  });

  // ============================================================
  // Pages
  // ============================================================
  describe('Pages CRUD', () => {
    let categoryId: string;

    beforeAll(async () => {
      const [key, value] = auth();
      const res = await request(app)
        .post('/api/knowledge/categories')
        .set(key, value)
        .send({ name: `Pages Cat ${Date.now()}`, slug: `pages-cat-${Date.now()}` });
      categoryId = res.body.id;
    });

    it('POST /api/knowledge/pages rejects without auth', async () => {
      const res = await request(app)
        .post('/api/knowledge/pages')
        .send({ title: 'T', categoryId: 'c' });

      expect(res.status).toBe(401);
    });

    it('POST /api/knowledge/pages rejects missing title/categoryId', async () => {
      const [key, value] = auth();
      const res = await request(app)
        .post('/api/knowledge/pages')
        .set(key, value)
        .send({ content: 'no title' });

      expect(res.status).toBe(400);
    });

    it('creates, reads, updates and deletes a page', async () => {
      const [key, value] = auth();

      // Create
      const createRes = await request(app)
        .post('/api/knowledge/pages')
        .set(key, value)
        .send({ title: 'Test Page', content: 'Hello content', categoryId });
      expect(createRes.status).toBe(201);
      const pageId = createRes.body.id;

      // GET list
      const listRes = await request(app).get('/api/knowledge/pages');
      expect(listRes.status).toBe(200);

      // GET by id
      const getRes = await request(app).get(`/api/knowledge/pages/${pageId}`);
      expect(getRes.status).toBe(200);

      // GET with filters
      const filtered = await request(app)
        .get('/api/knowledge/pages')
        .query({ categoryId, search: 'Test', page: 1, limit: 10 });
      expect(filtered.status).toBe(200);

      // Update
      const updateRes = await request(app)
        .put(`/api/knowledge/pages/${pageId}`)
        .set(key, value)
        .send({ title: 'Updated Page', content: 'Updated content' });
      expect(updateRes.status).toBe(200);

      // Delete
      const deleteRes = await request(app)
        .delete(`/api/knowledge/pages/${pageId}`)
        .set(key, value);
      expect(deleteRes.status).toBe(200);
    });

    it('GET /api/knowledge/pages/:id returns 404 for unknown page', async () => {
      const res = await request(app).get('/api/knowledge/pages/no-such-page-xyz');
      expect(res.status).toBe(404);
    });

    it('PUT /api/knowledge/pages/:id returns 404 for unknown page', async () => {
      const [key, value] = auth();
      const res = await request(app)
        .put('/api/knowledge/pages/no-such-page-xyz')
        .set(key, value)
        .send({ title: 'Nope' });
      expect(res.status).toBe(404);
    });

    it('DELETE /api/knowledge/pages/:id returns 404 for unknown page', async () => {
      const [key, value] = auth();
      const res = await request(app)
        .delete('/api/knowledge/pages/no-such-page-xyz')
        .set(key, value);
      expect(res.status).toBe(404);
    });
  });

  // ============================================================
  // Departments
  // ============================================================
  describe('Departments CRUD', () => {
    it('POST /api/knowledge/departments rejects missing name', async () => {
      const [key, value] = auth();
      const res = await request(app)
        .post('/api/knowledge/departments')
        .set(key, value)
        .send({ description: 'no name' });

      expect(res.status).toBe(400);
    });

    it('creates, reads, updates and deletes a department', async () => {
      const [key, value] = auth();

      // Create
      const createRes = await request(app)
        .post('/api/knowledge/departments')
        .set(key, value)
        .send({ name: `Dept ${Date.now()}`, description: 'Test department' });
      expect(createRes.status).toBe(201);
      const deptId = createRes.body.id;

      // GET list
      const listRes = await request(app).get('/api/knowledge/departments');
      expect(listRes.status).toBe(200);

      // GET by id
      const getRes = await request(app).get(`/api/knowledge/departments/${deptId}`);
      expect(getRes.status).toBe(200);

      // Update
      const updateRes = await request(app)
        .put(`/api/knowledge/departments/${deptId}`)
        .set(key, value)
        .send({ name: `Dept Updated ${Date.now()}` });
      expect(updateRes.status).toBe(200);

      // Delete
      const deleteRes = await request(app)
        .delete(`/api/knowledge/departments/${deptId}`)
        .set(key, value);
      expect(deleteRes.status).toBe(200);
    });

    it('GET /api/knowledge/departments/:id returns 404 for unknown', async () => {
      const res = await request(app).get('/api/knowledge/departments/no-such-dept-xyz');
      expect(res.status).toBe(404);
    });
  });

  // ============================================================
  // Vacancies + Applications (hiring)
  // ============================================================
  describe('Vacancies & Applications', () => {
    let departmentId: string;

    beforeAll(async () => {
      const [key, value] = auth();
      const res = await request(app)
        .post('/api/knowledge/departments')
        .set(key, value)
        .send({ name: `Hiring Dept ${Date.now()}` });
      departmentId = res.body.id;
    });

    it('POST /api/hiring/vacancies rejects missing fields', async () => {
      const [key, value] = auth();
      const res = await request(app)
        .post('/api/hiring/vacancies')
        .set(key, value)
        .send({ title: 'Only title' });

      expect(res.status).toBe(400);
    });

    it('creates, lists, applies to and updates a vacancy', async () => {
      const [key, value] = auth();

      // Create
      const createRes = await request(app)
        .post('/api/hiring/vacancies')
        .set(key, value)
        .send({
          title: `Vacancy ${Date.now()}`,
          departmentId,
          description: 'Test vacancy',
          requirements: 'TS, React',
          salary: '100000',
        });
      expect(createRes.status).toBe(201);
      const vacancyId = createRes.body.id;

      // GET list (public)
      const listRes = await request(app).get('/api/hiring/vacancies');
      expect(listRes.status).toBe(200);

      // GET by id (public)
      const getRes = await request(app).get(`/api/hiring/vacancies/${vacancyId}`);
      expect(getRes.status).toBe(200);

      // Apply (auth)
      const applyRes = await request(app)
        .post(`/api/hiring/vacancies/${vacancyId}/apply`)
        .set(key, value)
        .send({ coverLetter: 'I want this job' });
      expect(applyRes.status).toBe(201);

      // Duplicate apply → 409
      const dupRes = await request(app)
        .post(`/api/hiring/vacancies/${vacancyId}/apply`)
        .set(key, value)
        .send({ coverLetter: 'again' });
      expect(dupRes.status).toBe(409);

      // My applications
      const myRes = await request(app)
        .get('/api/hiring/applications/me')
        .set(key, value);
      expect(myRes.status).toBe(200);

      // Update vacancy
      const updateRes = await request(app)
        .put(`/api/hiring/vacancies/${vacancyId}`)
        .set(key, value)
        .send({ title: 'Updated Vacancy', status: 'closed' });
      expect(updateRes.status).toBe(200);

      // Delete vacancy
      const deleteRes = await request(app)
        .delete(`/api/hiring/vacancies/${vacancyId}`)
        .set(key, value);
      expect(deleteRes.status).toBe(200);
    });

    it('GET /api/hiring/vacancies/:id returns 404 for unknown', async () => {
      const res = await request(app).get('/api/hiring/vacancies/no-such-vacancy-xyz');
      expect(res.status).toBe(404);
    });

    it('PUT /api/hiring/applications/:id/status rejects missing status', async () => {
      const [key, value] = auth();
      const res = await request(app)
        .put('/api/hiring/applications/some-id/status')
        .set(key, value)
        .send({});
      expect(res.status).toBe(400);
    });
  });
});
