// tasks.ts — маршруты для задач (command.balloo.su)
// POST   /api/tasks
// GET    /api/tasks
// GET    /api/tasks/:id
// PUT    /api/tasks/:id
// DELETE /api/tasks/:id

import { Router } from 'express';
import { authRequired } from '../middleware/auth';
import {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
} from '../controllers/taskController';

const router = Router() as import('express').Router;

// Все маршруты требуют авторизации
router.use(authRequired);

// POST /api/tasks — создать задачу
router.post('/', createTask);

// GET /api/tasks — список задач
router.get('/', getTasks);

// GET /api/tasks/:id — одна задача
router.get('/:id', getTask);

// PUT /api/tasks/:id — обновить задачу
router.put('/:id', updateTask);

// DELETE /api/tasks/:id — удалить задачу
router.delete('/:id', deleteTask);

export { router };
