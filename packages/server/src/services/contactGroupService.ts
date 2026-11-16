// contactGroupService.ts — Сервис для управления группами контактов
// Тикет 1794850879

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateGroupData {
  name: string;
  emoji?: string;
  description?: string;
  memberIds?: string[];
}

export interface UpdateGroupData {
  name?: string;
  emoji?: string;
  description?: string;
}

export interface ContactGroupResponse {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
  memberCount: number;
  previewMemberIds: string[]; // первые 4 memberId для превью
  createdAt: number;
  updatedAt: number;
}

export interface ContactGroupDetailResponse {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
  members: {
    memberId: string;
    addedAt: number;
  }[];
  createdAt: number;
  updatedAt: number;
}

// Создать группу контактов
export const createContactGroup = async (
  ownerId: string,
  data: CreateGroupData,
): Promise<ContactGroupResponse> => {
  const group = await prisma.contactGroup.create({
    data: {
      ownerId,
      name: data.name,
      emoji: data.emoji ?? '👥',
      description: data.description ?? null,
      members: {
        createMany: {
          data: (data.memberIds ?? []).map((memberId) => ({ memberId })),
        },
      },
    },
    select: {
      id: true,
      name: true,
      emoji: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      members: {
        take: 4,
        select: { memberId: true },
      },
      _count: { select: { members: true } },
    },
  });

  return {
    id: group.id,
    name: group.name,
    emoji: group.emoji,
    description: group.description,
    memberCount: group._count.members,
    previewMemberIds: group.members.map((m) => m.memberId),
    createdAt: Number(group.createdAt),
    updatedAt: Number(group.updatedAt),
  };
};

// Получить список групп владельца
export const getContactGroups = async (
  ownerId: string,
): Promise<ContactGroupResponse[]> => {
  const groups = await prisma.contactGroup.findMany({
    where: { ownerId },
    select: {
      id: true,
      name: true,
      emoji: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      members: {
        take: 4,
        select: { memberId: true },
      },
      _count: { select: { members: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    emoji: g.emoji,
    description: g.description,
    memberCount: g._count.members,
    previewMemberIds: g.members.map((m) => m.memberId),
    createdAt: Number(g.createdAt),
    updatedAt: Number(g.updatedAt),
  }));
};

// Получить детальную информацию о группе
export const getContactGroupDetail = async (
  groupId: string,
  ownerId: string,
): Promise<ContactGroupDetailResponse> => {
  const group = await prisma.contactGroup.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      name: true,
      emoji: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      members: {
        select: { memberId: true, addedAt: true },
        orderBy: { addedAt: 'desc' },
      },
    },
  });

  if (!group) {
    throw new Error('Группа не найдена');
  }

  return {
    id: group.id,
    name: group.name,
    emoji: group.emoji,
    description: group.description,
    members: group.members.map((m) => ({
      memberId: m.memberId,
      addedAt: Number(m.addedAt),
    })),
    createdAt: Number(group.createdAt),
    updatedAt: Number(group.updatedAt),
  };
};

// Обновить группу
export const updateContactGroup = async (
  groupId: string,
  ownerId: string,
  data: UpdateGroupData,
): Promise<ContactGroupResponse> => {
  const group = await prisma.contactGroup.update({
    where: { id: groupId, ownerId },
    data: {
      name: data.name,
      emoji: data.emoji,
      description: data.description,
    },
    select: {
      id: true,
      name: true,
      emoji: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      members: {
        take: 4,
        select: { memberId: true },
      },
      _count: { select: { members: true } },
    },
  });

  return {
    id: group.id,
    name: group.name,
    emoji: group.emoji,
    description: group.description,
    memberCount: group._count.members,
    previewMemberIds: group.members.map((m) => m.memberId),
    createdAt: Number(group.createdAt),
    updatedAt: Number(group.updatedAt),
  };
};

// Добавить участника в группу
export const addMemberToGroup = async (
  groupId: string,
  ownerId: string,
  memberId: string,
): Promise<void> => {
  await prisma.contactGroupMember.create({
    data: {
      groupId,
      memberId,
    },
  });
};

// Удалить участника из группы
export const removeMemberFromGroup = async (
  groupId: string,
  ownerId: string,
  memberId: string,
): Promise<void> => {
  await prisma.contactGroupMember.delete({
    where: {
      groupId_memberId: { groupId, memberId },
    },
  });
};

// Удалить группу
export const deleteContactGroup = async (
  groupId: string,
  ownerId: string,
): Promise<void> => {
  await prisma.contactGroup.delete({
    where: { id: groupId, ownerId },
  });
};

// Получить ID всех участников группы (для расширения в StoryAudience)
export const getGroupMemberIds = async (
  groupId: string,
): Promise<string[]> => {
  const members = await prisma.contactGroupMember.findMany({
    where: { groupId },
    select: { memberId: true },
  });
  return members.map((m) => m.memberId);
};
