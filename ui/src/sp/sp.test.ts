import { describe, expect, it } from 'vitest';
import { ConflictError, GraphClient, sitePathFromUrl } from './graph';
import { columnPayload, setUpSite, testConnection } from './provision';
import { lists, SCHEMA_VERSION } from './schema';
import { createHost, roleFromClaims } from './host';

// In-memory stand-in for the Graph endpoints the set-up uses.
function fakeGraph() {
  let n = 0;
  const id = () => `id${++n}`;
  const site = { id: 'site1', displayName: 'Procurement', webUrl: 'https://contoso.sharepoint.com/sites/Procurement' };
  const store = new Map<string, { id: string; displayName: string; columns: { id: string; name: string; indexed: boolean }[]; items: { id: string; eTag: string; fields: Record<string, unknown> }[] }>();
  const calls: string[] = [];
  const json = (status: number, body?: unknown, headers: Record<string, string> = {}) => new Response(body === undefined ? null : JSON.stringify(body), { status, headers });
  const fetch = async (url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    const u = new URL(url);
    const p = decodeURIComponent(u.pathname.replace('/v1.0', ''));
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push(`${method} ${p}`);
    let m: RegExpMatchArray | null;
    if (method === 'GET' && p === '/sites/contoso.sharepoint.com:/sites/Procurement') return json(200, site);
    if (method === 'GET' && p.startsWith('/sites/contoso.sharepoint.com:')) return json(404, { error: { code: 'itemNotFound', message: 'not found' } });
    if (p === '/sites/site1/lists') {
      if (method === 'GET') return json(200, { value: [...store.values()].map(({ id, displayName }) => ({ id, displayName })) });
      const l = { id: id(), displayName: body.displayName, columns: body.columns.map((c: { name: string; indexed: boolean }) => ({ id: id(), name: c.name, indexed: c.indexed })), items: [] };
      l.columns.push({ id: id(), name: 'Title', indexed: false });
      store.set(l.displayName, l);
      return json(201, { id: l.id, displayName: l.displayName });
    }
    const byId = (lid: string) => [...store.values()].find((l) => l.id === lid)!;
    if ((m = p.match(/^\/sites\/site1\/lists\/([^/]+)\/columns$/))) {
      const l = byId(m[1]);
      if (method === 'GET') return json(200, { value: l.columns });
      l.columns.push({ id: id(), name: body.name, indexed: body.indexed });
      return json(201, {});
    }
    if ((m = p.match(/^\/sites\/site1\/lists\/([^/]+)\/columns\/([^/]+)$/)) && method === 'PATCH') {
      byId(m[1]).columns.find((c) => c.id === m![2])!.indexed = body.indexed;
      return json(200, {});
    }
    if ((m = p.match(/^\/sites\/site1\/lists\/([^/]+)\/items$/))) {
      const l = byId(m[1]);
      if (method === 'GET') return json(200, { value: l.items });
      const it = { id: id(), eTag: '"1"', fields: body.fields };
      l.items.push(it);
      return json(201, it);
    }
    if ((m = p.match(/^\/sites\/site1\/lists\/([^/]+)\/items\/([^/]+)\/fields$/)) && method === 'PATCH') {
      const it = byId(m[1]).items.find((i) => i.id === m![2])!;
      const ifMatch = (init?.headers as Record<string, string>)['If-Match'];
      if (ifMatch && ifMatch !== it.eTag) return json(412, { error: { code: 'resourceModified', message: 'etag mismatch' } });
      Object.assign(it.fields, body);
      it.eTag = `"${Number(it.eTag.replace(/"/g, '')) + 1}"`;
      return json(200, it.fields);
    }
    return json(400, { error: { code: 'unexpected', message: `${method} ${p}` } });
  };
  const graph = new GraphClient({ token: async () => 'tok', fetch, sleep: async () => {} });
  return { graph, store, calls };
}

const URL_OK = 'https://contoso.sharepoint.com/sites/Procurement';

describe('sitePathFromUrl', () => {
  it('accepts a site address and strips page paths', () => {
    expect(sitePathFromUrl(URL_OK)).toBe('/sites/contoso.sharepoint.com:/sites/Procurement');
    expect(sitePathFromUrl(URL_OK + '/SitePages/Home.aspx')).toBe('/sites/contoso.sharepoint.com:/sites/Procurement');
    expect(sitePathFromUrl('https://contoso.sharepoint.com/teams/Buy/')).toBe('/sites/contoso.sharepoint.com:/teams/Buy');
  });
  it('rejects anything that is not a SharePoint Online site', () => {
    expect(() => sitePathFromUrl('http://contoso.sharepoint.com/sites/x')).toThrow();
    expect(() => sitePathFromUrl('https://evil.example.com/sites/x')).toThrow();
    expect(() => sitePathFromUrl('https://contoso.sharepoint.com/')).toThrow();
    expect(() => sitePathFromUrl('not a url')).toThrow();
  });
});

