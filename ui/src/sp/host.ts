// Bridge to the Windows desktop app (WebView2).
//
// The desktop app signs the user in with Microsoft (Windows account broker),
// hands out Graph tokens and stores the connection settings. The web UI never
// sees refresh tokens or passwords. Opened in a normal browser (development or
// the design preview) there is no host and the app runs on sample data.

export interface HostSession {
  name: string;
  username: string;
  tenantId: string;
  /** App role values from the Entra app registration, for example "Sourcing.Admin". */
  roles: string[];
}

export interface HostConfig {
  siteUrl: string | null;
  /** "machine": set by IT for every user. "user": set in the app by this user. */
  siteUrlSource: 'machine' | 'user' | null;
  appVersion: string;
  tenantId: string;
  clientId: string;
}

interface WebView2 {
  postMessage(msg: unknown): void;
  addEventListener(type: 'message', fn: (e: { data: unknown }) => void): void;
}

type Pending = { resolve: (v: unknown) => void; reject: (e: Error) => void };

export interface Host {
  session(): Promise<HostSession>;
  token(): Promise<string>;
  config(): Promise<HostConfig>;
  setSiteUrl(url: string): Promise<HostConfig>;
  signOut(): Promise<void>;
  openExternal(url: string): Promise<void>;
}

export function createHost(webview: WebView2, timeoutMs = 120_000): Host {
  let seq = 0;
  const pending = new Map<number, Pending>();
  webview.addEventListener('message', (e) => {
    const m = e.data as { id?: number; ok?: boolean; result?: unknown; error?: string };
    if (typeof m?.id !== 'number') return;
    const p = pending.get(m.id);
    if (!p) return;
    pending.delete(m.id);
    if (m.ok) p.resolve(m.result);
    else p.reject(new Error(m.error || 'The desktop app could not complete the request.'));
  });
  const call = <T>(type: string, payload?: unknown) =>
    new Promise<T>((resolve, reject) => {
      const id = ++seq;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error('The desktop app did not answer in time.'));
      }, timeoutMs);
      pending.set(id, {
        resolve: (v) => (clearTimeout(timer), resolve(v as T)),
        reject: (err) => (clearTimeout(timer), reject(err)),
      });
      webview.postMessage({ id, type, payload });
    });
  return {
    session: () => call<HostSession>('session'),
    token: () => call<string>('token'),
    config: () => call<HostConfig>('config'),
    setSiteUrl: (url) => call<HostConfig>('setSiteUrl', { url }),
    signOut: () => call<void>('signOut'),
    openExternal: (url) => call<void>('openExternal', { url }),
  };
}

let cached: Host | null | undefined;

/** The desktop host, or null when running in a normal browser. */
export function getHost(): Host | null {
  if (cached !== undefined) return cached;
  const wv = (globalThis as { chrome?: { webview?: WebView2 } }).chrome?.webview;
  cached = wv ? createHost(wv) : null;
  return cached;
}

/** Maps Entra app role values to the five Sourcing Hub roles, highest first. */
export const appRoleMap = {
  'Sourcing.Admin': 'admin',
  'Sourcing.Manager': 'manager',
  'Sourcing.Specialist': 'specialist',
  'Sourcing.Stakeholder': 'stakeholder',
  'Sourcing.ClientViewer': 'client',
} as const;

export type AppRole = (typeof appRoleMap)[keyof typeof appRoleMap];

export function roleFromClaims(roles: string[]): AppRole | null {
  for (const [claim, role] of Object.entries(appRoleMap)) if (roles.includes(claim)) return role;
  return null;
}
