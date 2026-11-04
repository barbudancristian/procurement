import { useState, type ChangeEvent } from 'react';
import {
  Avatar,
  Badge,
  Body1,
  Button,
  Caption1,
  Card,
  Checkbox,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Divider,
  Dropdown,
  Field,
  Input,
  makeStyles,
  MessageBar,
  MessageBarBody,
  Option,
  ProgressBar,
  Radio,
  RadioGroup,
  Spinner,
  Subtitle2,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TabList,
  Text,
  tokens,
} from '@fluentui/react-components';
import {
  Add20Regular,
  ArrowDownload20Regular,
  ArrowReset20Regular,
  Checkmark16Regular,
  CheckmarkCircle20Filled,
  Delete16Regular,
  LockClosed16Regular,
  PersonAdd20Regular,
  PlugConnected20Regular,
  Save20Regular,
  ShieldCheckmark20Regular,
} from '@fluentui/react-icons';
import { PageHeader, Section } from '../../components/common';
import { auditLog, BASE_CURRENCY, currencies, projects, roleLabel, scopeLabel, users, workflows, type Currency, type Role, type Scope, type User } from '../../data/mock';
import { contrast, defaultBranding, type Branding } from '../../theme/branding';
import { useApp } from '../../state/AppContext';
import { LiveConnectionAdmin } from './LiveConnection';

