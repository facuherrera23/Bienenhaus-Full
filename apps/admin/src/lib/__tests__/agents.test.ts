import { afterEach , beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { supabase } from '../supabase';
import { from } from '../../test/setup';
import {
    type  AgentApiRow,
    calculateCommission,
    createAgent,
    deleteAgentPhoto,
    fetchAgent,
    fetchAgents,
    fetchDeletedAgents,
    getAgentAvailabilityStatus,
    getAgentPermissions,
    getAgentWorkingHours,
    isAgentAvailable,
    permanentDeleteAgent,
    restoreAgent,
    softDeleteAgent,
    toFormValues,
    toRow,
    updateAgent,
    updateAgentCommission,
    updateAgentPermissions,
    updateAgentSchedule,
uploadAgentPhoto } from '../agents';
import {
    type  AgentRow,
    type  AgentSchedule,
    DAY_LABELS,
    DEFAULT_COMMISSION,
DEFAULT_PERMISSIONS,DEFAULT_SCHEDULE } from '../../types/agents';

function buildChain(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        returns: vi.fn().mockReturnThis(),
        ...overrides,
    };
}

function mockFrom(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    const chain = buildChain(overrides);
    (from as unknown as Mock).mockReturnValue(chain);
    return chain;
}

const agentRow: AgentRow = {
    id: 'a1',
    name: 'Ana Gómez',
    email: 'ana@bienenhaus.com.ar',
    phone: '+5491100000000',
    photo_url: 'https://cdn.example.com/agent-photos/ana.jpg',
    matricula: 'C-1234',
    role: 'Asesora',
    bio: 'Especialista en propiedades de lujo',
    specialties: ['Departamentos', 'PH'],
    social: { linkedin: 'https://linkedin.com/in/ana', instagram: 'https://instagram.com/ana' },
    is_active: true,
    sort_order: 1,
    lead_count: 5,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    permissions: { ...DEFAULT_PERMISSIONS },
    commission: { ...DEFAULT_COMMISSION },
    schedule: [{ ...DEFAULT_SCHEDULE[0] }],
};

function apiRow(overrides: Record<string, unknown> = {}): AgentApiRow {
    return {
        id: 'a1',
        name: 'Ana Gómez',
        email: 'ana@bienenhaus.com.ar',
        phone: '+5491100000000',
        photo_url: 'https://cdn.example.com/agent-photos/ana.jpg',
        matricula: 'C-1234',
        role: 'Asesora',
        bio: 'Especialista en propiedades de lujo',
        specialties: ['Departamentos', 'PH', 42, null],
        social: { linkedin: 'https://linkedin.com/in/ana', other: 'ignored' },
        is_active: true,
        sort_order: 1,
        leads: [{ count: 5 }],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        ...overrides,
    } as unknown as AgentApiRow;
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('toRow (mapper)', () => {
    it('mapea una fila de API a AgentRow', () => {
        const row = toRow(apiRow());

        expect(row).toMatchObject({
            id: 'a1',
            name: 'Ana Gómez',
            lead_count: 5,
        });
        // Filtra elementos no-string de specialties
        expect(row.specialties).toEqual(['Departamentos', 'PH']);
        // Solo extrae las redes sociales conocidas
        expect(row.social).toEqual({
            linkedin: 'https://linkedin.com/in/ana',
            instagram: undefined,
            whatsapp: undefined,
        });
        // Usa defaults cuando permissions/commission/schedule no vienen
        expect(row.permissions).toEqual(DEFAULT_PERMISSIONS);
        expect(row.commission).toEqual(DEFAULT_COMMISSION);
        expect(row.schedule).toEqual(DEFAULT_SCHEDULE);
    });

    it('respeta permissions, commission y schedule cuando vienen en la fila', () => {
        const permissions = { ...DEFAULT_PERMISSIONS, can_edit_properties: true };
        const commission = { sale_percentage: 10, rental_percentage: 20, fixed_per_sale: 500 };
        const schedule: AgentSchedule[] = [
            { day_of_week: 1, start_time: '08:00', end_time: '16:00', is_available: true },
        ];

        const row = toRow(apiRow({ permissions, commission, schedule }));

        expect(row.permissions).toEqual(permissions);
        expect(row.commission).toEqual(commission);
        expect(row.schedule).toEqual(schedule);
    });

    it('tolera specialties/social nulos y leads vacío', () => {
        const row = toRow(apiRow({ specialties: null, social: null, leads: [] }));

        expect(row.specialties).toEqual([]);
        expect(row.social).toEqual({ linkedin: undefined, instagram: undefined, whatsapp: undefined });
        expect(row.lead_count).toBe(0);
    });
});

describe('fetchAgents', () => {
    it('consulta agentes activos ordenados y mapea a AgentRow', async () => {
        const chain = mockFrom({
            returns: vi.fn().mockResolvedValue({ data: [apiRow()], error: null }),
        });

        const rows = await fetchAgents();

        expect(from).toHaveBeenCalledWith('agents');
        expect(chain.select).toHaveBeenCalledWith(expect.stringContaining('leads(count)'));
        expect(chain.is).toHaveBeenCalledWith('deleted_at', null);
        expect(chain.order).toHaveBeenCalledWith('sort_order', { ascending: true });
        expect(chain.order).toHaveBeenCalledWith('name', { ascending: true });
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({ id: 'a1', name: 'Ana Gómez' });
    });

    it('lanza error si la consulta falla', async () => {
        mockFrom({
            returns: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'agents err' },
            }),
        });

        await expect(fetchAgents()).rejects.toThrow('agents err');
    });
});

