import { Router } from 'express';

const router = Router() as import('express').Router;
import {
  createPage,
  getPages,
  getPage,
  updatePage,
  deletePage,
  createCategory,
  getCategories,
  getCategory,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartments,
  getDepartment,
  createVacancy,
  updateVacancy,
  deleteVacancy,
  getVacancies,
  getVacancy,
  applyVacancy,
  getMyApplications,
  updateApplicationStatus,
} from '../controllers/knowledgeController';
import { authRequired } from '../middleware/auth';

// ============================================================
// Knowledge Pages
// ============================================================

// POST /api/knowledge/pages — создание страницы
router.post('/pages', authRequired, createPage);

// GET /api/knowledge/pages — список страниц
router.get('/pages', getPages);

// GET /api/knowledge/pages/:id — одна страница
router.get('/pages/:id', getPage);

// PUT /api/knowledge/pages/:id — обновление страницы
router.put('/pages/:id', authRequired, updatePage);

// DELETE /api/knowledge/pages/:id — удаление страницы
router.delete('/pages/:id', authRequired, deletePage);

// ============================================================
// Knowledge Categories
// ============================================================

// POST /api/knowledge/categories — создание категории
router.post('/categories', authRequired, createCategory);

// GET /api/knowledge/categories — список категорий
router.get('/categories', getCategories);

// GET /api/knowledge/categories/:slug — категория
router.get('/categories/:slug', getCategory);

// ============================================================
// Departments
// ============================================================

// POST /api/knowledge/departments — создание отдела
router.post('/departments', authRequired, createDepartment);

// GET /api/knowledge/departments — список отделов
router.get('/departments', getDepartments);

// GET /api/knowledge/departments/:id — отдел
router.get('/departments/:id', getDepartment);

// PUT /api/knowledge/departments/:id — обновление отдела
router.put('/departments/:id', authRequired, updateDepartment);

// DELETE /api/knowledge/departments/:id — удаление отдела
router.delete('/departments/:id', authRequired, deleteDepartment);

// ============================================================
// Hiring / Vacancies
// ============================================================

// POST /api/hiring/vacancies — создание вакансии
router.post('/vacancies', authRequired, createVacancy);

// GET /api/hiring/vacancies — список вакансий
router.get('/vacancies', getVacancies);

// GET /api/hiring/vacancies/:id — вакансия
router.get('/vacancies/:id', getVacancy);

// PUT /api/hiring/vacancies/:id — обновление вакансии
router.put('/vacancies/:id', authRequired, updateVacancy);

// DELETE /api/hiring/vacancies/:id — удаление вакансии
router.delete('/vacancies/:id', authRequired, deleteVacancy);

// ============================================================
// Applications
// ============================================================

// POST /api/hiring/vacancies/:id/apply — отклик на вакансию
router.post('/vacancies/:id/apply', authRequired, applyVacancy);

// GET /api/hiring/applications/me — мои отклики
router.get('/applications/me', authRequired, getMyApplications);

// PUT /api/hiring/applications/:id/status — обновление статуса отклика
router.put('/applications/:id/status', authRequired, updateApplicationStatus);

export { router };
