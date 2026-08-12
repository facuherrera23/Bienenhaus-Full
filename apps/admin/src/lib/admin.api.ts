import { queryKeys, useCreate, useDelete, useItem, useList, useMutation, useUpdate } from './api';
import { type AdminRole, type AdminUserRow , ROLE_LABEL, ROLE_TONE } from '../types/admin';
import {
    deleteAdminUser,
    fetchAdminUser,
    fetchAdminUsers,
    fetchMyAdminUser,
    fetchMyUserId,
    hasRole,
    inviteAdminUser,
    isAdmin,
    isSuperAdmin,
    removeAdminUser,
    resetAdminUserPassword,
    syncAdminUserWithAuth,
    toggleAdminUserActive,
    updateAdminLastLogin,
    updateAdminUser,
    updateAdminUserRole,
} from './admin';

const ADMIN_USERS_PATH = 'admin_users';

// ============================================================
// Query Hooks
// ============================================================

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
    return useItem<AdminUserRow>(queryKeys.leads([{ admin: id }]), ADMIN_USERS_PATH, id, !!id);
}

export function useMyAdminUser() {
    return useMutation({
        mutationFn: async () => {
            return fetchMyAdminUser();
        },
    });
}

export function useMyUserId() {
    return useMutation({
        mutationFn: async () => {
            return fetchMyUserId();
        },
    });
}

// ============================================================
// Mutation Hooks - CRUD
// ============================================================

export function useCreateAdminUser() {
    return useCreate<AdminUserRow, Partial<AdminUserRow>>(
        queryKeys.leads([{ admin: true }]),
        ADMIN_USERS_PATH,
        {
            invalidateKeys: [queryKeys.leads([{ admin: true }])],
        },
    );
}

export function useUpdateAdminUser() {
    return useUpdate<AdminUserRow, Partial<AdminUserRow>>(
        queryKeys.leads([{ admin: true }]),
        ADMIN_USERS_PATH,
        {
            invalidateKeys: [queryKeys.leads([{ admin: true }])],
        },
    );
}

export function useDeleteAdminUser() {
    return useDelete(queryKeys.leads([{ admin: true }]), ADMIN_USERS_PATH, {
        invalidateKeys: [queryKeys.leads([{ admin: true }])],
    });
}

// ============================================================
// Mutation Hooks - Role & Status
// ============================================================

export function useUpdateAdminUserRole() {
    return useMutation({
        mutationFn: async ({ id, role }: { id: string; role: AdminRole }) => {
            return updateAdminUserRole(id, role);
        },
    });
}

export function useToggleAdminUserActive() {
    return useMutation({
        mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
            return toggleAdminUserActive(id, isActive);
        },
    });
}

// ============================================================
// Mutation Hooks - Invite & Reset
// ============================================================

export function useInviteAdminUser() {
    return useMutation({
        mutationFn: async ({
            email,
            fullName,
            role,
        }: {
            email: string;
            fullName: string;
            role: AdminRole;
        }) => {
            return inviteAdminUser({ email, full_name: fullName, role });
        },
    });
}

export function useResetAdminUserPassword() {
    return useMutation({
        mutationFn: async (email: string) => {
            return resetAdminUserPassword(email);
        },
    });
}

export function useRemoveAdminUser() {
    return useMutation({
        mutationFn: async (email: string) => {
            return removeAdminUser(email);
        },
    });
}

// ============================================================
// Mutation Hooks - Auth Helpers
// ============================================================

export function useUpdateAdminLastLogin() {
    return useMutation({
        mutationFn: async (userId: string) => {
            return updateAdminLastLogin(userId);
        },
    });
}

export function useIsAdmin() {
    return useMutation({
        mutationFn: async (userId: string) => {
            return isAdmin(userId);
        },
    });
}

export function useIsSuperAdmin() {
    return useMutation({
        mutationFn: async (userId: string) => {
            return isSuperAdmin(userId);
        },
    });
}

export function useHasRole() {
    return useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: AdminRole }) => {
            return hasRole(userId, role);
        },
    });
}

export function useSyncAdminUserWithAuth() {
    return useMutation({
        mutationFn: async (userId: string) => {
            return syncAdminUserWithAuth(userId);
        },
    });
}

// ============================================================
// Export Direct Functions (for components that don't use hooks)
// ============================================================

export {
    fetchAdminUsers,
    fetchAdminUser,
    fetchMyUserId,
    fetchMyAdminUser,
    updateAdminUser,
    updateAdminUserRole,
    toggleAdminUserActive,
    deleteAdminUser,
    inviteAdminUser,
    resetAdminUserPassword,
    removeAdminUser,
    updateAdminLastLogin,
    isAdmin,
    isSuperAdmin,
    hasRole,
    syncAdminUserWithAuth,
};

// ============================================================
// Re-export
// ============================================================

export { queryKeys };
export type { AdminRole, AdminUserRow };
export { ROLE_LABEL, ROLE_TONE };
