import { useEffect } from 'preact/hooks';
import { Route, Switch, useLocation } from 'wouter-preact';
import { Shell } from './components/Shell';
import { ToastHost } from './components/ToastHost';
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
import { authLoading, authSession } from './store/app';

function ProtectedRoutes() {
  const [, setLocation] = useLocation();
  const session = authSession.value;

  useEffect(() => {
    if (!session) setLocation('/login', { replace: true });
  }, [session]);

  if (!session) return null;

  return (
    <Shell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/usuarios" component={AdminUsersPage} />
        <Route path="/papelera" component={TrashPage} />
        <Route path="/visitas" component={VisitsPage} />
        <Route path="/chat" component={ChatPage} />
        <Route path="/propiedades/nueva" component={PropertyFormPage} />
        <Route path="/propiedades/:id" component={PropertyFormPage} />
        <Route path="/propiedades" component={PropertiesPage} />
        <Route path="/leads/nueva" component={LeadFormPage} />
        <Route path="/leads/:id" component={LeadDetailPage} />
        <Route path="/leads" component={LeadsPage} />
        <Route path="/agentes/nueva" component={AgentFormPage} />
        <Route path="/agentes/:id" component={AgentFormPage} />
        <Route path="/agentes" component={AgentsPage} />
        <Route path="/mercadolibre" component={MercadoLibrePage} />
        <Route path="/newsletter" component={NewsletterPage} />
        <Route path="/configuracion" component={ConfigPage} />
        <Route path="/sitio" component={SitePage} />
        <Route path="/auditoria" component={AuditLogPage} />
        <Route component={NotFound} />
      </Switch>
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