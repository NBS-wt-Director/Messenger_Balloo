import { Request, Response, NextFunction } from 'express';
import {
  createPage as createPageService,
  updatePage as updatePageService,
  deletePage as deletePageService,
  getPage as getPageService,
  getPages as getPagesService,
  createCategory as createCategoryService,
  getCategories as getCategoriesService,
  getCategory as getCategoryService,
  createDepartment as createDepartmentService,
  updateDepartment as updateDepartmentService,
  deleteDepartment as deleteDepartmentService,
  getDepartments as getDepartmentsService,
  getDepartment as getDepartmentService,
  createVacancy as createVacancyService,
  updateVacancy as updateVacancyService,
  deleteVacancy as deleteVacancyService,
  getVacancies as getVacanciesService,
  getVacancy as getVacancyService,
  applyVacancy as applyVacancyService,
  getMyApplications as getMyApplicationsService,
  updateApplicationStatus as updateApplicationStatusService,
} from '../services/knowledgeService';
import { AuthenticatedRequest } from '../middleware/auth';

// ============================================================
// Knowledge Pages
// ============================================================

// POST /api/knowledge/pages — создание страницы
export const createPage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { title, content, categoryId, lastEditorId } = req.body;

    if (!title || !categoryId) {
      res.status(400).json({ error: 'Bad Request', message: 'Поля "title" и "categoryId" обязательны' });
      return;
    }

    const page = await createPageService({ title, content, categoryId, lastEditorId: userId });
    res.status(201).json(page);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// GET /api/knowledge/pages — список страниц
export const getPages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { categoryId, page, limit, search } = req.query;

    const result = await getPagesService({
      categoryId: categoryId as string | undefined,
      page: parseInt(String(page), 10) || 1,
      limit: Math.min(parseInt(String(limit), 10) || 20, 50),
      search: search as string | undefined,
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// GET /api/knowledge/pages/:id — одна страница
export const getPage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const page = await getPageService(id);
    res.json(page);
  } catch (error: any) {
    if (error.message === 'Страница не найдена') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// PUT /api/knowledge/pages/:id — обновление страницы
export const updatePage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { title, content, categoryId, lastEditorId } = req.body;

    const page = await updatePageService(id, {
      title,
      content,
      categoryId,
      lastEditorId: userId,
    });
    res.json(page);
  } catch (error: any) {
    if (error.message === 'Страница не найдена') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// DELETE /api/knowledge/pages/:id — удаление страницы
export const deletePage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await deletePageService(id);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Страница не найдена') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// Categories
// ============================================================

// POST /api/knowledge/categories — создание категории
export const createCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) {
      res.status(400).json({ error: 'Bad Request', message: 'Поля "name" и "slug" обязательны' });
      return;
    }

    const category = await createCategoryService({ name, slug });
    res.status(201).json(category);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// GET /api/knowledge/categories — список категорий
export const getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await getCategoriesService();
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// GET /api/knowledge/categories/:slug — категория
export const getCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;
    const category = await getCategoryService(slug);
    res.json(category);
  } catch (error: any) {
    if (error.message === 'Категория не найдена') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// Departments
// ============================================================

// POST /api/knowledge/departments — создание отдела
export const createDepartment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, parentId, headId } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Bad Request', message: 'Поле "name" обязательно' });
      return;
    }

    const department = await createDepartmentService({ name, description, parentId, headId });
    res.status(201).json(department);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// GET /api/knowledge/departments — список отделов
export const getDepartments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { parentId } = req.query;

    const departments = await getDepartmentsService({
      parentId: parentId as string | undefined,
    });
    res.json(departments);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// GET /api/knowledge/departments/:id — отдел
export const getDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const department = await getDepartmentService(id);
    res.json(department);
  } catch (error: any) {
    if (error.message === 'Отдел не найден') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// PUT /api/knowledge/departments/:id — обновление отдела
export const updateDepartment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, parentId, headId } = req.body;

    const department = await updateDepartmentService(id, { name, description, parentId, headId });
    res.json(department);
  } catch (error: any) {
    if (error.message === 'Отдел не найден') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// DELETE /api/knowledge/departments/:id — удаление отдела
export const deleteDepartment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await deleteDepartmentService(id);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Отдел не найден') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// Vacancies
// ============================================================

// POST /api/hiring/vacancies — создание вакансии
export const createVacancy = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, departmentId, description, requirements, salary } = req.body;

    if (!title || !departmentId) {
      res.status(400).json({ error: 'Bad Request', message: 'Поля "title" и "departmentId" обязательны' });
      return;
    }

    const vacancy = await createVacancyService({ title, departmentId, description, requirements, salary });
    res.status(201).json(vacancy);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// GET /api/hiring/vacancies — список вакансий
export const getVacancies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { departmentId, status, page, limit } = req.query;

    const result = await getVacanciesService({
      departmentId: departmentId as string | undefined,
      status: status as any,
      page: parseInt(String(page), 10) || 1,
      limit: Math.min(parseInt(String(limit), 10) || 20, 50),
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// GET /api/hiring/vacancies/:id — вакансия
export const getVacancy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const vacancy = await getVacancyService(id);
    res.json(vacancy);
  } catch (error: any) {
    if (error.message === 'Вакансия не найдена') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// PUT /api/hiring/vacancies/:id — обновление вакансии
export const updateVacancy = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, requirements, salary, status } = req.body;

    const vacancy = await updateVacancyService(id, { title, description, requirements, salary, status });
    res.json(vacancy);
  } catch (error: any) {
    if (error.message === 'Вакансия не найдена') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// DELETE /api/hiring/vacancies/:id — удаление вакансии
export const deleteVacancy = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await deleteVacancyService(id);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Вакансия не найдена') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// Applications
// ============================================================

// POST /api/hiring/vacancies/:id/apply — отклик на вакансию
export const applyVacancy = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: vacancyId } = req.params;
    const { coverLetter, resumeUrl } = req.body;

    const application = await applyVacancyService(userId, {
      vacancyId,
      coverLetter,
      resumeUrl,
    });
    res.status(201).json(application);
  } catch (error: any) {
    if (error.message === 'Вакансия не найдена') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else if (error.message === 'Вакансия закрыта') {
      res.status(400).json({ error: 'Bad Request', message: error.message });
    } else if (error.message === 'Вы уже откликались на эту вакансию') {
      res.status(409).json({ error: 'Conflict', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// GET /api/hiring/applications/me — мои отклики
export const getMyApplications = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const applications = await getMyApplicationsService(userId);
    res.json(applications);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// PUT /api/hiring/applications/:id/status — обновление статуса отклика
export const updateApplicationStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ error: 'Bad Request', message: 'Поле "status" обязательно' });
      return;
    }

    const application = await updateApplicationStatusService(id, status);
    res.json(application);
  } catch (error: any) {
    if (error.message === 'Заявка не найдена') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};
