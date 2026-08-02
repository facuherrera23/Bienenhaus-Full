import { useList, useItem, useCreate, useUpdate, useDelete, useMutation, queryKeys } from './api';
import type {
  AdminRole,
  AdminUserRow,
} from '../types/admin';
import {
  ROLE_LABEL,
  ROLE_TONE,
} from '../types/admin';

const ADMIN_USERS_PATH = 'admin_users';

export function useAdminUsers() {
  return useList<AdminUserRow>({
    queryKey: queryKeys.leads([{ admin: true }]),
    path: ADMIN_USERS_PATH,
    select: '*',
    filters: {},
    page: 1,
    pageSize: 50,
    orderBy: 'role',
    ascending: true,
  });
}

export function useAdminUser(id: string | null) {
  return useItem<AdminUserRow>(
    queryKeys.leads([{ admin: id }]),
    ADMIN_USERS_PATH,
    id,
    !!id
  );
}

export function useCreateAdminUser() {
  return useCreate<AdminUserRow, Partial<AdminUserRow>>(
    queryKeys.leads([{ admin: true }]),
    ADMIN_USERS_PATH,
    {
      invalidateKeys: [queryKeys.leads([{ admin: true }])],
    }
  );
}

export function useUpdateAdminUser() {
  return useUpdate<AdminUserRow, Partial<AdminUserRow>>(
    queryKeys.leads([{ admin: true }]),
    ADMIN_USERS_PATH,
    {
      invalidateKeys: [queryKeys.leads([{ admin: true }])],
    }
  );
}

export function useDeleteAdminUser() {
  return useDelete(
    queryKeys.leads([{ admin: true }]),
    ADMIN_USERS_PATH,
    {
      invalidateKeys: [queryKeys.leads([{ admin: true }])],
    }
  );
}

export function useUpdateAdminUserRole() {
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: AdminRole }) => {
      const { updateAdminUserRole } = await import('./adminUsers');
      return updateAdminUserRole(id, role);
    },
  });
}

export function useToggleAdminUserActive() {
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { toggleAdminUserActive } = await import('./adminUsers');
      return toggleAdminUserActive(id, isActive);
    },
  });
}

export function useInviteAdminUser() {
  return useMutation({
    mutationFn: async ({ email, fullName, role }: { email: string; fullName: string; role: AdminRole }) => {
      const { inviteAdminUser } = await import('./adminUsers');
      return inviteAdminUser(email, fullName, role);
    },
  });
}

export function useResetAdminUserPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { resetAdminUserPassword } = await import('./adminUsers');
      return resetAdminUserPassword(email);
    },
  });
}

export function useRemoveAdminUser() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { removeAdminUser } = await import('./adminUsers');
      return removeAdminUser(email);
    },
  });
}

export { queryKeys };
export type { AdminRole, AdminUserRow };
export { ROLE_LABEL, ROLE_TONE };