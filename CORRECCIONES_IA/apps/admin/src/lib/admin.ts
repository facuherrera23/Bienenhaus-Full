import { supabase, supabaseUrl } from './supabase';

// ============================================================
// Types
// ============================================================

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

// ============================================================
// Constants
// ============================================================

export const ADMIN_ROLE_LABEL: Record<AdminRole, string> = {
    super_admin: 'Super Admin',
    admin: 'Administrador',
    staff: 'Staff',
    viewer: 'Solo lectura',
};

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

// ============================================================
// API Functions - Fetch
// ============================================================

export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
    const { data, error } = await supabase
        .from('admin_users')
        .select(
            'id, email, full_name, role, is_active, must_change_password, last_login_at, created_at, updated_at',
        )
        .order('role', { ascending: true })
        .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as AdminUserRow[];
}

export async function fetchAdminUser(id: string): Promise<AdminUserRow> {
    const { data, error } = await supabase
        .from('admin_users')
        .select(
            'id, email, full_name, role, is_active, must_change_password, last_login_at, created_at, updated_at',
        )
        .eq('id', id)
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Usuario administrador no encontrado');
    return data as AdminUserRow;
}

export async function fetchMyUserId(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id ?? null;
}

export async function fetchMyAdminUser(): Promise<AdminUserRow | null> {
    const userId = await fetchMyUserId();
    if (!userId) return null;
    try {
        return await fetchAdminUser(userId);
    } catch {
        return null;
    }
}

// ============================================================
// API Functions - CRUD
// ============================================================

export async function updateAdminUser(
    id: string,
    patch: { role?: AdminRole; is_active?: boolean; full_name?: string },
): Promise<void> {
    const { error } = await supabase.from('admin_users').update(patch).eq('id', id);

    if (error) throw new Error(error.message);
}

export async function updateAdminUserRole(id: string, role: AdminRole): Promise<void> {
    const { error } = await supabase.from('admin_users').update({ role }).eq('id', id);

    if (error) throw new Error(error.message);
}

export async function toggleAdminUserActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
        .from('admin_users')
        .update({ is_active: isActive })
        .eq('id', id);

    if (error) throw new Error(error.message);
}

export async function deleteAdminUser(id: string): Promise<void> {
    const { error } = await supabase.from('admin_users').delete().eq('id', id);

    if (error) throw new Error(error.message);
}

// ============================================================
// API Functions - Edge Functions (Invite, Reset, Remove)
// ============================================================

interface EdgeResult {
    ok?: boolean;
    error?: string;
    link?: string | null;
    user_id?: string;
}

async function callAdminEdge(payload: Record<string, unknown>): Promise<EdgeResult> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error('Sin sesión activa');

    const res = await fetch(`${supabaseUrl}/functions/v1/admin-user-invite`, {
        method: 'POST',
        headers: {
            authorization: `Bearer ${token}`,
            'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const body = (await res.json().catch(() => ({}))) as EdgeResult;
    if (!res.ok) throw new Error(body.error ?? `Error (${res.status})`);
    return body;
}

export async function inviteAdminUser(input: {
    email: string;
    full_name: string;
    role: AdminRole;
}): Promise<{ user_id: string; link: string | null }> {
    const res = await callAdminEdge({ action: 'invite', ...input });
    return { user_id: res.user_id ?? '', link: res.link ?? null };
}

export async function resetAdminUserPassword(email: string): Promise<{ link: string | null }> {
    const res = await callAdminEdge({ action: 'reset', email });
    return { link: res.link ?? null };
}

export async function removeAdminUser(email: string): Promise<void> {
    await callAdminEdge({ action: 'remove', email });
}

// ============================================================
// API Functions - Auth Helpers
// ============================================================

export async function updateAdminLastLogin(userId: string): Promise<void> {
    const { error } = await supabase
        .from('admin_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId);

    if (error) throw new Error(error.message);
}

export async function isAdmin(userId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return false;
    return data.role === 'super_admin' || data.role === 'admin';
}

export async function isSuperAdmin(userId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return false;
    return data.role === 'super_admin';
}

export async function hasRole(userId: string, role: AdminRole): Promise<boolean> {
    const { data, error } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return false;
    return data.role === role;
}

// ============================================================
// API Functions - Sync with Auth
// ============================================================

export async function syncAdminUserWithAuth(userId: string): Promise<void> {
    // Obtener datos del usuario de auth
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
    if (authError) throw new Error(authError.message);

    const authUser = authData.user;
    if (!authUser) throw new Error('Usuario no encontrado en Auth');

    // Verificar si existe en admin_users
    const { data: existing, error: checkError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

    if (checkError && checkError.message !== 'No rows found') {
        throw new Error(checkError.message);
    }

    if (!existing) {
        // Crear en admin_users
        const { error: insertError } = await supabase.from('admin_users').insert({
            id: userId,
            email: authUser.email!,
            full_name:
                authUser.user_metadata?.full_name ?? authUser.email?.split('@')[0] ?? 'Usuario',
            role: 'viewer',
            is_active: true,
            must_change_password: false,
        });

        if (insertError) throw new Error(insertError.message);
    } else {
        // Actualizar email y nombre si cambiaron
        const updates: Partial<AdminUserRow> = {};
        if (authUser.email) updates.email = authUser.email;
        if (authUser.user_metadata?.full_name) updates.full_name = authUser.user_metadata.full_name;

        if (Object.keys(updates).length > 0) {
            const { error: updateError } = await supabase
                .from('admin_users')
                .update(updates)
                .eq('id', userId);

            if (updateError) throw new Error(updateError.message);
        }
    }
}

// ============================================================
// Export Direct Functions (for compatibility)
// ============================================================

// Mantener exports para compatibilidad con código existente
export { callAdminEdge as _callAdminEdge };

// ============================================================
// Re-export types (para compatibilidad)
// ============================================================

export type { AdminRole as AdminRoleType };
