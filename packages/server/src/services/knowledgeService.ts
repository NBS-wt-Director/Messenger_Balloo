import { PrismaClient, ApplicationStatus, VacancyStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================
// Knowledge Pages
// ============================================================

interface CreatePageInput {
  title: string;
  content?: string;
  categoryId: string;
  lastEditorId?: string;
}

export const createPage = async (input: CreatePageInput) => {
  const now = BigInt(Math.floor(Date.now() / 1000));

  const page = await prisma.knowledgePage.create({
    data: {
      title: input.title,
      content: input.content || null,
      categoryId: input.categoryId,
      lastEditorId: input.lastEditorId || null,
      version: 1,
      createdAt: now,
      updatedAt: now,
    },
  });

  return formatPage(page);
};

interface UpdatePageInput {
  title?: string;
  content?: string;
  categoryId?: string;
  lastEditorId?: string;
}

export const updatePage = async (pageId: string, input: UpdatePageInput) => {
  const now = BigInt(Math.floor(Date.now() / 1000));

  const updateData: Record<string, unknown> = {
    updatedAt: now,
    version: { increment: 1 },
  };
  if (input.title !== undefined) updateData.title = input.title;
  if (input.content !== undefined) updateData.content = input.content;
  if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;
  if (input.lastEditorId !== undefined) updateData.lastEditorId = input.lastEditorId;

  const page = await prisma.knowledgePage.update({
    where: { id: pageId },
    data: updateData,
  });

  return formatPage(page);
};

export const deletePage = async (pageId: string) => {
  await prisma.knowledgePage.delete({
    where: { id: pageId },
  });

  return { message: 'Страница удалена' };
};

export const getPage = async (pageId: string) => {
  const page = await prisma.knowledgePage.findUnique({
    where: { id: pageId },
    include: {
      category: true,
      lastEditor: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!page) {
    throw new Error('Страница не найдена');
  }

  return formatPage(page);
};

export const getPages = async ({
  categoryId,
  page = 1,
  limit = 20,
  search,
}: {
  categoryId?: string;
  page?: number;
  limit?: number;
  search?: string;
} = {}) => {
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (categoryId) where.categoryId = categoryId;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [pages, total] = await Promise.all([
    prisma.knowledgePage.findMany({
      where,
      include: {
        category: true,
        lastEditor: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.knowledgePage.count({ where }),
  ]);

  return {
    pages: pages.map(formatPage),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

// ============================================================
// Categories
// ============================================================

interface CreateCategoryInput {
  name: string;
  slug: string;
}

export const createCategory = async (input: CreateCategoryInput) => {
  const now = BigInt(Math.floor(Date.now() / 1000));

  const category = await prisma.blogCategory.create({
    data: {
      name: input.name,
      slug: input.slug,
      createdAt: now,
    },
  });

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    createdAt: category.createdAt,
  };
};

export const getCategories = async () => {
  const categories = await prisma.blogCategory.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          knowledgePages: true,
          postCategories: true,
        },
      },
    },
  });

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    pagesCount: cat._count.knowledgePages,
    postsCount: cat._count.postCategories,
    createdAt: cat.createdAt,
  }));
};

export const getCategory = async (slug: string) => {
  const category = await prisma.blogCategory.findUnique({
    where: { slug },
    include: {
      knowledgePages: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!category) {
    throw new Error('Категория не найдена');
  }

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    pages: category.knowledgePages.map((page) => formatPage(page)),
    createdAt: category.createdAt,
  };
};

// ============================================================
// Departments
// ============================================================

interface CreateDepartmentInput {
  name: string;
  description?: string;
  parentId?: string;
  headId?: string;
}

export const createDepartment = async (input: CreateDepartmentInput) => {
  const now = BigInt(Math.floor(Date.now() / 1000));

  const department = await prisma.department.create({
    data: {
      name: input.name,
      description: input.description || null,
      parentId: input.parentId || null,
      headId: input.headId || null,
      createdAt: now,
      updatedAt: now,
    },
  });

  return formatDepartment(department);
};

export const updateDepartment = async (
  departmentId: string,
  input: { name?: string; description?: string; parentId?: string | null; headId?: string | null }
) => {
  const now = BigInt(Math.floor(Date.now() / 1000));

  const updateData: Record<string, unknown> = { updatedAt: now };
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.parentId !== undefined) updateData.parentId = input.parentId;
  if (input.headId !== undefined) updateData.headId = input.headId;

  const department = await prisma.department.update({
    where: { id: departmentId },
    data: updateData,
  });

  return formatDepartment(department);
};

