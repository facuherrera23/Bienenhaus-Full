export type AdminRole = 'super_admin' | 'admin' | 'staff' | 'viewer';

export interface AdminUserRow {
    id: string;
    email: string;
    full_name: string;
    role: AdminRole;
    is_active: boolean;
    must_change_password: boolean;
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
}

export const ROLE_LABEL: Record<AdminRole, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    staff: 'Staff',
    viewer: 'Viewer',
};

export const ROLE_TONE: Record<AdminRole, string> = {
    super_admin: 'danger',
    admin: 'warning',
    staff: 'info',
    viewer: 'neutral',
};
