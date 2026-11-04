import { useEffect, useState, type ReactNode } from 'react';
import { Body1, Button, Caption1, Card, makeStyles, MessageBar, MessageBarBody, Subtitle2, Title2, tokens } from '@fluentui/react-components';
import { Cloud24Regular, Desktop24Regular, Database20Regular, Play24Regular } from '@fluentui/react-icons';
import { PageHeader, Section } from '../../components/common';
import { useApp, type LiveSession } from '../../state/AppContext';
import { getHost, type LocalDbInfo, type StorageMode } from '../../sp/host';

const useStyles = makeStyles({
  wrap: { minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', boxSizing: 'border-box' },
  inner: { maxWidth: '980px', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px', '@media (max-width: 800px)': { gridTemplateColumns: '1fr' } },
  card: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' },
  icon: { color: tokens.colorBrandForeground1 },
  muted: { color: tokens.colorNeutralForeground3 },
  grow: { flexGrow: 1 },
  kv: { display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px 12px', wordBreak: 'break-all' },
});

function Option({ icon, title, text, note, action, disabled, onClick }: { icon: ReactNode; title: string; text: string; note: string; action: string; disabled?: boolean; onClick: () => void }) {
  const s = useStyles();
  return (
    <Card className={s.card}>
      <span className={s.icon}>{icon}</span>
      <Subtitle2>{title}</Subtitle2>
      <Body1 className={s.grow}>{text}</Body1>
      <Caption1 className={s.muted}>{note}</Caption1>
      <Button appearance={disabled ? 'secondary' : 'primary'} disabled={disabled} onClick={onClick}>
        {action}
      </Button>
    </Card>
  );
}

/** First start of the desktop app: choose where data is kept. */
export function StorageChoice({ sharePointAvailable }: { sharePointAvailable: boolean }) {
  const s = useStyles();
  const { branding } = useApp();
  const [error, setError] = useState('');
  const choose = (mode: StorageMode) => getHost()?.setMode(mode).catch((e: Error) => setError(e.message));
  return (
    <div className={s.wrap}>
      <div className={s.inner}>
        <Title2>Welcome to {branding.appName}</Title2>
        <Body1>Choose where this computer keeps its sourcing data. You can change this later in Administration.</Body1>
        <div className={s.cards}>
          <Option
            icon={<Cloud24Regular />}
            title="SharePoint (team)"
            text="Everyone works on the same projects, suppliers and documents, stored in your company's SharePoint site."
            note={sharePointAvailable ? 'Signs you in with your Microsoft work account.' : 'Not available yet: IT must register the app and install its settings first.'}
            action="Use SharePoint"
            disabled={!sharePointAvailable}
            onClick={() => choose('sharepoint')}
          />
          <Option
            icon={<Desktop24Regular />}
            title="Local database (one user)"
            text="All data stays in one database file on this computer. No SharePoint or IT set-up needed."
            note="Best for a single buyer. Keep the file in a backed-up folder. It can be moved to SharePoint later."
            action="Use a local database"
            onClick={() => choose('local')}
          />
          <Option
            icon={<Play24Regular />}
            title="Demo"
            text="Explore or present the app with realistic sample data and switch between the five roles."
            note="Changes are kept on this computer until you reset the demo data."
            action="Open the demo"
            onClick={() => choose('demo')}
          />
        </div>
        {error && (
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        )}
      </div>
    </div>
  );
}

const size = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);

/** Administration screen in local-database mode. */
export function LocalStorageAdmin({ live }: { live: LiveSession }) {
  const s = useStyles();
  const [info, setInfo] = useState<LocalDbInfo | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    live.host.localDbInfo().then(setInfo, (e: Error) => setError(e.message));
  }, [live.host]);
  return (
    <>
      <PageHeader title="Data storage" subtitle="This computer keeps all data in a local database for a single user." actions={<ChangeStorageButton />} />
      <Section title="Local database">
        {error && (
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        )}
        {info && (
          <div className={s.kv}>
            <span className={s.muted}>Database file</span>
            <span>{info.path}</span>
            <span className={s.muted}>Size</span>
            <span>{size(info.sizeBytes)}</span>
            <span className={s.muted}>Last saved</span>
            <span>{info.lastSaved ? new Date(info.lastSaved).toLocaleString('en-GB') : 'Nothing saved yet'}</span>
            <span className={s.muted}>Backups</span>
            <span>{info.backups} daily copies kept next to the file (the last 14 days)</span>
          </div>
        )}
        <Caption1 className={s.muted} block style={{ marginTop: 12 }}>
          Only this app can open the file while it runs. To protect your data, make sure the folder is included in your company backup or OneDrive.
        </Caption1>
      </Section>
    </>
  );
}

export function ChangeStorageButton() {
  const host = getHost();
  if (!host) return null;
  return (
    <Button icon={<Database20Regular />} onClick={() => void host.setMode(null)}>
      Change data storage
    </Button>
  );
}
