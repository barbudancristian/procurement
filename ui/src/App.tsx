import { Body1, Button, FluentProvider, Spinner, Subtitle1 } from '@fluentui/react-components';
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
import { StorageChoice } from './pages/admin/Storage';
import { AuditAdmin, BrandingAdmin, ConnectionAdmin, CurrenciesAdmin, UsersAdmin, WorkflowsAdmin } from './pages/admin/Admin';

// The single-file design preview runs inside a hosted frame where the URL hash is reserved,
// so it keeps navigation in memory. The real app uses hash routing.
const Router = import.meta.env.MODE === 'singlefile' ? MemoryRouter : HashRouter;

const gate: React.CSSProperties = { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' };

/** Shown in the desktop app until the user is signed in with a Sourcing Hub role. */
function StartGate() {
  const { start, retryStart, branding } = useApp();
  if (start.kind === 'choose') return <StorageChoice sharePointAvailable={start.sharePointAvailable} />;
  if (start.kind === 'starting') return <div style={gate}><Spinner label={`Signing in to ${branding.appName}…`} /></div>;
  if (start.kind === 'no-role')
    return (
      <div style={gate}>
        <Subtitle1>You are signed in as {start.name}, but you have no {branding.appName} role yet.</Subtitle1>
        <Body1>Ask your administrator to add you to one of the {branding.appName} groups, then try again.</Body1>
        <Button onClick={retryStart}>Try again</Button>
      </div>
    );
  if (start.kind === 'error')
    return (
      <div style={gate}>
        <Subtitle1>Sign-in did not complete</Subtitle1>
        <Body1>{start.message}</Body1>
        <Button appearance="primary" onClick={retryStart}>Try again</Button>
      </div>
    );
  return null;
}

function Routed() {
  const { theme, start } = useApp();
  const perm = usePermissions();
  if (start.kind !== 'demo' && start.kind !== 'ready')
    return (
      <FluentProvider theme={theme} style={{ background: 'transparent', height: '100%' }}>
        <StartGate />
      </FluentProvider>
    );
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