describe('fetchAgent', () => {
    it('devuelve el agente por id', async () => {
        const chain = mockFrom({ maybeSingle: vi.fn().mockResolvedValue({ data: apiRow(), error: null }) });

        const row = await fetchAgent('a1');

        expect(from).toHaveBeenCalledWith('agents');
        expect(chain.eq).toHaveBeenCalledWith('id', 'a1');
        expect(row.id).toBe('a1');
    });

    it('lanza "Agente no encontrado" si no hay data', async () => {
        mockFrom({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) });

        await expect(fetchAgent('a1')).rejects.toThrow('Agente no encontrado');
    });

    it('lanza error si la consulta falla', async () => {
        mockFrom({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }) });

        await expect(fetchAgent('a1')).rejects.toThrow('boom');
    });
});

describe('fetchDeletedAgents', () => {
    it('consulta agentes eliminados ordenados por deleted_at desc', async () => {
        const chain = mockFrom({
            returns: vi.fn().mockResolvedValue({ data: [apiRow()], error: null }),
        });

        const rows = await fetchDeletedAgents();

        expect(from).toHaveBeenCalledWith('agents');
        expect(chain.not).toHaveBeenCalledWith('deleted_at', 'is', null);
        expect(chain.order).toHaveBeenCalledWith('deleted_at', { ascending: false });
        expect(rows).toHaveLength(1);
    });

    it('lanza error si la consulta falla', async () => {
        mockFrom({
            returns: vi.fn().mockResolvedValue({ data: null, error: { message: 'deleted err' } }),
        });

        await expect(fetchDeletedAgents()).rejects.toThrow('deleted err');
    });
});

describe('uploadAgentPhoto', () => {
    function mockStorageBucket(overrides: Record<string, unknown> = {}) {
        const bucket = {
            upload: vi.fn().mockResolvedValue({ data: { path: 'uuid.png' }, error: null }),
            remove: vi.fn().mockResolvedValue({ error: null }),
            getPublicUrl: vi.fn(() => ({
                data: { publicUrl: 'https://cdn.example.com/uuid.png' },
            })),
            list: vi.fn().mockResolvedValue({ data: [], error: null }),
            ...overrides,
        };
        (supabase.storage.from as unknown as Mock).mockReturnValue(bucket);
        return bucket;
    }

    it('sube la foto y devuelve la URL pública', async () => {
        const bucket = mockStorageBucket();
        const file = new File(['foto'], 'foto.png');

        const url = await uploadAgentPhoto(file);

        expect(supabase.storage.from).toHaveBeenCalledWith('agent-photos');
        expect(bucket.upload).toHaveBeenCalledWith(expect.stringMatching(/^[0-9a-f-]{36}\.png$/), file, {
            upsert: false,
        });
        expect(url).toBe('https://cdn.example.com/uuid.png');
    });

    it('usa extensión jpg por defecto cuando el nombre termina en punto', async () => {
        const bucket = mockStorageBucket();
        const file = new File(['foto'], 'foto.');

        await uploadAgentPhoto(file);

        expect(bucket.upload).toHaveBeenCalledWith(expect.stringMatching(/\.jpg$/), file, { upsert: false });
    });

    it('lanza error si el upload falla', async () => {
        mockStorageBucket({ upload: vi.fn().mockResolvedValue({ data: null, error: { message: 'upload fail' } }) });
        const file = new File(['foto'], 'foto.jpg');

        await expect(uploadAgentPhoto(file)).rejects.toThrow('upload fail');
    });
});

