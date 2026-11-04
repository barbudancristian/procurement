import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Theme } from '@fluentui/react-components';
import { defaultBranding, makeThemes, type Branding } from '../theme/branding';
import { users, type Role, type User } from '../data/mock';
import { getHost, roleFromClaims, type Host, type HostConfig, type HostSession } from '../sp/host';
import { GraphClient } from '../sp/graph';
import { LocalStore, SharePointStore, type DataStore } from '../sp/store';

/** Set when the app runs inside the Windows desktop app with real data (SharePoint or local). */
export interface LiveSession {
  mode: 'sharepoint' | 'local';
  host: Host;
  session: HostSession;
  config: HostConfig;
  /** Only in SharePoint mode. */
  graph: GraphClient | null;
  /** Null in SharePoint mode until a site is chosen. */
  store: DataStore | null;
}

export type StartState =
  | { kind: 'demo' }
  | { kind: 'starting' }
  | { kind: 'choose'; sharePointAvailable: boolean }
  | { kind: 'ready' }
  | { kind: 'no-role'; name: string }
  | { kind: 'error'; message: string };

function makeLive(host: Host, session: HostSession, config: HostConfig): LiveSession {
  if (config.mode === 'local') {
    const store = new LocalStore({ read: () => host.localDbRead(), write: (c) => host.localDbWrite(c) }, session.name);
    return { mode: 'local', host, session, config, graph: null, store };
  }
  const graph = new GraphClient({ token: () => host.token() });
  return { mode: 'sharepoint', host, session, config, graph, store: config.siteUrl ? new SharePointStore(graph, config.siteUrl) : null };
}

interface AppState {
  branding: Branding;
  setBranding: (b: Branding) => void;
  dark: boolean;
  setDark: (d: boolean) => void;
  theme: Theme;
  role: Role;
  setRole: (r: Role) => void;
  currentUser: User;
  live: LiveSession | null;
  setLiveConfig: (c: HostConfig) => void;
  start: StartState;
  retryStart: () => void;
}

const Ctx = createContext<AppState | null>(null);

// Demo identities: the design preview lets you switch role to see what each user sees.
const demoUserForRole: Record<Role, string> = {
  admin: 'u1',
  manager: 'u2',
  specialist: 'u3',
  stakeholder: 'u7',
  client: 'u9',
};

const prefersDark = () => {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<Branding>(defaultBranding);
  const [dark, setDark] = useState<boolean>(() =>
    defaultBranding.defaultMode === 'system' ? prefersDark() : defaultBranding.defaultMode === 'dark',
  );
  const [role, setRole] = useState<Role>('manager');
  const themes = useMemo(() => makeThemes(branding.primaryColor), [branding.primaryColor]);
  const theme = dark ? themes.dark : themes.light;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.title = branding.appName;
  }, [dark, branding.appName]);

  // Inside the desktop app: sign in, read the user's app role and the connection settings.
  const [live, setLive] = useState<LiveSession | null>(null);
  const [start, setStart] = useState<StartState>(() => (getHost() ? { kind: 'starting' } : { kind: 'demo' }));
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const host = getHost();
    if (!host) return;
    let cancelled = false;
    setStart({ kind: 'starting' });
    (async () => {
      try {
        const config = await host.config();
        if (cancelled) return;
        if (config.mode === 'demo') {
          setStart({ kind: 'demo' });
          return;
        }
        if (config.mode === null) {
          setStart({ kind: 'choose', sharePointAvailable: config.sharePointAvailable });
          return;
        }
        const session = await host.session();
        if (cancelled) return;
        const r = roleFromClaims(session.roles);
        if (!r) {
          setStart({ kind: 'no-role', name: session.name });
          return;
        }
        setRole(r);
        setLive(makeLive(host, session, config));
        setStart({ kind: 'ready' });
      } catch (e) {
        if (!cancelled) setStart({ kind: 'error', message: e instanceof Error ? e.message : String(e) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const demoUser = users.find((u) => u.id === demoUserForRole[role])!;
  const currentUser: User = live
    ? { ...demoUser, id: live.session.username, name: live.session.name, email: live.session.username, role }
    : demoUser;
  const setLiveConfig = (config: HostConfig) => setLive((l) => (l ? makeLive(l.host, l.session, config) : l));
  return (
    <Ctx.Provider
      value={{ branding, setBranding, dark, setDark, theme, role, setRole, currentUser, live, setLiveConfig, start, retryStart: () => setAttempt((a) => a + 1) }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppProvider');
  return v;
}

/** What the current role may do. Mirrors the permission matrix in the architecture document. */
export function usePermissions() {
  const { role, currentUser } = useApp();
  return {
    canCreate: role === 'admin' || role === 'manager' || role === 'specialist',
    canEditAll: role === 'admin' || role === 'manager',
    canEditAssigned: role === 'specialist',
    canApprove: role === 'manager' || role === 'admin',
    canSeeConfidential: role === 'admin' || role === 'manager' || role === 'specialist',
    canAdmin: role === 'admin',
    canSeeAudit: role === 'admin' || role === 'manager',
    canComment: role !== 'client',
    isClient: role === 'client',
    userId: currentUser.id,
  };
}
