import { FluentProvider } from '@fluentui/react-components';
import { HashRouter, MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from './components/Shell';
import { AppProvider, useApp, usePermissions } from './state/AppContext';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { NewProject } from './pages/NewProject';
import { ProjectWorkspace } from './pages/ProjectWorkspace';
import { Suppliers } from './pages/Suppliers';
import { Reports } from './pages/Reports';
import { Documents } from './pages/Documents';
import { ClientPortal } from './pages/ClientPortal';
import { AuditAdmin, BrandingAdmin, ConnectionAdmin, CurrenciesAdmin, UsersAdmin, WorkflowsAdmin } from './pages/admin/Admin';

// The single-file design preview runs inside a hosted frame where the URL hash is reserved,
// so it keeps navigation in memory. The real app uses hash routing.
const Router = import.meta.env.MODE === 'singlefile' ? MemoryRouter : HashRouter;

function Routed() {
  const { theme } = useApp();
  const perm = usePermissions();
  return (
    <FluentProvider theme={theme} style={{ background: 'transparent' }}>
      <Router>
        <Shell>
          {perm.isClient ? (
            <Routes>
              <Route path="*" element={<ClientPortal />} />
            </Routes>
          ) : (
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/scope/:scope" element={<Projects />} />
              <Route path="/projects/new" element={perm.canCreate ? <NewProject /> : <Navigate to="/projects" />} />
              <Route path="/projects/:id" element={<ProjectWorkspace />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/documents" element={<Documents />} />
              {perm.canAdmin && (
                <>
                  <Route path="/admin/users" element={<UsersAdmin />} />
                  <Route path="/admin/workflows" element={<WorkflowsAdmin />} />
                  <Route path="/admin/branding" element={<BrandingAdmin />} />
                  <Route path="/admin/currencies" element={<CurrenciesAdmin />} />
                  <Route path="/admin/connection" element={<ConnectionAdmin />} />
                </>
              )}
              {perm.canSeeAudit && <Route path="/admin/audit" element={<AuditAdmin />} />}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          )}
        </Shell>
      </Router>
    </FluentProvider>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Routed />
    </AppProvider>
  );
}
