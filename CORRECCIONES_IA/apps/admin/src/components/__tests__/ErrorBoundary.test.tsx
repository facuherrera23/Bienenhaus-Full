import { fireEvent, render, screen } from '@testing-library/preact';
import { useState } from 'preact/hooks';
import { ErrorBoundary } from '../ErrorBoundary';

// El boundary reporta a Sentry vía lazy import; lo mockeamos para no cargar
// @sentry/browser en jsdom y para poder verificar la llamada si hiciera falta.
vi.mock('../../lib/sentry', () => ({
    captureBoundaryError: vi.fn(),
    captureException: vi.fn(),
}));

let shouldThrow = true;

function Boom() {
    if (shouldThrow) {
        throw new Error('boom');
    }
    return <p>contenido recuperado</p>;
}

/** Harness para probar resetKey: cambiar la clave fuerza el reset del boundary. */
function Harness() {
    const [key, setKey] = useState('a');
    return (
        <div>
            <button type="button" onClick={() => setKey('b')}>
                cambiar clave
            </button>
            <ErrorBoundary resetKey={key}>
                <Boom />
            </ErrorBoundary>
        </div>
    );
}

describe('ErrorBoundary', () => {
    beforeEach(() => {
        shouldThrow = true;
        vi.clearAllMocks();
    });

    it('renderiza los children cuando no hay error', () => {
        render(
            <ErrorBoundary>
                <p>contenido normal</p>
            </ErrorBoundary>,
        );
        expect(screen.getByText('contenido normal')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('captura el error del child y muestra el fallback', () => {
        render(
            <ErrorBoundary>
                <Boom />
            </ErrorBoundary>,
        );
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/algo salió mal/i)).toBeInTheDocument();
        expect(screen.getByText('boom')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    });

    it('respeta title y description custom en el fallback', () => {
        render(
            <ErrorBoundary title="Título custom" description="Descripción custom">
                <Boom />
            </ErrorBoundary>,
        );
        expect(screen.getByText('Título custom')).toBeInTheDocument();
        expect(screen.getByText('Descripción custom')).toBeInTheDocument();
    });

    it('Reintentar recupera el contenido cuando el error cesa', () => {
        render(
            <ErrorBoundary>
                <Boom />
            </ErrorBoundary>,
        );
        expect(screen.getByRole('alert')).toBeInTheDocument();

        shouldThrow = false;
        fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));

        expect(screen.getByText('contenido recuperado')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('cambiar resetKey resetea el error (recuperación al navegar)', () => {
        render(<Harness />);
        expect(screen.getByRole('alert')).toBeInTheDocument();

        shouldThrow = false;
        fireEvent.click(screen.getByRole('button', { name: /cambiar clave/i }));

        expect(screen.getByText('contenido recuperado')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('llama a onError con el error capturado', () => {
        const onError = vi.fn();
        render(
            <ErrorBoundary onError={onError}>
                <Boom />
            </ErrorBoundary>,
        );
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
        expect(onError.mock.calls[0][0].message).toBe('boom');
    });
});
