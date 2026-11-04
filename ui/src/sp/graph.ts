// Small Microsoft Graph client used by the data layer.
//
// - Gets a token from the desktop host for every request (the host caches it).
// - Retries throttled or briefly unavailable requests, honouring Retry-After.
// - Follows @odata.nextLink paging.
// - Sends If-Match on updates so a save never overwrites someone else's change.

export type TokenProvider = () => Promise<string>;
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

export class GraphError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'GraphError';
  }
}

/** Someone else saved the item since it was loaded. */
export class ConflictError extends GraphError {
  constructor(message = 'Someone else changed this item after you opened it.') {
    super(412, 'conflict', message);
    this.name = 'ConflictError';
  }
}

export interface GraphOptions {
  token: TokenProvider;
  fetch?: FetchLike;
  /** Waits between retries. Replaced in tests. */
  sleep?: (ms: number) => Promise<void>;
  maxAttempts?: number;
}

const RETRY_STATUSES = new Set([429, 503, 504]);

export class GraphClient {
  private fetchImpl: FetchLike;
  private sleep: (ms: number) => Promise<void>;
  private maxAttempts: number;

  constructor(private opts: GraphOptions) {
    this.fetchImpl = opts.fetch ?? ((i, init) => fetch(i, init));
    this.sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
    this.maxAttempts = opts.maxAttempts ?? 5;
  }

  async request<T = unknown>(method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<T> {
    const url = path.startsWith('https://') ? path : `${GRAPH_BASE}${path}`;
    if (!url.startsWith(GRAPH_BASE + '/')) throw new Error('Refusing to send a token outside Microsoft Graph.');
    for (let attempt = 1; ; attempt++) {
      const token = await this.opts.token();
      const res = await this.fetchImpl(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      if (res.ok) {
        if (res.status === 204) return undefined as T;
        const text = await res.text();
        return (text ? JSON.parse(text) : undefined) as T;
      }
      if (RETRY_STATUSES.has(res.status) && attempt < this.maxAttempts) {
        const after = Number(res.headers.get('Retry-After'));
        await this.sleep(after > 0 ? Math.min(after, 120) * 1000 : 1000 * 2 ** (attempt - 1));
        continue;
      }
      if (res.status === 412) throw new ConflictError();
      let code = 'error';
      let message = `Microsoft Graph returned ${res.status}.`;
      try {
        const j = (await res.json()) as { error?: { code?: string; message?: string } };
        code = j.error?.code ?? code;
        message = j.error?.message ?? message;
      } catch {
        /* body was not JSON */
      }
      throw new GraphError(res.status, code, message);
    }
  }

  get<T = unknown>(path: string) {
    return this.request<T>('GET', path);
  }

  post<T = unknown>(path: string, body: unknown) {
    return this.request<T>('POST', path, body);
  }

  patch<T = unknown>(path: string, body: unknown, etag?: string) {
    return this.request<T>('PATCH', path, body, etag ? { 'If-Match': etag } : {});
  }

  /** Reads every page of a collection. */
  async getAll<T>(path: string): Promise<T[]> {
    const out: T[] = [];
    let next: string | undefined = path;
    while (next) {
      const page: { value: T[]; '@odata.nextLink'?: string } = await this.get(next);
      out.push(...page.value);
      next = page['@odata.nextLink'];
    }
    return out;
  }
}

/** Turns https://contoso.sharepoint.com/sites/Procurement into the Graph site path. */
export function sitePathFromUrl(siteUrl: string): string {
  let u: URL;
  try {
    u = new URL(siteUrl.trim());
  } catch {
    throw new Error('Enter the full site address, for example https://contoso.sharepoint.com/sites/Procurement.');
  }
  if (u.protocol !== 'https:' || !/\.sharepoint(-df)?\.(com|us|de|cn)$/i.test(u.hostname)) {
    throw new Error('The address must be an https SharePoint Online site.');
  }
  const path = u.pathname.replace(/\/+$/, '').replace(/\/(SitePages|Shared%20Documents|Lists)\/.*$/i, '');
  if (!/^\/(sites|teams)\/[^/]+$/i.test(path)) {
    throw new Error('Use the site address itself, for example https://contoso.sharepoint.com/sites/Procurement.');
  }
  return `/sites/${u.hostname}:${path}`;
}
