/**
 * @deprecated Este archivo ha sido unificado con admin.ts
 * Por favor, importa desde './admin' en lugar de './adminUsers'
 *
 * Este archivo se mantiene por compatibilidad con imports existentes
 * y será eliminado en una versión futura.
 */

import {
    type AdminRole,
    type AdminUserRow,
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
    ROLE_LABEL,
    ROLE_TONE,
    syncAdminUserWithAuth,
    toggleAdminUserActive,
    updateAdminLastLogin,
    updateAdminUser,
    updateAdminUserRole,
} from './admin';

// ============================================================
// Re-export all types and functions from admin.ts
// ============================================================

export type { AdminRole, AdminUserRow };
export { ROLE_LABEL, ROLE_TONE };

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
// Deprecation Warning (solo en desarrollo)
// ============================================================

if (import.meta.env.DEV) {
    console.warn(
        '[adminUsers.ts] ⚠️ Este archivo está obsoleto. Por favor, importa desde "./admin" en su lugar.',
    );
}
