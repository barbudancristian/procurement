// "Set up site": creates or upgrades the lists, columns, indexes and library
// Sourcing Hub needs. It only adds what is missing, so it is safe to run again.

import { GraphClient, GraphError, sitePathFromUrl } from './graph';
import { lists as schemaLists, SCHEMA_VERSION, type ColumnDef, type ListDef } from './schema';

export interface SiteInfo {
  id: string;
  name: string;
  webUrl: string;
}

interface GraphList {
  id: string;
  displayName: string;
}

interface GraphColumn {
  id: string;
  name: string;
  indexed?: boolean;
}

export type StepStatus = 'created' | 'updated' | 'unchanged';

export interface SetupStep {
  list: string;
  status: StepStatus;
  detail: string;
}

export interface SetupResult {
  site: SiteInfo;
  steps: SetupStep[];
  schemaVersion: number;
}

export interface ConnectionReport {
  site: SiteInfo;
  /** Version recorded in the site, or null if the site has never been set up. */
  schemaVersion: number | null;
  missingLists: string[];
  upToDate: boolean;
}

/** Graph column definition for one schema column. */
export function columnPayload(c: ColumnDef): Record<string, unknown> {
  const base: Record<string, unknown> = { name: c.name, displayName: c.name, required: !!c.required, indexed: !!c.indexed };
  switch (c.type) {
    case 'text':
      return { ...base, text: { allowMultipleLines: false, maxLength: 255 } };
    case 'note':
      return { ...base, indexed: false, text: { allowMultipleLines: true, linesForEditing: 6, textType: 'plain' } };
    case 'number':
      return { ...base, number: { decimalPlaces: 'automatic' } };
    case 'currency':
      return { ...base, currency: { locale: 'en-gb' } };
    case 'dateTime':
      return { ...base, dateTime: { format: c.dateOnly ? 'dateOnly' : 'dateTime', displayAs: 'standard' } };
    case 'boolean':
      return { ...base, boolean: {} };
    case 'choice':
      return { ...base, choice: { allowTextEntry: false, choices: c.choices ?? [], displayAs: 'dropDownMenu' } };
    case 'person':
      return { ...base, personOrGroup: { allowMultipleSelection: false, chooseFromType: 'peopleOnly', displayAs: 'nameWithPresence' } };
  }
}

export async function resolveSite(graph: GraphClient, siteUrl: string): Promise<SiteInfo> {
  try {
    const s = await graph.get<{ id: string; displayName?: string; name?: string; webUrl: string }>(`${sitePathFromUrl(siteUrl)}?$select=id,displayName,name,webUrl`);
    return { id: s.id, name: s.displayName ?? s.name ?? '', webUrl: s.webUrl };
  } catch (e) {
    if (e instanceof GraphError && e.status === 404) throw new Error('No site was found at this address. Check the URL with your SharePoint admin.');
    if (e instanceof GraphError && e.status === 403) throw new Error('You or the app do not have access to this site. Ask IT to grant the app access to it (see the IT checklist).');
    throw e;
  }
}

async function existingLists(graph: GraphClient, siteId: string) {
  const all = await graph.getAll<GraphList>(`/sites/${siteId}/lists?$select=id,displayName`);
  return new Map(all.map((l) => [l.displayName, l]));
}

async function readSchemaVersion(graph: GraphClient, siteId: string, settingsListId: string): Promise<{ version: number | null; itemId?: string }> {
  const items = await graph.getAll<{ id: string; fields: { Title?: string; SettingValue?: string } }>(
    `/sites/${siteId}/lists/${settingsListId}/items?$expand=fields($select=Title,SettingValue)&$top=200`,
  );
  const row = items.find((i) => i.fields.Title === 'SchemaVersion');
  return row ? { version: Number(row.fields.SettingValue) || 0, itemId: row.id } : { version: null };
}

/** Checks access and reports whether set-up is needed. Makes no changes. */
export async function testConnection(graph: GraphClient, siteUrl: string): Promise<ConnectionReport> {
  const site = await resolveSite(graph, siteUrl);
  const have = await existingLists(graph, site.id);
  const missingLists = schemaLists.filter((l) => !have.has(l.name)).map((l) => l.name);
  const settings = have.get('SH_Settings');
  const schemaVersion = settings ? (await readSchemaVersion(graph, site.id, settings.id)).version : null;
  return { site, schemaVersion, missingLists, upToDate: missingLists.length === 0 && schemaVersion === SCHEMA_VERSION };
}

async function ensureList(graph: GraphClient, siteId: string, def: ListDef, have: Map<string, GraphList>): Promise<SetupStep & { id: string }> {
  const found = have.get(def.name);
  if (!found) {
    const created = await graph.post<GraphList>(`/sites/${siteId}/lists`, {
      displayName: def.name,
      description: def.description,
      list: { template: def.template, contentTypesEnabled: false, hidden: false },
      columns: def.columns.map(columnPayload),
    });
    return { id: created.id, list: def.name, status: 'created', detail: `${def.columns.length} columns` };
  }
  const cols = await graph.getAll<GraphColumn>(`/sites/${siteId}/lists/${found.id}/columns?$select=id,name,indexed`);
  const byName = new Map(cols.map((c) => [c.name, c]));
  const changes: string[] = [];
  for (const c of def.columns) {
    const col = byName.get(c.name);
    if (!col) {
      await graph.post(`/sites/${siteId}/lists/${found.id}/columns`, columnPayload(c));
      changes.push(`added ${c.name}`);
    } else if (c.indexed && !col.indexed) {
      await graph.patch(`/sites/${siteId}/lists/${found.id}/columns/${col.id}`, { indexed: true });
      changes.push(`indexed ${c.name}`);
    }
  }
  return { id: found.id, list: def.name, status: changes.length ? 'updated' : 'unchanged', detail: changes.join(', ') || 'up to date' };
}

/**
 * Creates or upgrades every list in the schema, then records the schema version.
 * onStep is called after each list so the screen can show progress.
 */
export async function setUpSite(graph: GraphClient, siteUrl: string, onStep?: (step: SetupStep, done: number, total: number) => void): Promise<SetupResult> {
  const site = await resolveSite(graph, siteUrl);
  const have = await existingLists(graph, site.id);
  const existingSettings = have.get('SH_Settings');
  if (existingSettings) {
    const v = (await readSchemaVersion(graph, site.id, existingSettings.id)).version;
    if (v !== null && v > SCHEMA_VERSION) throw new Error('This site was set up by a newer version of the app. Install the latest version before running set-up.');
  }
  const steps: SetupStep[] = [];
  let settingsId = '';
  for (const def of schemaLists) {
    const step = await ensureList(graph, site.id, def, have);
    if (def.name === 'SH_Settings') settingsId = step.id;
    const { id: _id, ...rest } = step;
    steps.push(rest);
    onStep?.(rest, steps.length, schemaLists.length);
  }
  const current = await readSchemaVersion(graph, site.id, settingsId);
  if (current.version === null) {
    await graph.post(`/sites/${site.id}/lists/${settingsId}/items`, { fields: { Title: 'SchemaVersion', SettingValue: String(SCHEMA_VERSION) } });
  } else if (current.version < SCHEMA_VERSION) {
    await graph.patch(`/sites/${site.id}/lists/${settingsId}/items/${current.itemId}/fields`, { SettingValue: String(SCHEMA_VERSION) });
  }
  return { site, steps, schemaVersion: SCHEMA_VERSION };
}