describe('deleteAgentPhoto', () => {
    it('elimina la foto del storage cuando la URL apunta al bucket', async () => {
        const bucket = {
            remove: vi.fn().mockResolvedValue({ error: null }),
        };
        (supabase.storage.from as unknown as Mock).mockReturnValue(bucket);

        await deleteAgentPhoto('https://cdn.example.com/agent-photos/ana.jpg?token=abc');

        expect(bucket.remove).toHaveBeenCalledWith(['ana.jpg']);
    });

    it('no elimina nada cuando la URL no pertenece al bucket', async () => {
        const bucket = {
            remove: vi.fn().mockResolvedValue({ error: null }),
        };
        (supabase.storage.from as unknown as Mock).mockReturnValue(bucket);

        await deleteAgentPhoto('https://other.com/img.jpg');

        expect(bucket.remove).not.toHaveBeenCalled();
    });

    it('traga errores del storage', async () => {
        const bucket = {
            remove: vi.fn().mockRejectedValue(new Error('storage down')),
        };
        (supabase.storage.from as unknown as Mock).mockReturnValue(bucket);

        await expect(
            deleteAgentPhoto('https://cdn.example.com/agent-photos/ana.jpg'),
        ).resolves.toBeUndefined();
    });
});

describe('createAgent', () => {
    it('inserta el agente limpio y devuelve el id', async () => {
        const chain = mockFrom({ single: vi.fn().mockResolvedValue({ data: { id: 'new-1' }, error: null }) });

        const id = await createAgent({
            name: '  Juan Pérez ',
            email: ' juan@bienenhaus.com.ar ',
            phone: ' +54911 ',
            matricula: '',
            role: ' Asesor ',
            bio: '  ',
            specialties: ' Departamentos , PH , ',
            linkedin: ' https://linkedin.com/in/juan ',
            instagram: '',
            whatsapp: '',
            is_active: true,
            sort_order: '3',
            photo_url: '',
        });

        expect(chain.insert).toHaveBeenCalledWith({
            name: 'Juan Pérez',
            email: 'juan@bienenhaus.com.ar',
            phone: '+54911',
            matricula: null,
            role: 'Asesor',
            bio: null,
            specialties: ['Departamentos', 'PH'],
            social: { linkedin: 'https://linkedin.com/in/juan' },
            is_active: true,
            sort_order: 3,
            photo_url: null,
        });
        expect(chain.select).toHaveBeenCalledWith('id');
        expect(id).toBe('new-1');
    });

    it('lanza error si el insert falla', async () => {
        mockFrom({ single: vi.fn().mockResolvedValue({ data: null, error: { message: 'insert fail' } }) });

        await expect(
            createAgent({
                name: 'A',
                email: 'a@a.com',
                phone: '',
                matricula: '',
                role: '',
                bio: '',
                specialties: '',
                linkedin: '',
                instagram: '',
                whatsapp: '',
                is_active: true,
                sort_order: '0',
                photo_url: '',
            }),
        ).rejects.toThrow('insert fail');
    });
});

