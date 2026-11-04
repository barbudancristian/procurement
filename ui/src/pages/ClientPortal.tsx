import {
  Body1,
  Button,
  Caption1,
  Card,
  makeStyles,
  MessageBar,
  MessageBarBody,
  Subtitle1,
  Text,
  Title2,
  tokens,
} from '@fluentui/react-components';
import { ArrowDownload16Regular, DocumentPdf20Regular } from '@fluentui/react-icons';
import { StageTracker, StatusBadge } from '../components/common';
import { docsFor, fmtDate, projects, userById } from '../data/mock';
import { useApp } from '../state/AppContext';

const useStyles = makeStyles({
  hero: { padding: '24px', marginBottom: '16px', backgroundColor: tokens.colorBrandBackground2, borderRadius: tokens.borderRadiusXLarge, display: 'flex', flexDirection: 'column', gap: '4px' },
  card: { padding: '20px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  head: { display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' },
  muted: { color: tokens.colorNeutralForeground3 },
  doc: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderTop: `1px solid ${tokens.colorNeutralStroke3}` },
  grow: { flex: 1 },
});

/** What a client guest sees on their read-only SharePoint client site. */
export function ClientPortal() {
  const s = useStyles();
  const { branding } = useApp();
  const shared = projects.filter((p) => p.clientVisible).slice(0, 4);
  return (
    <>
      <MessageBar intent="info" style={{ marginBottom: 16 }}>
        <MessageBarBody>
          Clients do not install the app. This is a preview of their read-only SharePoint client site, which shows only what your team has published.
        </MessageBarBody>
      </MessageBar>
      <div className={s.hero}>
        <Caption1 className={s.muted}>{branding.appName} · Client site</Caption1>
        <Title2>Northwind Logistics</Title2>
        <Body1>Sourcing projects managed on your behalf. Read only.</Body1>
      </div>
      {shared.map((p) => (
        <Card key={p.id} className={s.card}>
          <div className={s.head}>
            <div>
              <Caption1 className={s.muted}>{p.ref}</Caption1>
              <Subtitle1 block>{p.title}</Subtitle1>
              <Caption1 className={s.muted}>
                Managed by {userById(p.ownerId).name} · target {fmtDate(p.target)}
              </Caption1>
            </div>
            <StatusBadge status={p.status} />
          </div>
          <StageTracker scope={p.scope} stage={p.stage} />
          <div>
            <Text weight="semibold">Published documents</Text>
            {docsFor(p)
              .filter((d) => d.visibility === 'Client-visible')
              .map((d) => (
                <div key={d.id} className={s.doc}>
                  <DocumentPdf20Regular />
                  <span className={s.grow}>
                    {d.name}
                    <Caption1 className={s.muted} block>
                      Published {fmtDate(d.uploaded)}
                    </Caption1>
                  </span>
                  <Button size="small" icon={<ArrowDownload16Regular />}>
                    Download
                  </Button>
                </div>
              ))}
            {docsFor(p).filter((d) => d.visibility === 'Client-visible').length === 0 && <Caption1 className={s.muted} block>No documents published yet.</Caption1>}
          </div>
        </Card>
      ))}
    </>
  );
}
