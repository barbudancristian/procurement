// One data API for both storage options:
// - SharePointStore: the team option, SharePoint lists through Microsoft Graph.
// - LocalStore: the single-user option, one database file on this computer.
// Both use the same list and column names from schema.ts, so a local database
// can later be copied into SharePoint without changing its structure.

import { ConflictError, GraphClient } from './graph';
import { resolveSite } from './provision';
import { lists as schemaLists, SCHEMA_VERSION } from './schema';

export type Fields = Record<string, string | number | boolean | null>;

export interface StoredItem {
  id: number;
  /** Changes on every save. Pass it back on update so a stale copy cannot overwrite newer data. */
  etag: string;
  fields: Fields;
  created: string;
  modified: string;
  modifiedBy: string;
}

export interface DataStore {
  readonly kind: 'sharepoint' | 'local';
  list(listName: string, where?: { field: string; equals: string | number | boolean }): Promise<StoredItem[]>;
  get(listName: string, id: number): Promise<StoredItem | null>;
  create(listName: string, fields: Fields): Promise<StoredItem>;
  update(listName: string, id: number, fields: Fields, etag: string): Promise<StoredItem>;
  remove(listName: string, id: number, etag: string): Promise<void>;
}

const columnsByList = new Map(schemaLists.map((l) => [l.name, new Map(l.columns.map((c) => [c.name, c]))]));

/** Rejects unknown lists and columns, and missing required values, before anything is saved. */
export function validate(listName: string, fields: Fields, isNew: boolean): void {
  const cols = columnsByList.get(listName);
  if (!cols) throw new Error(`Unknown list ${listName}.`);
  for (const [k, v] of Object.entries(fields)) {
    if (k === 'Title') continue;
    const c = cols.get(k);
    if (!c) throw new Error(`${listName} has no column ${k}.`);
    if (v === null || v === undefined) continue;
    const ok =
      c.type === 'number' || c.type === 'currency'
        ? typeof v === 'number' && Number.isFinite(v)
        : c.type === 'boolean'
          ? typeof v === 'boolean'
          : c.type === 'choice'
            ? typeof v === 'string' && (c.choices ?? []).includes(v)
            : typeof v === 'string';
    if (!ok) throw new Error(`${listName}.${k} has an invalid value.`);
  }
  if (isNew) for (const c of cols.values()) if (c.required && (fields[c.name] === undefined || fields[c.name] === null || fields[c.name] === '')) throw new Error(`${listName}.${c.name} is required.`);
}

// ---------------------------------------------------------------- local file

/** File access provided by the desktop app. The file is locked to this app while it runs. */
export interface LocalFile {
  read(): Promise<string | null>;
  write(content: string): Promise<void>;
}

interface LocalDb {
  format: 'sourcing-hub-local';
  formatVersion: 1;
  schemaVersion: number;
  lists: Record<string, { nextId: number; items: (StoredItem & { version: number })[] }>;
}

export class LocalStore implements DataStore {
  readonly kind = 'local' as const;
  private db: LocalDb | null = null;
  private loading: Promise<LocalDb> | null = null;
  private writing: Promise<void> = Promise.resolve();

  constructor(
    private file: LocalFile,
    private user: string,
    private now: () => string = () => new Date().toISOString(),
  ) {}

  /** Reads the file once, even when several requests arrive together. */
  private load(): Promise<LocalDb> {
    this.loading ??= this.readFile().catch((e) => {
      this.loading = null;
      throw e;
    });
    return this.loading;
  }

  private async readFile(): Promise<LocalDb> {
    const raw = await this.file.read();
    if (raw) {
      const parsed = JSON.parse(raw) as LocalDb;
      if (parsed.format !== 'sourcing-hub-local') throw new Error('This file is not a Sourcing Hub database.');
      if (parsed.schemaVersion > SCHEMA_VERSION) throw new Error('This database was created by a newer version of the app. Install the latest version.');
      this.db = parsed;
    } else {
      this.db = { format: 'sourcing-hub-local', formatVersion: 1, schemaVersion: SCHEMA_VERSION, lists: {} };
    }
    for (const l of schemaLists) this.db.lists[l.name] ??= { nextId: 1, items: [] };
    this.db.schemaVersion = SCHEMA_VERSION;
    return this.db;
  }

  /** Saves one change at a time, in order. */
  private persist(): Promise<void> {
    const snapshot = JSON.stringify(this.db);
    // A failed write must not block the next one.
    this.writing = this.writing.catch(() => undefined).then(() => this.file.write(snapshot));
    return this.writing;
  }

  private async table(listName: string) {
    if (!columnsByList.has(listName)) throw new Error(`Unknown list ${listName}.`);
    return (await this.load()).lists[listName];
  }

  private static out(i: StoredItem & { version: number }): StoredItem {
    return { id: i.id, etag: i.etag, fields: { ...i.fields }, created: i.created, modified: i.modified, modifiedBy: i.modifiedBy };
  }

