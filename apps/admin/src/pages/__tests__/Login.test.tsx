import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { Login } from '../Login';
import { __mocks } from '../../lib/supabase';

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset supabase mocks to default
    __mocks.signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: null });
    __mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
  });

  it('renders login form with email and password fields', () => {
    render(<Login />);
    
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    expect(screen.getByText('BIENENHAUS')).toBeInTheDocument();
    expect(screen.getByText('Panel de Administración')).toBeInTheDocument();
  });

  it('shows error when credentials are invalid', async () => {
    __mocks.signInWithPassword.mockResolvedValueOnce({
      error: { message: 'Invalid credentials' },
      data: { user: null, session: null },
    });

    render(<Login />);
    
    fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
    fireEvent.input(screen.getByLabelText('Contraseña'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText(/credenciales incorrectas/i)).toBeInTheDocument();
    });
  });

  it('calls signInWithPassword with credentials on submit', async () => {
    __mocks.signInWithPassword.mockResolvedValueOnce({
      error: null,
      data: { user: { id: '1' }, session: { access_token: 'token' } },
    });

    render(<Login />);
    
    fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'admin@bienenhaus.com' } });
    fireEvent.input(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    // El componente no navega: el redirect lo maneja initAuth
    // (onAuthStateChange SIGNED_IN -> window.location.href '/admin#/')
    await waitFor(() => {
      expect(__mocks.signInWithPassword).toHaveBeenCalledWith({
        email: 'admin@bienenhaus.com',
        password: 'password123',
      });
    });

    expect(screen.queryByText(/credenciales incorrectas/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).not.toBeDisabled();
  });

  it('disables submit button while loading', async () => {
    let resolveSignIn: (value: any) => void;
    const signInPromise = new Promise(resolve => { resolveSignIn = resolve; });
    __mocks.signInWithPassword.mockReturnValue(signInPromise);

    render(<Login />);
    
    fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
    fireEvent.input(screen.getByLabelText('Contraseña'), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(screen.getByRole('button', { name: /ingresando/i })).toBeDisabled();

    resolveSignIn!({ error: null, data: { user: { id: '1' }, session: {} } });
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /ingresando/i })).not.toBeInTheDocument();
    });
  });
});