import { describe, it, expect } from 'vitest';
import {
  validatePropertyCreate,
  validatePropertyForm,
  validateLeadForm,
  validateVisitForm,
  validateAgentSchedule,
  validateNewsletterSubscriber,
  validateAdminUser,
  validateUserRegistration,
  validateUserLogin,
  validateUserPasswordUpdate,
  validateChatMessage,
  validateAgentPermissions,
} from '../validators';

describe('Property validation', () => {
  it('accepts a valid venta property with price', () => {
    const result = validatePropertyCreate({
      title: 'Casa en el centro',
      status: 'borrador',
      listing_type: 'venta',
      price: 150000,
      currency: 'USD',
    });
    expect(result.success).toBe(true);
  });

  it('rejects venta property without price', () => {
    const result = validatePropertyCreate({
      title: 'Casa en el centro',
      status: 'borrador',
      listing_type: 'venta',
      currency: 'USD',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'price')).toBe(true);
      expect(result.error.issues.some((i) => i.message.includes('precio es obligatorio'))).toBe(true);
    }
  });

  it('rejects title shorter than 3 characters', () => {
    const result = validatePropertyForm({
      title: 'Ca',
      status: 'borrador',
      listing_type: 'venta',
      currency: 'USD',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'title')).toBe(true);
    }
  });

  it('rejects negative price', () => {
    const result = validatePropertyForm({
      title: 'Casa válida',
      status: 'borrador',
      listing_type: 'venta',
      price: -100,
      currency: 'USD',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'price')).toBe(true);
    }
  });

  it('applies default currency USD when omitted', () => {
    const result = validatePropertyForm({
      title: 'Casa válida',
      status: 'borrador',
      listing_type: 'venta',
      price: 100,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe('USD');
      expect(result.data.featured).toBe(false);
    }
  });
});

describe('Lead validation', () => {
  it('accepts a valid lead', () => {
    const result = validateLeadForm({
      name: 'Juan',
      last_name: 'Pérez',
      email: 'juan@test.com',
      intent: 'comprar',
      source: 'landing_form',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('nuevo');
      expect(result.data.assigned_to).toBe('');
    }
  });

  it('accepts a valid uuid assigned_to', () => {
    const result = validateLeadForm({
      name: 'Juan',
      last_name: 'Pérez',
      email: 'juan@test.com',
      intent: 'comprar',
      source: 'landing_form',
      assigned_to: '00000000-0000-4000-8000-000000000000',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assigned_to).toBe('00000000-0000-4000-8000-000000000000');
    }
  });

  it('rejects invalid assigned_to uuid', () => {
    const result = validateLeadForm({
      name: 'Juan',
      last_name: 'Pérez',
      email: 'juan@test.com',
      intent: 'comprar',
      source: 'landing_form',
      assigned_to: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'assigned_to')).toBe(true);
    }
  });

  it('rejects invalid email', () => {
    const result = validateLeadForm({
      name: 'Juan',
      last_name: 'Pérez',
      email: 'no-es-un-email',
      intent: 'comprar',
      source: 'landing_form',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('Email inválido'))).toBe(true);
    }
  });

  it('rejects missing name', () => {
    const result = validateLeadForm({
      name: '',
      last_name: 'Pérez',
      email: 'juan@test.com',
      intent: 'comprar',
      source: 'landing_form',
    });
    expect(result.success).toBe(false);
  });
});