export const deleteDepartment = async (departmentId: string) => {
  await prisma.department.delete({
    where: { id: departmentId },
  });

  return { message: 'Отдел удалён' };
};

export const getDepartments = async ({ parentId }: { parentId?: string } = {}) => {
  const where: Record<string, unknown> = {};
  if (parentId !== undefined) where.parentId = parentId;

  const departments = await prisma.department.findMany({
    where,
    include: {
      parent: {
        select: {
          id: true,
          name: true,
        },
      },
      head: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
      children: {
        select: {
          id: true,
          name: true,
        },
      },
      vacancies: {
        where: { status: VacancyStatus.open },
        select: {
          id: true,
          title: true,
          salary: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return departments.map(formatDepartment);
};

export const getDepartment = async (departmentId: string) => {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    include: {
      parent: {
        select: {
          id: true,
          name: true,
        },
      },
      children: {
        select: {
          id: true,
          name: true,
        },
      },
      head: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          profile: true,
        },
      },
      vacancies: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!department) {
    throw new Error('Отдел не найден');
  }

  return formatDepartment(department);
};

const formatDepartment = (dept: any) => ({
  id: dept.id,
  name: dept.name,
  description: dept.description,
  parentId: dept.parentId,
  parent: dept.parent
    ? { id: dept.parent.id, name: dept.parent.name }
    : null,
  children: (dept.children || []).map((c: any) => ({
    id: c.id,
    name: c.name,
  })),
  head: dept.head
    ? {
        id: dept.head.id,
        username: dept.head.username,
        avatarUrl: dept.head.avatarUrl,
      }
    : null,
  vacanciesCount: dept.vacancies?.length || 0,
  createdAt: dept.createdAt,
  updatedAt: dept.updatedAt,
});

// ============================================================
// Vacancies
// ============================================================

interface CreateVacancyInput {
  title: string;
  departmentId: string;
  description?: string;
  requirements?: string;
  salary?: string;
}

export const createVacancy = async (input: CreateVacancyInput) => {
  const now = BigInt(Math.floor(Date.now() / 1000));

  const vacancy = await prisma.vacancy.create({
    data: {
      title: input.title,
      departmentId: input.departmentId,
      description: input.description || null,
      requirements: input.requirements || null,
      salary: input.salary || null,
      status: VacancyStatus.open,
      createdAt: now,
      updatedAt: now,
    },
    include: {
      department: true,
    },
  });

  return formatVacancy(vacancy);
};

export const updateVacancy = async (
  vacancyId: string,
  input: {
    title?: string;
    description?: string;
    requirements?: string;
    salary?: string;
    status?: VacancyStatus;
  }
) => {
  const now = BigInt(Math.floor(Date.now() / 1000));

  const updateData: Record<string, unknown> = { updatedAt: now };
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.requirements !== undefined) updateData.requirements = input.requirements;
  if (input.salary !== undefined) updateData.salary = input.salary;
  if (input.status !== undefined) updateData.status = input.status;

  const vacancy = await prisma.vacancy.update({
    where: { id: vacancyId },
    data: updateData,
    include: {
      department: true,
    },
  });

  return formatVacancy(vacancy);
};

export const deleteVacancy = async (vacancyId: string) => {
  await prisma.vacancy.delete({
    where: { id: vacancyId },
  });

  return { message: 'Вакансия удалена' };
};

export const getVacancies = async ({
  departmentId,
  status,
  page = 1,
  limit = 20,
}: {
  departmentId?: string;
  status?: VacancyStatus;
  page?: number;
  limit?: number;
} = {}) => {
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (departmentId) where.departmentId = departmentId;
  if (status) where.status = status;

  const [vacancies, total] = await Promise.all([
    prisma.vacancy.findMany({
      where,
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.vacancy.count({ where }),
  ]);

  return {
    vacancies: vacancies.map((v) => ({
      id: v.id,
      title: v.title,
      department: v.department,
      description: v.description,
      requirements: v.requirements,
      salary: v.salary,
      status: v.status,
      applicationsCount: v._count.applications,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

export const getVacancy = async (vacancyId: string) => {
  const vacancy = await prisma.vacancy.findUnique({
    where: { id: vacancyId },
    include: {
      department: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      applications: {
        include: {
          applicant: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!vacancy) {
    throw new Error('Вакансия не найдена');
  }

  return {
    id: vacancy.id,
    title: vacancy.title,
    department: {
      id: vacancy.department.id,
      name: vacancy.department.name,
      description: vacancy.department.description,
    },
    description: vacancy.description,
    requirements: vacancy.requirements,
    salary: vacancy.salary,
    status: vacancy.status,
    applications: vacancy.applications.map((app) => ({
      id: app.id,
      applicant: app.applicant,
      status: app.status,
      coverLetter: app.coverLetter,
      resumeUrl: app.resumeUrl,
      appliedAt: app.createdAt,
    })),
    applicationsCount: vacancy.applications.length,
    createdAt: vacancy.createdAt,
    updatedAt: vacancy.updatedAt,
  };
};

// ============================================================
// Applications
// ============================================================

interface CreateApplicationInput {
  vacancyId: string;
  coverLetter?: string;
  resumeUrl?: string;
}

export const applyVacancy = async (applicantId: string, input: CreateApplicationInput) => {
  const now = BigInt(Math.floor(Date.now() / 1000));

  // Проверяем, что вакансия существует и открыта
  const vacancy = await prisma.vacancy.findUnique({
    where: { id: input.vacancyId },
  });

  if (!vacancy) {
    throw new Error('Вакансия не найдена');
  }

  if (vacancy.status !== VacancyStatus.open) {
    throw new Error('Вакансия закрыта');
  }

  // Проверяем, не откликался ли пользователь уже
  const existing = await prisma.application.findFirst({
    where: {
      vacancyId: input.vacancyId,
      applicantId,
    },
  });

  if (existing) {
    throw new Error('Вы уже откликались на эту вакансию');
  }

  const application = await prisma.application.create({
    data: {
      vacancyId: input.vacancyId,
      applicantId,
      coverLetter: input.coverLetter || null,
      resumeUrl: input.resumeUrl || null,
      status: ApplicationStatus.new,
      createdAt: now,
      updatedAt: now,
    },
    include: {
      vacancy: {
        select: {
          id: true,
          title: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return {
    id: application.id,
    vacancy: {
      id: application.vacancy.id,
      title: application.vacancy.title,
      department: application.vacancy.department,
    },
    coverLetter: application.coverLetter,
    resumeUrl: application.resumeUrl,
    status: application.status,
    appliedAt: application.createdAt,
  };
};

export const getMyApplications = async (applicantId: string) => {
  const applications = await prisma.application.findMany({
    where: { applicantId },
    include: {
      vacancy: {
        select: {
          id: true,
          title: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return applications.map((app) => ({
    id: app.id,
    vacancy: {
      id: app.vacancy.id,
      title: app.vacancy.title,
      department: app.vacancy.department,
    },
    status: app.status,
    coverLetter: app.coverLetter,
    resumeUrl: app.resumeUrl,
    appliedAt: app.createdAt,
    updatedAt: app.updatedAt,
  }));
};

export const updateApplicationStatus = async (
  applicationId: string,
  status: ApplicationStatus
) => {
  const now = BigInt(Math.floor(Date.now() / 1000));

  const application = await prisma.application.update({
    where: { id: applicationId },
    data: { status, updatedAt: now },
    include: {
      vacancy: {
        select: {
          id: true,
          title: true,
        },
      },
      applicant: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  });

  return {
    id: application.id,
    vacancy: {
      id: application.vacancy.id,
      title: application.vacancy.title,
    },
    applicant: application.applicant,
    status: application.status,
    updatedAt: application.updatedAt,
  };
};

// ============================================================
// Helper: форматирование страницы знаний
// ============================================================

const formatPage = (page: any) => ({
  id: page.id,
  categoryId: page.categoryId,
  category: page.category
    ? {
        id: page.category.id,
        name: page.category.name,
        slug: page.category.slug,
      }
    : null,
  title: page.title,
  content: page.content,
  version: page.version,
  lastEditor: page.lastEditor
    ? {
        id: page.lastEditor.id,
        username: page.lastEditor.username,
        avatarUrl: page.lastEditor.avatarUrl,
      }
    : null,
  createdAt: page.createdAt,
  updatedAt: page.updatedAt,
});

const formatVacancy = (vacancy: any) => ({
  id: vacancy.id,
  title: vacancy.title,
  department: vacancy.department
    ? {
        id: vacancy.department.id,
        name: vacancy.department.name,
      }
    : null,
  description: vacancy.description,
  requirements: vacancy.requirements,
  salary: vacancy.salary,
  status: vacancy.status,
  createdAt: vacancy.createdAt,
  updatedAt: vacancy.updatedAt,
});