describe('updateAgent', () => {
    it('actualiza el agente con los campos limpios', async () => {
        const chain = mockFrom();

        await updateAgent('a1', {
            name: ' Ana ',
            email: ' ana@a.com ',
            phone: '',
            matricula: 'C-99',
            role: '',
            bio: 'Bio',
            specialties: 'Casa',
            linkedin: '',
            instagram: '',
            whatsapp: 'wa.me/11',
            is_active: false,
            sort_order: '2',
            photo_url: 'https://cdn.example.com/p.jpg',
        });

        expect(chain.update).toHaveBeenCalledWith({
            name: 'Ana',
            email: 'ana@a.com',
            phone: null,
            matricula: 'C-99',
            role: null,
            bio: 'Bio',
            specialties: ['Casa'],
            social: { whatsapp: 'wa.me/11' },
            is_active: false,
            sort_order: 2,
            photo_url: 'https://cdn.example.com/p.jpg',
        });
        expect(chain.eq).toHaveBeenCalledWith('id', 'a1');
    });

    it('lanza error si el update falla', async () => {
        mockFrom({ eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'update fail' } }) });

        await expect(
            updateAgent('a1', {
                name: 'A',
                email: 'a@a.com',
                phone: '',
                matricula: '',
                role: '',
                bio: '',
                specialties: '',
                linkedin: '',
                instagram: '',
                whatsapp: '',
                is_active: true,
                sort_order: '0',
                photo_url: '',
            }),
        ).rejects.toThrow('update fail');
    });
});

describe('toFormValues', () => {
    it('convierte un AgentRow a valores de formulario', () => {
        const form = toFormValues(agentRow);

        expect(form).toEqual({
            name: 'Ana Gómez',
            email: 'ana@bienenhaus.com.ar',
            phone: '+5491100000000',
            matricula: 'C-1234',
            role: 'Asesora',
            bio: 'Especialista en propiedades de lujo',
            specialties: 'Departamentos, PH',
            linkedin: 'https://linkedin.com/in/ana',
            instagram: 'https://instagram.com/ana',
            whatsapp: '',
            is_active: true,
            sort_order: '1',
            photo_url: 'https://cdn.example.com/agent-photos/ana.jpg',
        });
    });

    it('tolera campos nulos y redes sociales ausentes', () => {
        const form = toFormValues({ ...agentRow, phone: null, matricula: null, social: {} });

        expect(form.phone).toBe('');
        expect(form.matricula).toBe('');
        expect(form.whatsapp).toBe('');
    });
});

describe('softDeleteAgent / restoreAgent', () => {
    it('softDeleteAgent setea deleted_at y filtra por id', async () => {
        const chain = mockFrom();

        await softDeleteAgent('a1');

        expect(chain.update).toHaveBeenCalledWith({ deleted_at: expect.any(String) });
        expect(chain.eq).toHaveBeenCalledWith('id', 'a1');
    });

    it('restoreAgent limpia deleted_at', async () => {
        const chain = mockFrom();

        await restoreAgent('a1');

        expect(chain.update).toHaveBeenCalledWith({ deleted_at: null });
        expect(chain.eq).toHaveBeenCalledWith('id', 'a1');
    });

    it('lanza error si el soft delete falla', async () => {
        mockFrom({ eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'sd fail' } }) });

        await expect(softDeleteAgent('a1')).rejects.toThrow('sd fail');
    });
});

describe('permanentDeleteAgent', () => {
    function mockStorageBucket() {
        const bucket = {
            remove: vi.fn().mockResolvedValue({ error: null }),
        };
        (supabase.storage.from as unknown as Mock).mockReturnValue(bucket);
        return bucket;
    }

    it('borra la foto del storage y luego la fila', async () => {
        const chain = mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({
                data: { photo_url: 'https://cdn.example.com/agent-photos/ana.jpg' },
                error: null,
            }),
        });
        const bucket = mockStorageBucket();

        await permanentDeleteAgent('a1');

        expect(chain.select).toHaveBeenCalledWith('photo_url');
        expect(bucket.remove).toHaveBeenCalledWith(['ana.jpg']);
        expect(chain.delete).toHaveBeenCalled();
        expect(chain.eq).toHaveBeenCalledWith('id', 'a1');
    });

    it('no toca storage si no hay foto en el bucket', async () => {
        mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({
                data: { photo_url: 'https://other.com/img.jpg' },
                error: null,
            }),
        });
        const bucket = mockStorageBucket();

        await permanentDeleteAgent('a1');

        expect(bucket.remove).not.toHaveBeenCalled();
    });

    it('lanza error si el delete falla', async () => {
        mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: { photo_url: null }, error: null }),
            delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'perm fail' } }),
            }),
        });
        mockStorageBucket();

        await expect(permanentDeleteAgent('a1')).rejects.toThrow('perm fail');
    });
});

