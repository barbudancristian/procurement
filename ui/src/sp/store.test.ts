import { describe, expect, it } from 'vitest';
import { ConflictError } from './graph';
import { LocalStore, validate, type LocalFile } from './store';
import { SCHEMA_VERSION } from './schema';

function memoryFile(initial: string | null = null) {
  const f = { content: initial, writes: 0 };
  const file: LocalFile = {
    read: async () => f.content,
    write: async (c) => {
      f.content = c;
      f.writes++;
    },
  };
  return { f, file };
}

const project = { Title: 'Print services', Reference: 'CS-2026-0001', Scope: 'competitive', Status: 'Draft', Currency: 'EUR' };

describe('local database', () => {
  it('creates, reads, filters, updates and deletes items', async () => {
    const { f, file } = memoryFile();
    const db = new LocalStore(file, 'Dan', () => '2026-11-04T10:00:00Z');
    const a = await db.create('SH_Projects', project);
    const b = await db.create('SH_Projects', { ...project, Reference: 'SS-2026-0001', Scope: 'sole' });
    expect([a.id, b.id]).toEqual([1, 2]);
    expect(a.modifiedBy).toBe('Dan');
    expect(await db.list('SH_Projects', { field: 'Scope', equals: 'sole' })).toHaveLength(1);

    const a2 = await db.update('SH_Projects', a.id, { Status: 'In progress' }, a.etag);
    expect(a2.fields.Status).toBe('In progress');
    expect(a2.etag).not.toBe(a.etag);

    await db.remove('SH_Projects', b.id, b.etag);
    expect(await db.get('SH_Projects', b.id)).toBeNull();
    expect(f.writes).toBe(4);
  });

  it('keeps data across restarts and never reuses an id', async () => {
    const { f, file } = memoryFile();
    const first = new LocalStore(file, 'Dan');
    const a = await first.create('SH_Projects', project);
    await first.remove('SH_Projects', a.id, a.etag);
    const reopened = new LocalStore(memoryFile(f.content).file, 'Dan');
    const b = await reopened.create('SH_Projects', project);
    expect(b.id).toBe(2);
  });

  it('refuses a save based on an old copy', async () => {
    const { file } = memoryFile();
    const db = new LocalStore(file, 'Dan');
    const a = await db.create('SH_Projects', project);
    await db.update('SH_Projects', a.id, { Status: 'In progress' }, a.etag);
    await expect(db.update('SH_Projects', a.id, { Status: 'Cancelled' }, a.etag)).rejects.toBeInstanceOf(ConflictError);
    await expect(db.remove('SH_Projects', a.id, a.etag)).rejects.toBeInstanceOf(ConflictError);
  });

  it('writes changes in order even when they overlap', async () => {
    const order: string[] = [];
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const file: LocalFile = {
      read: async () => null,
      write: async (c) => {
        if (order.length === 0) await gate;
        order.push(String((JSON.parse(c) as { lists: { SH_Projects: { items: unknown[] } } }).lists.SH_Projects.items.length));
      },
    };
    const db = new LocalStore(file, 'Dan');
    const p1 = db.create('SH_Projects', project);
    const p2 = db.create('SH_Projects', project);
    release();
    await Promise.all([p1, p2]);
    expect(order).toEqual(['1', '2']);
  });

  it('refuses files that are not Sourcing Hub databases or are too new', async () => {
    await expect(new LocalStore(memoryFile('{"hello":1}').file, 'Dan').list('SH_Projects')).rejects.toThrow(/not a Sourcing Hub database/);
    const newer = JSON.stringify({ format: 'sourcing-hub-local', formatVersion: 1, schemaVersion: SCHEMA_VERSION + 1, lists: {} });
    await expect(new LocalStore(memoryFile(newer).file, 'Dan').list('SH_Projects')).rejects.toThrow(/newer version/);
  });
});

describe('validation shared by both storage options', () => {
  it('rejects unknown lists, unknown columns and wrong value types', () => {
    expect(() => validate('Nope', {}, true)).toThrow(/Unknown list/);
    expect(() => validate('SH_Projects', { ...project, Colour: 'red' }, true)).toThrow(/no column Colour/);
    expect(() => validate('SH_Projects', { ...project, EstimatedSpend: '100' }, true)).toThrow(/invalid value/);
    expect(() => validate('SH_Projects', { ...project, Status: 'Finished' }, true)).toThrow(/invalid value/);
  });
  it('requires required columns on new items only', () => {
    expect(() => validate('SH_Projects', { Title: 'x' }, true)).toThrow(/required/);
    expect(() => validate('SH_Projects', { Status: 'Completed' }, false)).not.toThrow();
  });
});
