import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Theme } from '@fluentui/react-components';
import { defaultBranding, makeThemes, type Branding } from '../theme/branding';
import { users, type Role, type User } from '../data/mock';

interface AppState {
  branding: Branding;
  setBranding: (b: Branding) => void;
  dark: boolean;
  setDark: (d: boolean) => void;
  theme: Theme;
  role: Role;
  setRole: (r: Role) => void;
  currentUser: User;
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

  const currentUser = users.find((u) => u.id === demoUserForRole[role])!;
  return (
    <Ctx.Provider value={{ branding, setBranding, dark, setDark, theme, role, setRole, currentUser }}>
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
