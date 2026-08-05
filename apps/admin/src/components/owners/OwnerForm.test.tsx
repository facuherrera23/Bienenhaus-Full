import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { OwnerForm } from './OwnerForm';
import { ownerSchema, type OwnerFormValues } from '../../lib/owners/schemas';

describe('OwnerForm', () => {
  const validData: OwnerFormValues = {
    full_name: 'Juan Pérez',
    email: 'juan@email.com',
    phone: '+54 9 11 1234-5678',
    dni_cuit: '20-12345678-9',
    address: 'Calle 123, Piso 4, Dpto B, CABA',
    owner_type: 'persona_fisica',
    company_name: '',
    notes: 'Notas de prueba',
    preferred_contact: 'whatsapp',
  };

  const mockSubmit = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    mockSubmit.mockResolvedValue(undefined);
  });

  it('renders all form fields', () => {
    render(<OwnerForm onSubmit={mockSubmit} />);
    
    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tipo de propietario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dni \/ cuit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contacto preferido/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dirección completa/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notas internas/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
  });

  it('shows validation error for empty required field on submit', async () => {
    render(<OwnerForm onSubmit={mockSubmit} />);
    
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/el nombre es obligatorio/i)).toBeInTheDocument();
    });
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('shows company_name field when owner_type is persona_juridica', () => {
    render(<OwnerForm onSubmit={mockSubmit} initialData={{ ...validData, owner_type: 'persona_juridica' }} />);
    
    expect(screen.getByLabelText(/razón social/i)).toBeInTheDocument();
  });

  it('hides company_name field when owner_type is persona_fisica', () => {
    render(<OwnerForm onSubmit={mockSubmit} initialData={{ ...validData, owner_type: 'persona_fisica' }} />);
    
    const companyField = screen.getByLabelText(/razón social/i).closest('.field');
    expect(companyField).toHaveClass('hidden');
  });

  it('calls onSubmit with valid data', async () => {
    render(<OwnerForm onSubmit={mockSubmit} initialData={validData} />);
    
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(validData);
    });
  });

  it('does not call onSubmit when validation fails', async () => {
    render(<OwnerForm onSubmit={mockSubmit} />);
    
    fireEvent.input(screen.getByLabelText(/nombre completo/i), { target: { value: 'J' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/el nombre es obligatorio/i)).toBeInTheDocument();
    });
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('calls onCancel when cancel button clicked', () => {
    const mockCancel = vi.fn();
    render(<OwnerForm onSubmit={mockSubmit} onCancel={mockCancel} />);
    
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    
    expect(mockCancel).toHaveBeenCalledTimes(1);
  });

  it('disables form when isLoading', () => {
    render(<OwnerForm onSubmit={mockSubmit} isLoading />);
    
    expect(screen.getByRole('button', { name: /guardando/i })).toBeDisabled();
    expect(screen.getByLabelText(/nombre completo/i)).toBeDisabled();
  });

  it('validates email format using Zod schema directly', () => {
    const result = ownerSchema.safeParse({ ...validData, email: 'invalid-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Email inválido');
    }
  });

  it('validates phone min length using Zod schema directly', () => {
    const result = ownerSchema.safeParse({ ...validData, phone: '123' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Teléfono muy corto');
    }
  });

  it('validates full_name min length using Zod schema directly', () => {
    const result = ownerSchema.safeParse({ ...validData, full_name: 'J' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('El nombre es obligatorio');
    }
  });

  it('passes validation with valid data using Zod schema directly', () => {
    const result = ownerSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.full_name).toBe('Juan Pérez');
      expect(result.data.email).toBe('juan@email.com');
    }
  });
});