describe('GraphClient', () => {
  it('retries throttled requests using Retry-After', async () => {
    const waits: number[] = [];
    let calls = 0;
    const g = new GraphClient({
      token: async () => 't',
      sleep: async (ms) => void waits.push(ms),
      fetch: async () => (++calls < 3 ? new Response('', { status: 429, headers: { 'Retry-After': '2' } }) : new Response('{"ok":1}', { status: 200 })),
    });
    expect(await g.get('/me')).toEqual({ ok: 1 });
    expect(waits).toEqual([2000, 2000]);
  });
  it('gives up after the last attempt and reports the Graph error', async () => {
    const g = new GraphClient({ token: async () => 't', sleep: async () => {}, maxAttempts: 2, fetch: async () => new Response('{"error":{"code":"x","message":"busy"}}', { status: 503 }) });
    await expect(g.get('/me')).rejects.toMatchObject({ status: 503, message: 'busy' });
  });
  it('never sends the token outside Graph', async () => {
    const g = new GraphClient({ token: async () => 't', fetch: async () => new Response('{}') });
    await expect(g.get('https://evil.example.com/x')).rejects.toThrow(/outside Microsoft Graph/);
  });
  it('follows paging links', async () => {
    const g = new GraphClient({
      token: async () => 't',
      fetch: async (u) => new Response(JSON.stringify(u.includes('page2') ? { value: [3] } : { value: [1, 2], '@odata.nextLink': 'https://graph.microsoft.com/v1.0/x?page2' })),
    });
    expect(await g.getAll('/x')).toEqual([1, 2, 3]);
  });
});

describe('site set-up', () => {
  it('reports a new site as needing set-up', async () => {
    const { graph } = fakeGraph();
    const r = await testConnection(graph, URL_OK);
    expect(r.schemaVersion).toBeNull();
    expect(r.missingLists).toHaveLength(lists.length);
    expect(r.upToDate).toBe(false);
  });

  it('creates every list once, then changes nothing on a second run', async () => {
    const { graph, store, calls } = fakeGraph();
    const progress: number[] = [];
    const first = await setUpSite(graph, URL_OK, (_s, done) => progress.push(done));
    expect(first.steps.every((s) => s.status === 'created')).toBe(true);
    expect(store.size).toBe(lists.length);
    expect(progress.at(-1)).toBe(lists.length);
    expect((await testConnection(graph, URL_OK)).upToDate).toBe(true);

    const before = calls.length;
    const second = await setUpSite(graph, URL_OK);
    expect(second.steps.every((s) => s.status === 'unchanged')).toBe(true);
    expect(calls.slice(before).filter((c) => !c.startsWith('GET'))).toEqual([]);
    expect(store.get('SH_Settings')!.items).toHaveLength(1);
  });

  it('adds a missing column and a missing index to an existing list', async () => {
    const { graph, store } = fakeGraph();
    await setUpSite(graph, URL_OK);
    const projects = store.get('SH_Projects')!;
    projects.columns = projects.columns.filter((c) => c.name !== 'ClientName');
    projects.columns.find((c) => c.name === 'Reference')!.indexed = false;
    const r = await setUpSite(graph, URL_OK);
    const step = r.steps.find((s) => s.list === 'SH_Projects')!;
    expect(step.status).toBe('updated');
    expect(step.detail).toContain('added ClientName');
    expect(step.detail).toContain('indexed Reference');
  });

  it('refuses to run on a site set up by a newer app version', async () => {
    const { graph, store } = fakeGraph();
    await setUpSite(graph, URL_OK);
    store.get('SH_Settings')!.items[0].fields.SettingValue = String(SCHEMA_VERSION + 1);
    await expect(setUpSite(graph, URL_OK)).rejects.toThrow(/newer version/);
  });

  it('explains a missing site in plain words', async () => {
    const { graph } = fakeGraph();
    await expect(testConnection(graph, 'https://contoso.sharepoint.com/sites/Nope')).rejects.toThrow(/No site was found/);
  });

  it('turns an eTag mismatch into a conflict', async () => {
    const { graph, store } = fakeGraph();
    await setUpSite(graph, URL_OK);
    const s = store.get('SH_Settings')!;
    await expect(graph.patch(`/sites/site1/lists/${s.id}/items/${s.items[0].id}/fields`, { SettingValue: 'x' }, '"0"')).rejects.toBeInstanceOf(ConflictError);
    await expect(graph.patch(`/sites/site1/lists/${s.id}/items/${s.items[0].id}/fields`, { SettingValue: 'x' }, '"1"')).resolves.toBeDefined();
  });
});

describe('schema', () => {
  it('has unique list and column names and no indexed multi-line text', () => {
    expect(new Set(lists.map((l) => l.name)).size).toBe(lists.length);
    for (const l of lists) {
      expect(new Set(l.columns.map((c) => c.name)).size, l.name).toBe(l.columns.length);
      for (const c of l.columns) {
        expect(c.name).toMatch(/^[A-Za-z][A-Za-z0-9]*$/);
        if (c.type === 'note') expect(columnPayload(c).indexed).toBe(false);
      }
    }
  });
  it('keeps every list within the SharePoint limit of 20 indexed columns', () => {
    for (const l of lists) expect(l.columns.filter((c) => c.indexed).length).toBeLessThanOrEqual(20);
  });
});

describe('desktop host bridge', () => {
  it('matches answers to requests and surfaces errors', async () => {
    let listener: (e: { data: unknown }) => void = () => {};
    const sent: { id: number; type: string }[] = [];
    const host = createHost({ postMessage: (m) => sent.push(m as { id: number; type: string }), addEventListener: (_t, fn) => (listener = fn) });
    const a = host.token();
    const b = host.session();
    listener({ data: { id: sent[1].id, ok: false, error: 'Sign-in was cancelled.' } });
    listener({ data: { id: sent[0].id, ok: true, result: 'abc' } });
    await expect(a).resolves.toBe('abc');
    await expect(b).rejects.toThrow('Sign-in was cancelled.');
  });
  it('maps app roles to the highest Sourcing Hub role', () => {
    expect(roleFromClaims(['Sourcing.Specialist', 'Sourcing.Manager'])).toBe('manager');
    expect(roleFromClaims([])).toBeNull();
  });
});
