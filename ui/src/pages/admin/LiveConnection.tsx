import { useState } from 'react';
import {
  Body1,
  Button,
  Caption1,
  Field,
  Input,
  makeStyles,
  MessageBar,
  MessageBarBody,
  ProgressBar,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  tokens,
} from '@fluentui/react-components';
import { Checkmark16Regular, Copy16Regular, LockClosed16Regular, PlugConnected20Regular, Save20Regular, ShieldCheckmark20Regular } from '@fluentui/react-icons';
import { PageHeader, Section } from '../../components/common';
import { useApp, type LiveSession } from '../../state/AppContext';
import { setUpSite, testConnection, type ConnectionReport, type SetupStep } from '../../sp/provision';
import { lists, SCHEMA_VERSION } from '../../sp/schema';
import { sitePathFromUrl } from '../../sp/graph';

const useStyles = makeStyles({
  grid: { display: 'grid', gridTemplateColumns: 'minmax(0,3fr) minmax(0,2fr)', gap: '16px', '@media (max-width: 1000px)': { gridTemplateColumns: '1fr' } },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  row: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  check: { display: 'flex', alignItems: 'center', gap: '8px', padding: '2px 0' },
  muted: { color: tokens.colorNeutralForeground3 },
  code: { fontFamily: tokens.fontFamilyMonospace, fontSize: tokens.fontSizeBase200, whiteSpace: 'pre-wrap', wordBreak: 'break-all', backgroundColor: tokens.colorNeutralBackground3, padding: '8px', borderRadius: tokens.borderRadiusMedium, margin: 0 },
  tableWrap: { maxHeight: '320px', overflowY: 'auto' },
});

const statusLabel: Record<SetupStep['status'], string> = { created: 'Created', updated: 'Updated', unchanged: 'Up to date' };

export function LiveConnectionAdmin({ live }: { live: LiveSession }) {
  const s = useStyles();
  const { setLiveConfig } = useApp();
  const [url, setUrl] = useState(live.config.siteUrl ?? '');
  const [busy, setBusy] = useState<'' | 'test' | 'setup' | 'save'>('');
  const [error, setError] = useState('');
  const [report, setReport] = useState<ConnectionReport | null>(null);
  const [steps, setSteps] = useState<SetupStep[]>([]);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const urlError = (() => {
    if (!url) return '';
    try {
      sitePathFromUrl(url);
      return '';
    } catch (e) {
      return (e as Error).message;
    }
  })();

  const guard = async (kind: typeof busy, fn: () => Promise<void>) => {
    setBusy(kind);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy('');
    }
  };

  const test = () => guard('test', async () => setReport(await testConnection(live.graph, url)));
  const setup = () =>
    guard('setup', async () => {
      setSteps([]);
      await setUpSite(live.graph, url, (step) => setSteps((prev) => [...prev, step]));
      setReport(await testConnection(live.graph, url));
    });
  const save = () =>
    guard('save', async () => {
      setLiveConfig(await live.host.setSiteUrl(url));
      setSaved(true);
    });

  const itConfig = JSON.stringify({ tenantId: live.config.tenantId, clientId: live.config.clientId, siteUrl: url || live.config.siteUrl }, null, 2);
  const isSaved = !!url && url === live.config.siteUrl;

  return (
    <>
      <PageHeader title="SharePoint Connection" subtitle="Where the app stores its data and documents. Only administrators can change this." />
      <div className={s.grid}>
        <Section title="Procurement site">
          <div className={s.form}>
            <Field
              label="SharePoint site URL"
              validationState={urlError ? 'error' : 'none'}
              validationMessage={urlError || undefined}
              hint="A private site created by your SharePoint admin, with external sharing off."
            >
              <Input
                value={url}
                placeholder="https://yourcompany.sharepoint.com/sites/ProcurementSourcing"
                onChange={(_, d) => {
                  setUrl(d.value.trim());
                  setReport(null);
                  setSteps([]);
                  setSaved(false);
                }}
              />
            </Field>
            <div className={s.row}>
              <Button icon={<PlugConnected20Regular />} disabled={!url || !!urlError || !!busy} onClick={test}>
                {busy === 'test' ? 'Checking…' : 'Test connection'}
              </Button>
              <Button appearance="primary" icon={<ShieldCheckmark20Regular />} disabled={!report || !!busy} onClick={setup}>
                {busy === 'setup' ? 'Setting up…' : 'Set up or update site'}
              </Button>
              <Button icon={<Save20Regular />} disabled={!report?.upToDate || isSaved || !!busy} onClick={save}>
                Use this site
              </Button>
            </div>

            {error && (
              <MessageBar intent="error">
                <MessageBarBody>{error}</MessageBarBody>
              </MessageBar>
            )}
            {report && !error && busy !== 'setup' && (
              <MessageBar intent={report.upToDate ? 'success' : 'warning'}>
                <MessageBarBody>
                  Connected to <strong>{report.site.name}</strong>.{' '}
                  {report.upToDate
                    ? `The site is set up (data model version ${report.schemaVersion}).`
                    : report.schemaVersion === null
                      ? `The site has not been set up yet. Set-up will create ${report.missingLists.length} lists.`
                      : `Set-up needs to add or update ${report.missingLists.length || 'some'} lists (site version ${report.schemaVersion}, app version ${SCHEMA_VERSION}).`}
                </MessageBarBody>
              </MessageBar>
            )}
            {saved && (
              <MessageBar intent="success">
                <MessageBarBody>Saved. This computer now uses this site. To connect every user automatically, give IT the settings on the right.</MessageBarBody>
              </MessageBar>
            )}

            {(busy === 'setup' || steps.length > 0) && (
              <>
                <ProgressBar value={steps.length / lists.length} />
                <div className={s.tableWrap}>
                  <Table size="small" aria-label="Set-up progress">
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell>List</TableHeaderCell>
                        <TableHeaderCell>Result</TableHeaderCell>
                        <TableHeaderCell>Details</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {steps.map((st) => (
                        <TableRow key={st.list}>
                          <TableCell>{st.list}</TableCell>
                          <TableCell>{statusLabel[st.status]}</TableCell>
                          <TableCell>{st.detail}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
            <Caption1 className={s.muted}>Set-up is safe to run again. It only adds what is missing and never deletes data.</Caption1>
          </div>
        </Section>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Section title="Status">
            <div className={s.check}>
              <LockClosed16Regular /> <Body1>Signed in as {live.session.name}</Body1>
            </div>
            <div className={s.check}>
              <Checkmark16Regular /> <Body1>App version {live.config.appVersion}</Body1>
            </div>
            <div className={s.check}>
              <Checkmark16Regular />
              <Body1>
                {live.config.siteUrl
                  ? `Site ${live.config.siteUrlSource === 'machine' ? 'set by IT for all users' : 'set on this computer'}`
                  : 'No site selected yet'}
              </Body1>
            </div>
          </Section>
          <Section title="Settings for IT">
            <Body1 block>
              To connect every user automatically, IT saves this as <code>C:\ProgramData\Sourcing Hub\config.json</code> in the VDI image, or deploys it with the installer.
            </Body1>
            <pre className={s.code}>{itConfig}</pre>
            <div>
              <Button
                size="small"
                icon={<Copy16Regular />}
                onClick={() =>
                  navigator.clipboard.writeText(itConfig).then(
                    () => setCopied(true),
                    () => setCopied(false),
                  )
                }
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}
