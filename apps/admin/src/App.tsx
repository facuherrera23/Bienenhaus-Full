import { useEffect } from 'preact/hooks';
import type { ComponentType } from 'preact';
import { Route, Switch, useLocation, type RouteComponentProps } from 'wouter-preact';
import { Shell } from './components/Shell';
import { ToastHost } from './components/ToastHost';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';
import { PropertiesPage } from './pages/PropertiesPage';
import { PropertyFormPage } from './pages/PropertyFormPage';
import { LeadsPage } from './pages/LeadsPage';
import { LeadDetailPage } from './pages/LeadDetailPage';
import { LeadFormPage } from './pages/LeadFormPage';
import { AgentsPage } from './pages/AgentsPage';
import { AgentFormPage } from './pages/AgentFormPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { TrashPage } from './pages/TrashPage';
import { VisitsPage } from './pages/VisitsPage';
import { ChatPage } from './pages/ChatPage';
import { SitePage } from './pages/SitePage';
import { MercadoLibrePage } from './pages/MercadoLibrePage';
import { ConfigPage } from './pages/ConfigPage';
import { NewsletterPage } from './pages/NewsletterPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { OwnersPage } from './pages/OwnersPage';
import { OwnerFormPage } from './pages/OwnerFormPage';
import { OwnerDetailPage } from './pages/OwnerDetailPage';
import { PriceAnalysisPage } from './pages/PriceAnalysisPage';
import { ActionPlansPage } from './pages/ActionPlansPage';
import { ActionPlansDashboard } from './pages/ActionPlansDashboard';
import { ActionPlanDetailPage } from './pages/ActionPlanDetailPage';
import { CommunicationsPage } from './pages/CommunicationsPage';
import { ReportsPage } from './pages/ReportsPage';
import { authLoading, authSession, authUserRole, pushToast } from './store/app';

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

/**
 * Wraps a route component with a minimum-role guard. If the authenticated
 * user does not meet `minRole`, redirects to `/` and pushes a toast.
 * Designed to compose with wouter-preact's `<Route component={...} />`:
 * we pass it as `component` so wouter still injects route params.
 */
function withRoleGuard(component: ComponentType<RouteComponentProps<Record<string, string | undefined>>>, minRole: AdminRole): ComponentType<RouteComponentProps<Record<string, string | undefined>>> {
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
    const Cmp = component as ComponentType<RouteComponentProps<Record<string, string | undefined>>>;
    return <Cmp {...props} />;
  }

  return Guarded;
}

function ProtectedRoutes() {
  const [location, setLocation] = useLocation();
  const session = authSession.value;

  useEffect(() => {
    if (!session) setLocation('/login', { replace: true });
  }, [session]);

  if (!session) return null;

  return (
    <Shell>
      {/* Boundary por página: si una página revienta, el resto del Shell sigue vivo
          y navegar (cambia `resetKey`) resetea el estado de error automáticamente. */}
      <ErrorBoundary resetKey={location}>
        <Switch>
        {/* Cualquier autenticado (viewer+ ) */}
        <Route path="/" component={Dashboard} />
        <Route path="/propiedades/nueva" component={PropertyFormPage} />
        <Route path="/propiedades/:id" component={PropertyFormPage} />
        <Route path="/propiedades/:id/analisis" component={PriceAnalysisPage} />
        <Route path="/propiedades/:id/planes" component={ActionPlansPage} />
        <Route path="/propiedades/:id/planes/nuevo" component={ActionPlansPage} />
        <Route path="/propiedades" component={PropertiesPage} />
        <Route path="/leads/nueva" component={LeadFormPage} />
        <Route path="/leads/:id" component={LeadDetailPage} />
        <Route path="/leads" component={LeadsPage} />
        <Route path="/agentes/nueva" component={AgentFormPage} />
        <Route path="/agentes/:id" component={AgentFormPage} />
        <Route path="/agentes" component={AgentsPage} />
        <Route path="/visitas" component={VisitsPage} />
        <Route path="/chat" component={ChatPage} />
        <Route path="/mercadolibre" component={MercadoLibrePage} />
        <Route path="/newsletter" component={NewsletterPage} />
        <Route path="/papelera" component={TrashPage} />
        <Route path="/propietarios" component={OwnersPage} />
        <Route path="/propietarios/nuevo" component={OwnerFormPage} />
        <Route path="/propietarios/:id" component={OwnerDetailPage} />
        <Route path="/planes-accion" component={ActionPlansDashboard} />
        <Route path="/planes-accion/:id" component={ActionPlanDetailPage} />
        <Route path="/comunicaciones" component={CommunicationsPage} />
        <Route path="/reportes" component={ReportsPage} />

        {/* staff+ : edición del contenido del sitio */}
        <Route path="/sitio" component={withRoleGuard(SitePage, 'staff')} />

        {/* admin+ : gestión de usuarios y configuración */}
        <Route path="/usuarios" component={withRoleGuard(AdminUsersPage, 'admin')} />
        <Route path="/configuracion" component={withRoleGuard(ConfigPage, 'admin')} />

        {/* admin+ : auditoría (solo lectura pero sensible) */}
        <Route path="/auditoria" component={withRoleGuard(AuditLogPage, 'admin')} />

        <Route component={NotFound} />
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
        <Route path="/login" component={Login} />
        <Route path="*">{() => <ProtectedRoutes />}</Route>
      </Switch>
      <ToastHost />
    </>
  );
}