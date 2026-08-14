import { lazy, Suspense, useEffect } from 'preact/compat';
import type { ComponentType } from 'preact';
import { Route, type RouteComponentProps, Switch, useLocation } from 'wouter-preact';
import { Shell } from './components/Shell';
import { ToastHost } from './components/ToastHost';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
    authLoading,
    authMustChangePassword,
    authSession,
    authUserRole,
    pushToast,
} from './store/app';

// ============================================================
// Lazy-loaded page components (code-splitting)
// ============================================================

const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const PropertiesPage = lazy(() =>
    import('./pages/PropertiesPage').then((m) => ({ default: m.PropertiesPage })),
);
const PropertyFormPage = lazy(() =>
    import('./pages/PropertyFormPage').then((m) => ({ default: m.PropertyFormPage })),
);
const LeadsPage = lazy(() => import('./pages/LeadsPage').then((m) => ({ default: m.LeadsPage })));
const LeadDetailPage = lazy(() =>
    import('./pages/LeadDetailPage').then((m) => ({ default: m.LeadDetailPage })),
);
const LeadFormPage = lazy(() =>
    import('./pages/LeadFormPage').then((m) => ({ default: m.LeadFormPage })),
);
const AgentsPage = lazy(() =>
    import('./pages/AgentsPage').then((m) => ({ default: m.AgentsPage })),
);
const AgentFormPage = lazy(() =>
    import('./pages/AgentFormPage').then((m) => ({ default: m.AgentFormPage })),
);
const AdminUsersPage = lazy(() =>
    import('./pages/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })),
);
const TrashPage = lazy(() => import('./pages/TrashPage').then((m) => ({ default: m.TrashPage })));
const VisitsPage = lazy(() =>
    import('./pages/VisitsPage').then((m) => ({ default: m.VisitsPage })),
);
const ChatPage = lazy(() => import('./pages/ChatPage').then((m) => ({ default: m.ChatPage })));
const SitePage = lazy(() => import('./pages/SitePage').then((m) => ({ default: m.SitePage })));
const MercadoLibrePage = lazy(() =>
    import('./pages/MercadoLibrePage').then((m) => ({ default: m.MercadoLibrePage })),
);
const ConfigPage = lazy(() =>
    import('./pages/ConfigPage').then((m) => ({ default: m.ConfigPage })),
);
const NewsletterPage = lazy(() =>
    import('./pages/NewsletterPage').then((m) => ({ default: m.NewsletterPage })),
);
const AuditLogPage = lazy(() =>
    import('./pages/AuditLogPage').then((m) => ({ default: m.AuditLogPage })),
);
const OwnersPage = lazy(() =>
    import('./pages/OwnersPage').then((m) => ({ default: m.OwnersPage })),
);
const OwnerFormPage = lazy(() =>
    import('./pages/OwnerFormPage').then((m) => ({ default: m.OwnerFormPage })),
);
const OwnerDetailPage = lazy(() =>
    import('./pages/OwnerDetailPage').then((m) => ({ default: m.OwnerDetailPage })),
);
const PriceAnalysisPage = lazy(() =>
    import('./pages/PriceAnalysisPage').then((m) => ({ default: m.PriceAnalysisPage })),
);
const ActionPlansPage = lazy(() =>
    import('./pages/ActionPlansPage').then((m) => ({ default: m.ActionPlansPage })),
);
const ActionPlansDashboard = lazy(() =>
    import('./pages/ActionPlansDashboard').then((m) => ({ default: m.ActionPlansDashboard })),
);
const ActionPlanDetailPage = lazy(() =>
    import('./pages/ActionPlanDetailPage').then((m) => ({ default: m.ActionPlanDetailPage })),
);
const CommunicationsPage = lazy(() =>
    import('./pages/CommunicationsPage').then((m) => ({ default: m.CommunicationsPage })),
);
const ReportsPage = lazy(() =>
    import('./pages/ReportsPage').then((m) => ({ default: m.ReportsPage })),
);
const TasarPage = lazy(() => import('./pages/TasarPage').then((m) => ({ default: m.TasarPage })));
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const ChangePassword = lazy(() =>
    import('./pages/ChangePassword').then((m) => ({ default: m.ChangePassword })),
);

// ============================================================
// Loading fallback component
// ============================================================

function PageLoader() {
    return (
        <div className="page-loader" role="status" aria-label="Cargando página…">
            <div className="spinner" aria-hidden="true"></div>
            <p>Cargando…</p>
        </div>
    );
}

// Wrapper para Suspense en cada ruta
function withSuspense<P extends object>(Component: ComponentType<P>) {
    return function SuspenseWrapper(props: P) {
        return (
            <Suspense fallback={<PageLoader />}>
                <Component {...props} />
            </Suspense>
        );
    };
}

type AdminRole = 'super_admin' | 'admin' | 'staff' | 'viewer';

const ROLE_RANK: Record<AdminRole, number> = {
    viewer: 1,
    staff: 2,
    admin: 3,
    super_admin: 4,
};

function hasMinRole(actual: AdminRole | null, required: AdminRole): boolean {
    if (!actual) return false;
    return ROLE_RANK[actual] >= ROLE_RANK[required];
}

function withRoleGuard(
    component: ComponentType<RouteComponentProps<Record<string, string | undefined>>>,
    minRole: AdminRole,
): ComponentType<RouteComponentProps<Record<string, string | undefined>>> {
    function Guarded(props: RouteComponentProps<Record<string, string | undefined>>) {
        const [, setLocation] = useLocation();
        const userRole = authUserRole.value as AdminRole | null;

        useEffect(() => {
            if (!hasMinRole(userRole, minRole)) {
                pushToast({
                    type: 'error',
                    title: 'Acceso restringido',
                    description: `Esta sección requiere rol ${minRole} o superior.`,
                });
                setLocation('/', { replace: true });
            }
        }, [userRole]);

        if (!hasMinRole(userRole, minRole)) return null;
        const Cmp = component as ComponentType<
            RouteComponentProps<Record<string, string | undefined>>
        >;
        return <Cmp {...props} />;
    }

    return Guarded;
}

function ProtectedRoutes() {
    const [location, setLocation] = useLocation();
    const session = authSession.value;
    const loading = authLoading.value;
    const userRole = authUserRole.value;
    const mustChangePassword = authMustChangePassword.value;

    if (loading) return null;

    useEffect(() => {
        if (!session) setLocation('/login', { replace: true });
    }, [session]);

    if (!session) return null;

    if (userRole === null) {
        useEffect(() => {
            setLocation('/login', { replace: true });
        }, [userRole]);
        return null;
    }

    if (mustChangePassword) {
        useEffect(() => {
            setLocation('/cambiar-contrasena', { replace: true });
        }, [mustChangePassword]);
        return null;
    }

    return (
        <Shell>
            <ErrorBoundary resetKey={location}>
                <Switch>
                    <Route path="/" component={withSuspense(Dashboard)} />
                    <Route path="/propiedades/nueva" component={withSuspense(PropertyFormPage)} />
                    <Route path="/propiedades/:id" component={withSuspense(PropertyFormPage)} />
                    <Route
                        path="/propiedades/:id/analisis"
                        component={withSuspense(PriceAnalysisPage)}
                    />
                    <Route
                        path="/propiedades/:id/planes"
                        component={withSuspense(ActionPlansPage)}
                    />
                    <Route
                        path="/propiedades/:id/planes/nuevo"
                        component={withSuspense(ActionPlansPage)}
                    />
                    <Route path="/propiedades" component={withSuspense(PropertiesPage)} />
                    <Route path="/leads/nueva" component={withSuspense(LeadFormPage)} />
                    <Route path="/leads/:id" component={withSuspense(LeadDetailPage)} />
                    <Route path="/leads" component={withSuspense(LeadsPage)} />
                    <Route path="/agentes/nueva" component={withSuspense(AgentFormPage)} />
                    <Route path="/agentes/:id" component={withSuspense(AgentFormPage)} />
                    <Route path="/agentes" component={withSuspense(AgentsPage)} />
                    <Route path="/visitas" component={withSuspense(VisitsPage)} />
                    <Route path="/chat" component={withSuspense(ChatPage)} />
                    <Route path="/mercadolibre" component={withSuspense(MercadoLibrePage)} />
                    <Route path="/newsletter" component={withSuspense(NewsletterPage)} />
                    <Route path="/papelera" component={withSuspense(TrashPage)} />
                    <Route path="/propietarios" component={withSuspense(OwnersPage)} />
                    <Route path="/propietarios/nuevo" component={withSuspense(OwnerFormPage)} />
                    <Route path="/propietarios/:id" component={withSuspense(OwnerDetailPage)} />
                    <Route path="/planes-accion" component={withSuspense(ActionPlansDashboard)} />
                    <Route
                        path="/planes-accion/:id"
                        component={withSuspense(ActionPlanDetailPage)}
                    />
                    <Route path="/comunicaciones" component={withSuspense(CommunicationsPage)} />
                    <Route path="/reportes" component={withSuspense(ReportsPage)} />
                    <Route path="/tasar/nueva" component={withSuspense(TasarPage)} />
                    <Route path="/tasar/:id" component={withSuspense(TasarPage)} />
                    <Route path="/tasar" component={withSuspense(TasarPage)} />

                    <Route
                        path="/sitio"
                        component={withSuspense(withRoleGuard(SitePage, 'staff'))}
                    />

                    <Route
                        path="/usuarios"
                        component={withSuspense(withRoleGuard(AdminUsersPage, 'admin'))}
                    />
                    <Route
                        path="/configuracion"
                        component={withSuspense(withRoleGuard(ConfigPage, 'admin'))}
                    />

                    <Route
                        path="/auditoria"
                        component={withSuspense(withRoleGuard(AuditLogPage, 'admin'))}
                    />

                    <Route component={withSuspense(NotFound)} />
                </Switch>
            </ErrorBoundary>
        </Shell>
    );
}

export function App() {
    if (authLoading.value) return null;

    return (
        <>
            <Switch>
                <Route path="/login" component={withSuspense(Login)} />
                <Route path="/cambiar-contrasena" component={withSuspense(ChangePassword)} />
                <Route path="*">{() => <ProtectedRoutes />}</Route>
            </Switch>
            <ToastHost />
        </>
    );
}