describe('Visit validation', () => {
  it('accepts a valid visit', () => {
    const result = validateVisitForm({
      title: 'Visita a casa',
      agent_id: '00000000-0000-4000-8000-000000000000',
      starts_at: '2026-08-10T15:00:00Z',
      ends_at: '2026-08-10T16:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects ends_at before starts_at', () => {
    const result = validateVisitForm({
      title: 'Visita a casa',
      agent_id: '00000000-0000-4000-8000-000000000000',
      starts_at: '2026-08-10T16:00:00Z',
      ends_at: '2026-08-10T15:00:00Z',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('posterior'))).toBe(true);
    }
  });

  it('rejects invalid agent uuid', () => {
    const result = validateVisitForm({
      title: 'Visita a casa',
      agent_id: 'no-valid',
      starts_at: '2026-08-10T15:00:00Z',
      ends_at: '2026-08-10T16:00:00Z',
    });
    expect(result.success).toBe(false);
  });
});

describe('Agent schedule validation', () => {
  it('accepts a valid schedule with HH:MM format', () => {
    const result = validateAgentSchedule([
      { day_of_week: 1, start_time: '09:00', end_time: '18:00', is_available: true },
    ]);
    expect(result.success).toBe(true);
  });

  it('rejects invalid time format', () => {
    const result = validateAgentSchedule([
      { day_of_week: 1, start_time: '25:99', end_time: '18:00', is_available: true },
    ]);
    expect(result.success).toBe(false);
  });

  it('rejects day_of_week out of range', () => {
    const result = validateAgentSchedule([
      { day_of_week: 7, start_time: '09:00', end_time: '18:00', is_available: true },
    ]);
    expect(result.success).toBe(false);
  });
});

describe('Newsletter validation', () => {
  it('accepts a valid subscriber', () => {
    const result = validateNewsletterSubscriber({ email: 'sus@test.com' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.source).toBe('manual');
      expect(result.data.status).toBe('active');
    }
  });

  it('rejects invalid email', () => {
    const result = validateNewsletterSubscriber({ email: 'nope' });
    expect(result.success).toBe(false);
  });
});

describe('Admin user validation', () => {
  it('accepts a valid admin user', () => {
    const result = validateAdminUser({
      email: 'admin@bienenhaus.com',
      full_name: 'Admin',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe('viewer');
    }
  });

  it('rejects missing full_name', () => {
    const result = validateAdminUser({ email: 'admin@bienenhaus.com', full_name: '' });
    expect(result.success).toBe(false);
  });
});

describe('Auth validation', () => {
  it('accepts matching passwords on registration', () => {
    const result = validateUserRegistration({
      email: 'user@test.com',
      password: 'password123',
      confirm_password: 'password123',
      full_name: 'User Test',
    });
    expect(result.success).toBe(true);
  });

  it('rejects mismatched passwords on registration', () => {
    const result = validateUserRegistration({
      email: 'user@test.com',
      password: 'password123',
      confirm_password: 'password456',
      full_name: 'User Test',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('no coinciden'))).toBe(true);
    }
  });

  it('rejects password shorter than 8 characters', () => {
    const result = validateUserRegistration({
      email: 'user@test.com',
      password: 'short',
      confirm_password: 'short',
      full_name: 'User Test',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid login', () => {
    const result = validateUserLogin({ email: 'admin@bienenhaus.com', password: 'x' });
    expect(result.success).toBe(true);
  });

  it('rejects empty password on login', () => {
    const result = validateUserLogin({ email: 'admin@bienenhaus.com', password: '' });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched new passwords on update', () => {
    const result = validateUserPasswordUpdate({
      current_password: 'old',
      new_password: 'newpassword1',
      confirm_new_password: 'newpassword2',
    });
    expect(result.success).toBe(false);
  });
});

describe('Chat message validation', () => {
  it('accepts a valid message', () => {
    const result = validateChatMessage({ content: 'Hola' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message_type).toBe('text');
    }
  });

  it('rejects empty message', () => {
    const result = validateChatMessage({ content: '' });
    expect(result.success).toBe(false);
  });
});

describe('Agent permissions validation', () => {
  it('applies sensible defaults', () => {
    const result = validateAgentPermissions({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.can_view_leads).toBe(true);
      expect(result.data.can_edit_properties).toBe(false);
      expect(result.data.can_manage_settings).toBe(false);
    }
  });

  it('rejects non-boolean values', () => {
    const result = validateAgentPermissions({ can_view_leads: 'yes' as unknown as boolean });
    expect(result.success).toBe(false);
  });
});