const useStyles = makeStyles({
  card: { backgroundColor: tokens.colorNeutralBackground1, borderRadius: tokens.borderRadiusLarge, border: `1px solid ${tokens.colorNeutralStroke2}`, overflowX: 'auto' },
  muted: { color: tokens.colorNeutralForeground3 },
  who: { display: 'flex', alignItems: 'center', gap: '8px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', '@media (max-width: 1000px)': { gridTemplateColumns: '1fr' } },
  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', '@media (max-width: 640px)': { gridTemplateColumns: '1fr' } },
  swatches: { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' },
  swatch: { width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', border: `2px solid ${tokens.colorNeutralBackground1}`, outline: `1px solid ${tokens.colorNeutralStroke1}` },
  swatchOn: { outline: `3px solid ${tokens.colorNeutralForeground1}` },
  color: { width: '48px', height: '32px', padding: 0, border: 'none', background: 'none', cursor: 'pointer' },
  preview: { border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge, overflow: 'hidden' },
  pvTop: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}` },
  pvLogo: { width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '12px', overflow: 'hidden' },
  pvBody: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' },
  pvReport: { border: `1px solid ${tokens.colorNeutralStroke2}`, padding: '12px', borderRadius: tokens.borderRadiusMedium, fontSize: '12px' },
  stage: { display: 'grid', gridTemplateColumns: '32px 1fr 1fr 1fr auto', gap: '8px', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${tokens.colorNeutralStroke3}`, '@media (max-width: 760px)': { gridTemplateColumns: '32px 1fr' } },
  num: { width: '24px', height: '24px', borderRadius: '50%', backgroundColor: tokens.colorBrandBackground2, color: tokens.colorBrandForeground2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600 },
  check: { display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' },
  ok: { color: tokens.colorPaletteGreenForeground1 },
});

// ---------------- Users & Access ----------------
export function UsersAdmin() {
  const s = useStyles();
  const [list, setList] = useState<User[]>(users);
  const [tab, setTab] = useState<'internal' | 'clients'>('internal');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<Role>('specialist');
  const shown = list.filter((u) => (tab === 'clients' ? u.role === 'client' : u.role !== 'client'));
  return (
    <>
      <PageHeader
        title="Users & Access"
        subtitle="Roles come from Entra ID security groups; changes here update group membership and SharePoint permissions."
        actions={
          <Dialog>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="primary" icon={<PersonAdd20Regular />}>
                {tab === 'clients' ? 'Invite client guest' : 'Add user'}
              </Button>
            </DialogTrigger>
            <DialogSurface>
              <DialogBody>
                <DialogTitle>{tab === 'clients' ? 'Invite a client guest' : 'Add an internal user'}</DialogTitle>
                <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Field label="Work email" required hint={tab === 'clients' ? 'An Entra B2B invitation is sent; the guest must sign in with MFA.' : 'Must be an existing account in your organisation.'}>
                    <Input value={newEmail} onChange={(_, d) => setNewEmail(d.value)} type="email" />
                  </Field>
                  {tab === 'internal' ? (
                    <Field label="Role">
                      <Dropdown value={roleLabel[newRole]} selectedOptions={[newRole]} onOptionSelect={(_, d) => setNewRole(d.optionValue as Role)}>
                        {(['admin', 'manager', 'specialist', 'stakeholder'] as Role[]).map((r) => (
                          <Option key={r} value={r}>
                            {roleLabel[r]}
                          </Option>
                        ))}
                      </Dropdown>
                    </Field>
                  ) : (
                    <Field label="Client site">
                      <Dropdown defaultValue="Northwind Logistics" defaultSelectedOptions={['Northwind Logistics']}>
                        <Option>Northwind Logistics</Option>
                        <Option>Fabrikam Retail</Option>
                      </Dropdown>
                    </Field>
                  )}
                </DialogContent>
                <DialogActions>
                  <DialogTrigger disableButtonEnhancement>
                    <Button>Cancel</Button>
                  </DialogTrigger>
                  <DialogTrigger disableButtonEnhancement>
                    <Button
                      appearance="primary"
                      disabled={!newEmail.includes('@')}
                      onClick={() => {
                        const name = newEmail.split('@')[0].split('.').map((x) => x[0]?.toUpperCase() + x.slice(1)).join(' ');
                        setList([...list, { id: `n${list.length}`, name, email: newEmail, role: tab === 'clients' ? 'client' : newRole, department: tab === 'clients' ? 'Guest' : 'Procurement', lastActive: '—', active: true }]);
                        setNewEmail('');
                      }}
                    >
                      {tab === 'clients' ? 'Send invitation' : 'Add'}
                    </Button>
                  </DialogTrigger>
                </DialogActions>
              </DialogBody>
            </DialogSurface>
          </Dialog>
        }
      />
      <TabList selectedValue={tab} onTabSelect={(_, d) => setTab(d.value as 'internal' | 'clients')} style={{ marginBottom: 12 }}>
        <Tab value="internal">Internal users ({list.filter((u) => u.role !== 'client').length})</Tab>
        <Tab value="clients">Client guests ({list.filter((u) => u.role === 'client').length})</Tab>
      </TabList>
      <div className={s.card}>
        <Table aria-label="Users">
          <TableHeader>
            <TableRow>
              <TableHeaderCell>User</TableHeaderCell>
              <TableHeaderCell>{tab === 'clients' ? 'Organisation' : 'Department'}</TableHeaderCell>
              <TableHeaderCell>Role</TableHeaderCell>
              <TableHeaderCell>Last active</TableHeaderCell>
              <TableHeaderCell>Access</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <span className={s.who}>
                    <Avatar name={u.name} size={28} />
                    <span>
                      <Text weight="semibold">{u.name}</Text>
                      <Caption1 className={s.muted} block>
                        {u.email}
                      </Caption1>
                    </span>
                  </span>
                </TableCell>
                <TableCell>{u.department}</TableCell>
                <TableCell>
                  {u.role === 'client' ? (
                    <Badge appearance="tint" color="subtle">Client Viewer (read only)</Badge>
                  ) : (
                    <Dropdown
                      size="small"
                      value={roleLabel[u.role]}
                      selectedOptions={[u.role]}
                      onOptionSelect={(_, d) => setList(list.map((x) => (x.id === u.id ? { ...x, role: d.optionValue as Role } : x)))}
                      aria-label={`Role for ${u.name}`}
                    >
                      {(['admin', 'manager', 'specialist', 'stakeholder'] as Role[]).map((r) => (
                        <Option key={r} value={r}>
                          {roleLabel[r]}
                        </Option>
                      ))}
                    </Dropdown>
                  )}
                </TableCell>
                <TableCell>{u.lastActive}</TableCell>
                <TableCell>
                  <Switch checked={u.active} onChange={(_, d) => setList(list.map((x) => (x.id === u.id ? { ...x, active: d.checked } : x)))} label={u.active ? 'Active' : 'Disabled'} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Caption1 className={s.muted} block style={{ marginTop: 8 }}>
        Every role or access change is written to the audit log.
      </Caption1>
    </>
  );
}

// ---------------- Workflows ----------------
export function WorkflowsAdmin() {
  const s = useStyles();
  const [scope, setScope] = useState<Scope>('competitive');
  const [defs, setDefs] = useState(() => JSON.parse(JSON.stringify(workflows)) as typeof workflows);
  const stages = defs[scope];
  const update = (i: number, patch: Partial<(typeof stages)[number]>) => setDefs({ ...defs, [scope]: stages.map((st, j) => (j === i ? { ...st, ...patch } : st)) });
  return (
    <>
      <PageHeader title="Workflows" subtitle="Stages, required fields and approval gates for each sourcing scope." actions={<Button appearance="primary" icon={<Save20Regular />}>Save changes</Button>} />
      <TabList selectedValue={scope} onTabSelect={(_, d) => setScope(d.value as Scope)} style={{ marginBottom: 12 }}>
        {(Object.keys(scopeLabel) as Scope[]).map((k) => (
          <Tab key={k} value={k}>
            {scopeLabel[k]}
          </Tab>
        ))}
      </TabList>
      <Section title={`${scopeLabel[scope]} lifecycle`} action={<Button size="small" icon={<Add20Regular />} onClick={() => setDefs({ ...defs, [scope]: [...stages.slice(0, -1), { name: 'New stage' }, stages[stages.length - 1]] })}>Add stage</Button>}>
        {stages.map((st, i) => (
          <div key={i} className={s.stage}>
            <span className={s.num}>{i + 1}</span>
            <Input value={st.name} onChange={(_, d) => update(i, { name: d.value })} aria-label={`Stage ${i + 1} name`} />
            <Input value={(st.required ?? []).join(', ')} placeholder="Required fields (optional)" onChange={(_, d) => update(i, { required: d.value ? d.value.split(',').map((x) => x.trim()) : undefined })} aria-label="Required fields" />
            <Dropdown
              value={st.approval ? `Approval: ${st.approval.split(';')[0]}` : 'No approval'}
              selectedOptions={[st.approval ? 'yes' : 'no']}
              onOptionSelect={(_, d) => update(i, { approval: d.optionValue === 'yes' ? 'Procurement Manager' : undefined })}
              aria-label="Approval gate"
            >
              <Option value="no">No approval</Option>
              <Option value="yes">Approval: Procurement Manager</Option>
            </Dropdown>
            <Button
              appearance="subtle"
              icon={<Delete16Regular />}
              aria-label="Remove stage"
              disabled={i === 0 || i === stages.length - 1}
              onClick={() => setDefs({ ...defs, [scope]: stages.filter((_, j) => j !== i) })}
            />
          </div>
        ))}
        <Caption1 className={s.muted}>
          The first and last stages cannot be removed. Projects already in progress keep their current stage; renamed stages update everywhere.
        </Caption1>
      </Section>
      <Section title="Approval thresholds">
        <div className={s.row2}>
          <Field label="Second approver required above (EUR, converted from project currency)">
            <Input defaultValue="250000" />
          </Field>
          <Field label="Second approver">
            <Dropdown defaultValue="Cristina Barbu (Finance)" defaultSelectedOptions={['u8']}>
              {users
                .filter((u) => u.role === 'manager' || u.role === 'stakeholder')
                .map((u) => (
                  <Option key={u.id} value={u.id}>{`${u.name} (${u.department})`}</Option>
                ))}
            </Dropdown>
          </Field>
        </div>
        <Checkbox defaultChecked label="Sole-source projects always need Procurement Manager approval of the justification" disabled />
      </Section>
    </>
  );
}

// ---------------- Branding ----------------
const presets = ['#0E6F7C', '#1F5FAD', '#5B3FA6', '#B4472A', '#2E7D32', '#37474F'];

export function BrandingAdmin() {
  const s = useStyles();
  const { branding, setBranding, setDark } = useApp();
  const [draft, setDraft] = useState<Branding>(branding);
  const [saved, setSaved] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const ratio = contrast(draft.primaryColor, '#ffffff');
  const set = (patch: Partial<Branding>) => {
    setDraft({ ...draft, ...patch });
    setSaved(false);
  };
  const onLogo = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\/(png|svg\+xml|jpeg)$/.test(f.type) || f.size > 512 * 1024) {
      setLogoError('That file is not a PNG, SVG or JPEG under 512 KB. Please choose another.');
      return;
    }
    setLogoError(null);
    const r = new FileReader();
    r.onload = () => set({ logoDataUrl: String(r.result) });
    r.readAsDataURL(f);
  };
  return (
    <>
      <PageHeader
        title="Branding"
        subtitle="Changes apply to every user's app at its next start, and to reports and client sites. No reinstall needed."
        actions={
          <>
            <Button icon={<ArrowReset20Regular />} onClick={() => set(defaultBranding)}>
              Reset to default
            </Button>
            <Button
              appearance="primary"
              icon={<Save20Regular />}
              disabled={ratio < 4.5}
              onClick={() => {
                setBranding(draft);
                if (draft.defaultMode !== 'system') setDark(draft.defaultMode === 'dark');
                setSaved(true);
              }}
            >
              Save and apply
            </Button>
          </>
        }
      />
      {saved && (
        <MessageBar intent="success" style={{ marginBottom: 12 }}>
          <MessageBarBody>Branding saved and applied. The whole app now uses it.</MessageBarBody>
        </MessageBar>
      )}
      <div className={s.grid}>
        <Section title="Identity">
          <div className={s.form}>
            <div className={s.row2}>
              <Field label="App name" required>
                <Input value={draft.appName} onChange={(_, d) => set({ appName: d.value })} maxLength={40} />
              </Field>
              <Field label="Tagline">
                <Input value={draft.tagline} onChange={(_, d) => set({ tagline: d.value })} maxLength={60} />
              </Field>
            </div>
            <div className={s.row2}>
              <Field label="Logo" hint="PNG, SVG or JPEG, under 512 KB. Square works best." validationState={logoError ? 'error' : 'none'} validationMessage={logoError ?? undefined}>
                <input type="file" accept="image/png,image/svg+xml,image/jpeg" onChange={onLogo} aria-label="Upload logo" />
              </Field>
              <Field label="Initials (used when no logo is uploaded)">
                <Input value={draft.logoText} onChange={(_, d) => set({ logoText: d.value.slice(0, 3).toUpperCase() })} />
              </Field>
            </div>
            {draft.logoDataUrl && (
              <Button size="small" appearance="subtle" onClick={() => set({ logoDataUrl: undefined })}>
                Remove uploaded logo
              </Button>
            )}
            <Divider />
            <Field
              label="Primary colour"
              validationState={ratio < 4.5 ? 'error' : 'success'}
              validationMessage={ratio < 4.5 ? `Contrast with white text is ${ratio.toFixed(1)}:1. Choose a darker colour (at least 4.5:1) so buttons stay readable.` : `Contrast ${ratio.toFixed(1)}:1 meets WCAG AA.`}
            >
              <div className={s.swatches}>
                {presets.map((c) => (
                  <span
                    key={c}
                    className={`${s.swatch} ${draft.primaryColor.toLowerCase() === c.toLowerCase() ? s.swatchOn : ''}`}
                    style={{ backgroundColor: c }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Use colour ${c}`}
                    onClick={() => set({ primaryColor: c })}
                    onKeyDown={(e) => e.key === 'Enter' && set({ primaryColor: c })}
                  />
                ))}
                <input className={s.color} type="color" value={draft.primaryColor} onChange={(e) => set({ primaryColor: e.target.value })} aria-label="Custom colour" />
                <Input value={draft.primaryColor} onChange={(_, d) => /^#[0-9a-fA-F]{0,6}$/.test(d.value) && set({ primaryColor: d.value })} style={{ width: 110 }} aria-label="Hex colour" />
              </div>
            </Field>
            <Field label="Default appearance">
              <RadioGroup layout="horizontal" value={draft.defaultMode} onChange={(_, d) => set({ defaultMode: d.value as Branding['defaultMode'] })}>
                <Radio value="system" label="Follow Windows" />
                <Radio value="light" label="Light" />
                <Radio value="dark" label="Dark" />
              </RadioGroup>
            </Field>
            <Divider />
            <Field label="Report footer" hint="Printed on every PDF and Excel export.">
              <Input value={draft.reportFooter} onChange={(_, d) => set({ reportFooter: d.value })} />
            </Field>
            <Field label="Support contact" hint="Shown on the sign-in screen and in Help.">
              <Input value={draft.supportContact} onChange={(_, d) => set({ supportContact: d.value })} />
            </Field>
            <Caption1 className={s.muted}>The desktop icon and installer name are set when the installer is built; send your logo to IT with the request.</Caption1>
          </div>
        </Section>
        <Section title="Live preview">
          <div className={s.preview}>
            <div className={s.pvTop}>
              <span className={s.pvLogo} style={{ backgroundColor: draft.primaryColor }}>
                {draft.logoDataUrl ? <img src={draft.logoDataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }} /> : draft.logoText}
              </span>
              <Text weight="semibold">{draft.appName || 'App name'}</Text>
              <Caption1 className={s.muted}>{draft.tagline}</Caption1>
            </div>
            <div className={s.pvBody}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ background: draft.primaryColor, color: '#fff', border: 'none', borderRadius: 4, padding: '6px 14px', fontWeight: 600, fontFamily: 'inherit' }}>New project</button>
                <button style={{ background: 'transparent', color: draft.primaryColor, border: `1px solid ${draft.primaryColor}`, borderRadius: 4, padding: '6px 14px', fontFamily: 'inherit' }}>Export</button>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: `linear-gradient(90deg, ${draft.primaryColor} 62%, ${tokens.colorNeutralBackground4} 62%)` }} aria-hidden />
              <div className={s.pvReport}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `2px solid ${draft.primaryColor}`, paddingBottom: 6, marginBottom: 6 }}>
                  <strong>{draft.appName} · Savings report 2026</strong>
                  <span>Page 1</span>
                </div>
                <div>Negotiated savings by category …</div>
                <div className={s.muted} style={{ marginTop: 8 }}>{draft.reportFooter}</div>
              </div>
              <Caption1 className={s.muted}>Sign-in help: {draft.supportContact}</Caption1>
            </div>
          </div>
        </Section>
      </div>
    </>
  );
}

// ---------------- SharePoint connection ----------------
const setupSteps = [
  'Signed in with Entra ID',
  'Site found and app has access (Sites.Selected)',
  'Created 21 lists with columns and indexes',
  'Created "Project Documents" library with versioning',
  'Created confidential lists with restricted permissions',
  'Created permission groups mapped to the 5 roles',
  'Created add-only audit list',
  'Saved settings and branding list',
];

export function ConnectionAdmin() {
  const { live } = useApp();
  return live ? <LiveConnectionAdmin live={live} /> : <DemoConnectionAdmin />;
}

function DemoConnectionAdmin() {
  const s = useStyles();
  const [url, setUrl] = useState('https://contoso.sharepoint.com/sites/ProcurementSourcing');
  const [state, setState] = useState<'idle' | 'testing' | 'tested' | 'setting' | 'done'>('done');
  const [progress, setProgress] = useState(setupSteps.length);
  const run = () => {
    setState('setting');
    setProgress(0);
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setProgress(i);
      if (i >= setupSteps.length) {
        clearInterval(t);
        setState('done');
      }
    }, 450);
  };
  return (
    <>
      <PageHeader title="SharePoint Connection" subtitle="Where the app stores its data and documents. Only administrators can change this." />
      <div className={s.grid}>
        <Section title="Procurement site">
          <div className={s.form}>
            <Field label="SharePoint site URL" hint="A private site created by your SharePoint admin. External sharing must be off.">
              <Input value={url} onChange={(_, d) => { setUrl(d.value); setState('idle'); }} />
            </Field>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button
                icon={<PlugConnected20Regular />}
                onClick={() => {
                  setState('testing');
                  setTimeout(() => setState('tested'), 900);
                }}
              >
                Test connection
              </Button>
              <Button appearance="primary" icon={<ShieldCheckmark20Regular />} disabled={state === 'idle' || state === 'testing' || state === 'setting'} onClick={run}>
                Set up or update site
              </Button>
            </div>
            {state === 'testing' && <Spinner size="tiny" label="Checking sign-in and permissions…" labelPosition="after" />}
            {state === 'tested' && (
              <MessageBar intent="success">
                <MessageBarBody>Connected. You have Full Control on this site and the app is granted access. Run set-up to create or update the lists.</MessageBarBody>
              </MessageBar>
            )}
            {(state === 'setting' || state === 'done') && (
              <>
                <ProgressBar value={progress / setupSteps.length} />
                {setupSteps.map((st, i) => (
                  <div key={st} className={s.check}>
                    {i < progress ? <CheckmarkCircle20Filled className={s.ok} /> : <Spinner size="extra-tiny" />}
                    <Body1>{st}</Body1>
                  </div>
                ))}
              </>
            )}
            {state === 'done' && <Caption1 className={s.muted}>Last checked 4 Nov 2026, 09:02. Set-up is safe to run again; it only adds what is missing.</Caption1>}
          </div>
        </Section>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Section title="Status">
            <div className={s.check}><Checkmark16Regular className={s.ok} /> <Body1>{projects.length} projects loaded</Body1></div>
            <div className={s.check}><Checkmark16Regular className={s.ok} /> <Body1>Integrity check passed (last run 3 Nov 2026)</Body1></div>
            <div className={s.check}><LockClosed16Regular /> <Body1>Signed in as Alex Georgescu with MFA</Body1></div>
            <Button size="small">Run integrity check now</Button>
          </Section>
          <Section title="Client sites">
            <Table size="small" aria-label="Client sites">
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Client</TableHeaderCell>
                  <TableHeaderCell>Guests</TableHeaderCell>
                  <TableHeaderCell>Published items</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Northwind Logistics</TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>9</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Fabrikam Retail</TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>3</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <Button size="small" icon={<Add20Regular />}>Connect a client site</Button>
          </Section>
          <Section title="Backup">
            <Body1>Export a complete copy of all lists and document metadata (Excel + JSON). Documents stay protected by SharePoint versioning and retention.</Body1>
            <Button icon={<ArrowDownload20Regular />}>Export full backup</Button>
          </Section>
        </div>
      </div>
    </>
  );
}

// ---------------- Audit log ----------------
export function AuditAdmin() {
  const s = useStyles();
  const [q, setQ] = useState('');
  const rows = auditLog.filter((r) => `${r.user} ${r.action} ${r.record}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader
        title="Audit Log"
        subtitle="Business events recorded by the app. Entries cannot be edited or deleted. Sign-ins and file access are also in Microsoft Purview."
        actions={<Button icon={<ArrowDownload20Regular />}>Export CSV</Button>}
      />
      <Input value={q} onChange={(_, d) => setQ(d.value)} placeholder="Filter by user, action or record" style={{ minWidth: 320, marginBottom: 12 }} aria-label="Filter audit log" />
      <Card className={s.card}>
        <Table size="small" aria-label="Audit log">
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Time (UTC)</TableHeaderCell>
              <TableHeaderCell>User</TableHeaderCell>
              <TableHeaderCell>Action</TableHeaderCell>
              <TableHeaderCell>Record</TableHeaderCell>
              <TableHeaderCell>Device</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i}>
                <TableCell>{r.time}</TableCell>
                <TableCell>{r.user}</TableCell>
                <TableCell>
                  <Badge appearance="tint" color={r.action.includes('refused') ? 'danger' : r.action.includes('Permission') ? 'warning' : 'informative'}>
                    {r.action}
                  </Badge>
                </TableCell>
                <TableCell>{r.record}</TableCell>
                <TableCell>{r.source}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Subtitle2 style={{ display: 'block', marginTop: 16 }}>Changes made outside the app</Subtitle2>
      <Caption1 className={s.muted}>The integrity check compares SharePoint version history with this log. None found in the last 30 days.</Caption1>
    </>
  );
}

// ---------------- Currencies ----------------
const knownCodes: string[] = (() => {
  try {
    return (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf('currency');
  } catch {
    return [];
  }
})();

export function CurrenciesAdmin() {
  const s = useStyles();
  const [list, setList] = useState<Currency[]>(() => currencies.map((c) => ({ ...c })));
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [msg, setMsg] = useState<{ intent: 'success' | 'error'; text: string } | null>(null);
  const codeOk = /^[A-Z]{3}$/.test(code) && (knownCodes.length === 0 || knownCodes.includes(code));
  const exists = list.some((c) => c.code === code);
  const rateOk = Number(rate) > 0;

  const save = () => {
    currencies.splice(0, currencies.length, ...list);
    setMsg({ intent: 'success', text: 'Currencies saved. New projects can use every active currency.' });
  };
  const add = () => {
    if (!codeOk || exists || !rateOk || !name) {
      setMsg({ intent: 'error', text: exists ? `${code} is already in the list.` : 'Enter a valid 3-letter ISO code (for example TRY), a name and a rate above 0.' });
      return;
    }
    setList([...list, { code, name, rateToBase: Number(rate), active: true, updated: '2026-11-04' }]);
    setCode('');
    setName('');
    setRate('');
    setMsg(null);
  };

  return (
    <>
      <PageHeader
        title="Currencies"
        subtitle="Projects keep amounts in their own currency. Dashboards and reports convert them to the base currency with these rates."
        actions={
          <Button appearance="primary" icon={<Save20Regular />} onClick={save}>
            Save changes
          </Button>
        }
      />
      {msg && (
        <MessageBar intent={msg.intent} style={{ marginBottom: 12 }}>
          <MessageBarBody>{msg.text}</MessageBarBody>
        </MessageBar>
      )}
      <div className={s.grid}>
        <Section title="Currency list" action={<Caption1 className={s.muted}>Base currency: EUR</Caption1>}>
          <div style={{ overflowX: 'auto' }}>
            <Table size="small" aria-label="Currencies">
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Currency</TableHeaderCell>
                  <TableHeaderCell>1 unit in EUR</TableHeaderCell>
                  <TableHeaderCell>Updated</TableHeaderCell>
                  <TableHeaderCell>Available</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((c) => (
                  <TableRow key={c.code}>
                    <TableCell>
                      <Text weight="semibold">{c.code}</Text> <Caption1 className={s.muted}>{c.name}</Caption1>{' '}
                      {c.code === BASE_CURRENCY && (
                        <Badge appearance="tint" color="brand" size="small">
                          Base
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        size="small"
                        style={{ width: 110 }}
                        type="number"
                        step="0.0001"
                        min="0"
                        disabled={c.code === BASE_CURRENCY}
                        value={String(c.rateToBase)}
                        aria-label={`Rate for ${c.code}`}
                        onChange={(_, d) => setList(list.map((x) => (x.code === c.code ? { ...x, rateToBase: Number(d.value), updated: '2026-11-04' } : x)))}
                      />
                    </TableCell>
                    <TableCell>{c.updated}</TableCell>
                    <TableCell>
                      <Switch
                        checked={c.active}
                        disabled={c.code === BASE_CURRENCY}
                        aria-label={`${c.code} available for new projects`}
                        onChange={(_, d) => setList(list.map((x) => (x.code === c.code ? { ...x, active: d.checked } : x)))}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Caption1 className={s.muted}>
            Switching a currency off hides it for new projects only; existing projects keep their amounts. Rates shown are examples.
          </Caption1>
        </Section>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Section title="Add a currency">
            <div className={s.form}>
              <div className={s.row2} style={{ alignItems: 'start' }}>
                <Field label="ISO code" required hint="3 letters, for example TRY" validationState={code && !codeOk ? 'error' : 'none'} validationMessage={code && !codeOk ? 'Not a recognised ISO 4217 code.' : undefined}>
                  <Input value={code} maxLength={3} onChange={(_, d) => setCode(d.value.toUpperCase().replace(/[^A-Z]/g, ''))} />
                </Field>
                <Field label="Name" required>
                  <Input value={name} onChange={(_, d) => setName(d.value)} placeholder="e.g. Turkish lira" />
                </Field>
              </div>
              <Field label="1 unit in EUR" required hint="How many euros one unit is worth.">
                <Input value={rate} onChange={(_, d) => setRate(d.value)} type="number" step="0.0001" min="0" />
              </Field>
              <Button icon={<Add20Regular />} onClick={add}>
                Add currency
              </Button>
            </div>
          </Section>
          <Section title="Keeping rates current">
            <Body1>Enter rates monthly, or paste them from your finance team's rate sheet. Reports show the rate date they used.</Body1>
            <Caption1 className={s.muted}>Automatic import from the European Central Bank is possible later if IT allows the app to reach that site.</Caption1>
          </Section>
        </div>
      </div>
    </>
  );
}
