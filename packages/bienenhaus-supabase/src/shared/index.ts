/**
 * @bienenhaus/supabase — Shared Supabase Client + Shared Edge Function Logic
 * ========================================================================
 *
 * This package consolidates:
 * 1. A single Supabase client (eliminates 3 duplicate clients + 3 WS connections)
 * 2. Shared logic ported from supabase/functions/_shared/ (Deno → Node/TS)
 *
 * Usage:
 *   import { supabase, createServerClient } from '@bienenhaus/supabase';           // main client
 *   import { encrypt, decrypt } from '@bienenhaus/supabase/shared/crypto';        // AES-256-GCM
 *   import { getAccessToken, mlCreateItem } from '@bienenhaus/supabase/shared/ml'; // ML API
 *   import { getMlAccessToken, sendQuestionAnswer } from '@bienenhaus/supabase/shared/auto_reply';
 *   import { generateQrCode, processReminders } from '@bienenhaus/supabase/shared/visits';
 *   import { isStaff, checkRateLimit } from '@bienenhaus/supabase/shared/auth';
 */

// Main client
export {
    supabase,
    createServerClient,
    type SupabaseClient,
    type User,
    type AuthChangeEvent,
    type Session,
    getAuthUser,
    getSession,
    signOut,
    onAuthStateChange,
} from '../index.js';

// Shared modules (ported from _shared)
export * from './crypto.js';
export * from './ml.js';
export * from './auth.js';
export * from './auto_reply.js';
export * from './visits.js';