describe('updateAgentPermissions', () => {
    it('fusiona los permisos existentes con los nuevos', async () => {
        const chain = mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({
                data: apiRow({ permissions: { ...DEFAULT_PERMISSIONS, can_edit_properties: true } }),
                error: null,
            }),
        });

        await updateAgentPermissions('a1', { can_view_reports: true });

        expect(chain.update).toHaveBeenCalledWith({
            permissions: expect.objectContaining({ can_edit_properties: true, can_view_reports: true }),
        });
        expect(chain.eq).toHaveBeenCalledWith('id', 'a1');
    });
});

describe('getAgentPermissions', () => {
    it('devuelve los permisos del agente', async () => {
        const permissions = { ...DEFAULT_PERMISSIONS, can_manage_ml: true };
        const chain = mockFrom({ single: vi.fn().mockResolvedValue({ data: { permissions }, error: null }) });

        await expect(getAgentPermissions('a1')).resolves.toEqual(permissions);

        expect(chain.select).toHaveBeenCalledWith('permissions');
        expect(chain.eq).toHaveBeenCalledWith('id', 'a1');
    });

    it('devuelve DEFAULT_PERMISSIONS cuando no hay data', async () => {
        mockFrom({ single: vi.fn().mockResolvedValue({ data: null, error: null }) });

        await expect(getAgentPermissions('a1')).resolves.toEqual(DEFAULT_PERMISSIONS);
    });
});

describe('updateAgentCommission', () => {
    it('fusiona la comisión existente con la nueva', async () => {
        const chain = mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({
                data: apiRow({ commission: { sale_percentage: 10, rental_percentage: 20 } }),
                error: null,
            }),
        });

        await updateAgentCommission('a1', { fixed_per_sale: 500 });

        expect(chain.update).toHaveBeenCalledWith({
            commission: { sale_percentage: 10, rental_percentage: 20, fixed_per_sale: 500 },
        });
    });
});

describe('calculateCommission', () => {
    async function mockAgentCommission(commission: Record<string, unknown>) {
        mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({
                data: apiRow({ commission }),
                error: null,
            }),
        });
    }

    it('calcula porcentaje + fijo para venta', async () => {
        await mockAgentCommission({ sale_percentage: 10, rental_percentage: 5, fixed_per_sale: 100 });

        await expect(calculateCommission('a1', 'sale', 10000)).resolves.toBe(1100);
    });

    it('calcula solo porcentaje para alquiler', async () => {
        await mockAgentCommission({ sale_percentage: 10, rental_percentage: 5 });

        await expect(calculateCommission('a1', 'rental', 20000)).resolves.toBe(1000);
    });

    it('aplica la comisión mínima', async () => {
        await mockAgentCommission({
            sale_percentage: 10,
            rental_percentage: 5,
            min_commission: 500,
        });

        await expect(calculateCommission('a1', 'sale', 1000)).resolves.toBe(500);
    });

    it('aplica la comisión máxima', async () => {
        await mockAgentCommission({
            sale_percentage: 10,
            rental_percentage: 5,
            max_commission: 5000,
        });

        await expect(calculateCommission('a1', 'sale', 100000)).resolves.toBe(5000);
    });

    it('redondea a 2 decimales', async () => {
        await mockAgentCommission({ sale_percentage: 33, rental_percentage: 5 });

        await expect(calculateCommission('a1', 'sale', 9999)).resolves.toBe(3299.67);
    });
});