  async list(listName: string, where?: { field: string; equals: string | number | boolean }) {
    const t = await this.table(listName);
    return t.items.filter((i) => !where || i.fields[where.field] === where.equals).map(LocalStore.out);
  }

  async get(listName: string, id: number) {
    const i = (await this.table(listName)).items.find((x) => x.id === id);
    return i ? LocalStore.out(i) : null;
  }

  async create(listName: string, fields: Fields) {
    validate(listName, fields, true);
    const t = await this.table(listName);
    const at = this.now();
    const item = { id: t.nextId++, version: 1, etag: '"1"', fields: { ...fields }, created: at, modified: at, modifiedBy: this.user };
    t.items.push(item);
    await this.persist();
    return LocalStore.out(item);
  }

  async update(listName: string, id: number, fields: Fields, etag: string) {
    validate(listName, fields, false);
    const t = await this.table(listName);
    const item = t.items.find((x) => x.id === id);
    if (!item) throw new Error('This item no longer exists.');
    if (item.etag !== etag) throw new ConflictError();
    Object.assign(item.fields, fields);
    item.version += 1;
    item.etag = `"${item.version}"`;
    item.modified = this.now();
    item.modifiedBy = this.user;
    await this.persist();
    return LocalStore.out(item);
  }

  async remove(listName: string, id: number, etag: string) {
    const t = await this.table(listName);
    const idx = t.items.findIndex((x) => x.id === id);
    if (idx < 0) return;
    if (t.items[idx].etag !== etag) throw new ConflictError();
    t.items.splice(idx, 1);
    await this.persist();
  }
}

// ---------------------------------------------------------------- SharePoint

interface GraphItem {
  id: string;
  eTag: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  lastModifiedBy?: { user?: { displayName?: string } };
  fields: Record<string, unknown>;
}

const systemFields = new Set(['@odata.etag', 'id', 'ContentType', 'Modified', 'Created', 'AuthorLookupId', 'EditorLookupId', '_UIVersionString', 'Attachments', 'Edit', 'LinkTitleNoMenu', 'LinkTitle', 'ItemChildCount', 'FolderChildCount', '_ComplianceFlags', '_ComplianceTag', '_ComplianceTagWrittenTime', '_ComplianceTagUserId', 'AppAuthorLookupId', 'AppEditorLookupId']);

export class SharePointStore implements DataStore {
  readonly kind = 'sharepoint' as const;
  private ids: Promise<{ siteId: string; lists: Map<string, string> }> | null = null;

  constructor(
    private graph: GraphClient,
    private siteUrl: string,
  ) {}

  private resolve() {
    this.ids ??= (async () => {
      const site = await resolveSite(this.graph, this.siteUrl);
      const all = await this.graph.getAll<{ id: string; displayName: string }>(`/sites/${site.id}/lists?$select=id,displayName`);
      return { siteId: site.id, lists: new Map(all.map((l) => [l.displayName, l.id])) };
    })();
    return this.ids;
  }

  private async base(listName: string) {
    const { siteId, lists } = await this.resolve();
    const id = lists.get(listName);
    if (!id) throw new Error(`The list ${listName} is missing. Run "Set up or update site" in Administration.`);
    return `/sites/${siteId}/lists/${id}/items`;
  }

  private static out(i: GraphItem): StoredItem {
    const fields: Fields = {};
    for (const [k, v] of Object.entries(i.fields)) if (!systemFields.has(k)) fields[k] = v as Fields[string];
    return { id: Number(i.id), etag: i.eTag, fields, created: i.createdDateTime, modified: i.lastModifiedDateTime, modifiedBy: i.lastModifiedBy?.user?.displayName ?? '' };
  }

  async list(listName: string, where?: { field: string; equals: string | number | boolean }) {
    const base = await this.base(listName);
    const filter = where ? `&$filter=fields/${where.field} eq ${typeof where.equals === 'string' ? `'${where.equals.replace(/'/g, "''")}'` : where.equals}` : '';
    const items = await this.graph.getAll<GraphItem>(`${base}?$expand=fields&$top=999${filter}`);
    return items.map(SharePointStore.out);
  }

  async get(listName: string, id: number) {
    try {
      return SharePointStore.out(await this.graph.get<GraphItem>(`${await this.base(listName)}/${id}?$expand=fields`));
    } catch (e) {
      if ((e as { status?: number }).status === 404) return null;
      throw e;
    }
  }

  async create(listName: string, fields: Fields) {
    validate(listName, fields, true);
    return SharePointStore.out(await this.graph.post<GraphItem>(await this.base(listName), { fields }));
  }

  async update(listName: string, id: number, fields: Fields, etag: string) {
    validate(listName, fields, false);
    const base = await this.base(listName);
    await this.graph.patch(`${base}/${id}/fields`, fields, etag);
    const fresh = await this.get(listName, id);
    if (!fresh) throw new Error('This item no longer exists.');
    return fresh;
  }

  async remove(listName: string, id: number, etag: string) {
    await this.graph.request('DELETE', `${await this.base(listName)}/${id}`, undefined, { 'If-Match': etag });
  }
}
