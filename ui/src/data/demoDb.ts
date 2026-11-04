// Demo database: keeps the sample data and any changes made while presenting
// (new projects, stage changes, users, currencies) on this computer, so the app
// can be shown without SharePoint. "Reset demo data" restores the original set.

import { currencies, projects, suppliers, users } from './mock';

const KEY = 'sourcinghub.demo.v1';

interface Snapshot {
  version: 1;
  savedAt: string;
  projects: typeof projects;
  suppliers: typeof suppliers;
  users: typeof users;
  currencies: typeof currencies;
}

const replace = <T,>(target: T[], source: T[] | undefined) => {
  if (Array.isArray(source) && source.length) target.splice(0, target.length, ...source);
};

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Loads saved demo data over the built-in sample data. Call once before the first render. */
export function loadDemoDb(): void {
  try {
    const raw = storage()?.getItem(KEY);
    if (!raw) return;
    const snap = JSON.parse(raw) as Snapshot;
    if (snap.version !== 1) return;
    replace(projects, snap.projects);
    replace(suppliers, snap.suppliers);
    replace(users, snap.users);
    replace(currencies, snap.currencies);
  } catch {
    // Unreadable or blocked storage: keep the built-in sample data.
  }
}

/** Saves the current demo data. Safe to call after every change. */
export function saveDemoDb(): void {
  try {
    const snap: Snapshot = { version: 1, savedAt: new Date().toISOString(), projects, suppliers, users, currencies };
    storage()?.setItem(KEY, JSON.stringify(snap));
  } catch {
    // Storage full or blocked: the change still applies until the app closes.
  }
}

/** Forgets every demo change. The page reloads with the original sample data. */
export function resetDemoDb(): void {
  try {
    storage()?.removeItem(KEY);
  } catch {
    /* nothing saved */
  }
  window.location.reload();
}

export function hasDemoChanges(): boolean {
  try {
    return !!storage()?.getItem(KEY);
  } catch {
    return false;
  }
}