describe('updateAgentSchedule', () => {
    it('actualiza el schedule serializado a JSON', async () => {
        const chain = mockFrom();
        const schedule: AgentSchedule[] = [
            { day_of_week: 1, start_time: '09:00', end_time: '18:00', is_available: true },
        ];

        await updateAgentSchedule('a1', schedule);

        expect(chain.update).toHaveBeenCalledWith({ schedule });
        expect(chain.eq).toHaveBeenCalledWith('id', 'a1');
    });
});

describe('isAgentAvailable', () => {
    function scheduleAgent(schedule: AgentSchedule[]) {
        mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({
                data: apiRow({ schedule }),
                error: null,
            }),
        });
    }

    it('devuelve true dentro del horario laboral', async () => {
        scheduleAgent([
            { day_of_week: 1, start_time: '09:00', end_time: '18:00', is_available: true },
        ]);

        await expect(isAgentAvailable('a1', new Date('2024-01-15T10:00:00'))).resolves.toBe(true);
    });

    it('devuelve false fuera del horario', async () => {
        scheduleAgent([
            { day_of_week: 1, start_time: '09:00', end_time: '18:00', is_available: true },
        ]);

        await expect(isAgentAvailable('a1', new Date('2024-01-15T08:00:00'))).resolves.toBe(false);
    });

    it('devuelve false durante el break', async () => {
        scheduleAgent([
            {
                day_of_week: 1,
                start_time: '09:00',
                end_time: '18:00',
                is_available: true,
                break_start: '12:00',
                break_end: '13:00',
            },
        ]);

        await expect(isAgentAvailable('a1', new Date('2024-01-15T12:30:00'))).resolves.toBe(false);
    });

    it('devuelve false si el día no está agendado o está deshabilitado', async () => {
        scheduleAgent([
            { day_of_week: 0, start_time: '09:00', end_time: '13:00', is_available: false },
        ]);

        await expect(isAgentAvailable('a1', new Date('2024-01-15T10:00:00'))).resolves.toBe(false);
    });
});

describe('getAgentWorkingHours', () => {
    it('formatea los días disponibles con horarios', () => {
        const schedule: AgentSchedule[] = [
            { day_of_week: 1, start_time: '09:00', end_time: '18:00', is_available: true },
            { day_of_week: 2, start_time: '09:00', end_time: '18:00', is_available: true },
            { day_of_week: 0, start_time: '09:00', end_time: '13:00', is_available: false },
        ];

        expect(getAgentWorkingHours(schedule)).toBe('Lun 09:00-18:00, Mar 09:00-18:00');
    });

    it('devuelve cadena vacía si no hay días disponibles', () => {
        expect(getAgentWorkingHours([{ day_of_week: 0, start_time: '09:00', end_time: '13:00', is_available: false }])).toBe('');
    });
});

describe('getAgentAvailabilityStatus', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    function statusFor(schedule: AgentSchedule[]) {
        mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({
                data: apiRow({ schedule }),
                error: null,
            }),
        });
        return getAgentAvailabilityStatus(agentRow);
    }

    it('devuelve "available" dentro del horario', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-15T10:00:00')); // Lunes

        const agent = { ...agentRow, schedule: [{ day_of_week: 1, start_time: '09:00', end_time: '18:00', is_available: true }] };
        mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: apiRow({ schedule: agent.schedule }), error: null }),
        });

        expect(getAgentAvailabilityStatus(agent)).toBe('available');
        void statusFor;
    });

    it('devuelve "break" durante la pausa', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-15T12:30:00')); // Lunes, en break

        const agent = {
            ...agentRow,
            schedule: [
                {
                    day_of_week: 1,
                    start_time: '09:00',
                    end_time: '18:00',
                    is_available: true,
                    break_start: '12:00',
                    break_end: '13:00',
                },
            ],
        };

        expect(getAgentAvailabilityStatus(agent)).toBe('break');
    });

    it('devuelve "unavailable" sin horario para el día', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-15T10:00:00')); // Lunes

        const agent = { ...agentRow, schedule: [] };

        expect(getAgentAvailabilityStatus(agent)).toBe('unavailable');
    });
});

describe('constantes re-exportadas', () => {
    it('exponen DAY_LABELS', () => {
        expect(DAY_LABELS).toContain('Lunes');
        expect(DAY_LABELS).toHaveLength(7);
    });
});
