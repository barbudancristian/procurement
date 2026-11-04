import { Fragment, useCallback, useMemo, useState, type DragEvent, type ReactNode } from 'react';
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom';
import {
  Avatar,
  AvatarGroup,
  AvatarGroupItem,
  Badge,
  Body1,
  Button,
  Caption1,
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
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  MessageBar,
  MessageBarBody,
  Option,
  Subtitle2,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TabList,
  Text,
  Textarea,
  Title2,
  tokens,
  Tooltip,
} from '@fluentui/react-components';
import {
  ArrowDownload16Regular,
  ArrowLeft16Regular,
  ArrowUpload24Regular,
  CheckmarkCircle20Regular,
  DocumentPdf20Regular,
  Globe16Regular,
  History16Regular,
  LockClosed20Regular,
  MoreHorizontal20Regular,
  Next20Regular,
  Send20Regular,
  Star16Filled,
  DismissCircle20Regular,
  Add20Regular,
} from '@fluentui/react-icons';
import { axisStyle, EChart, type ChartColors } from '../components/Chart';
import { PriorityText, ScopeBadge, Section, StageTracker, StatusBadge, VisibilityBadge } from '../components/common';
import {
  activitiesFor,
  comments as seedComments,
  criteria,
  daysBetween,
  docsFor,
  fmtDate,
  fmtMoney,
  fmtAxis,
  historyFor,
  negotiationFor,
  offersFor,
  projectById,
  scoresFor,
  supplierById,
  TODAY,
  userById,
  workflows,
  type Doc,
  type Project,
  type Visibility,
} from '../data/mock';
import { usePermissions } from '../state/AppContext';

const useStyles = makeStyles({
  back: { display: 'inline-flex', alignItems: 'center', gap: '4px', color: tokens.colorNeutralForeground3, textDecoration: 'none', fontSize: '13px', marginBottom: '8px' },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' },
  titleRow: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' },
  ref: { fontFamily: 'Consolas, monospace', color: tokens.colorNeutralForeground3, fontSize: '13px' },
  actions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  facts: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', padding: '4px 0 0' },
  fact: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 },
  factLabel: { color: tokens.colorNeutralForeground3, fontSize: '12px' },
  factValue: { fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' },
  tabs: { margin: '16px 0', overflowX: 'auto' },
  grid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', '@media (max-width: 1000px)': { gridTemplateColumns: '1fr' } },
  stack: { display: 'flex', flexDirection: 'column', gap: '16px' },
  tableWrap: { overflowX: 'auto' },
  num: { textAlign: 'right', whiteSpace: 'nowrap' },
  muted: { color: tokens.colorNeutralForeground3 },
  best: { color: tokens.colorPaletteGreenForeground1, fontWeight: 600 },
  scoreInput: { width: '64px' },
  groupRow: { backgroundColor: tokens.colorNeutralBackground3 },
  total: { fontWeight: 700 },
  winner: { backgroundColor: tokens.colorBrandBackground2 },
  kv: { display: 'grid', gridTemplateColumns: '170px 1fr', gap: '8px 16px', '@media (max-width: 640px)': { gridTemplateColumns: '1fr' } },
  drop: {
    border: `2px dashed ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusLarge,
    padding: '20px',
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  dropOn: { border: `2px dashed ${tokens.colorBrandStroke1}`, backgroundColor: tokens.colorBrandBackground2 },
  comment: { display: 'flex', gap: '12px', padding: '10px 0' },
  commentBody: { display: 'flex', flexDirection: 'column', gap: '2px' },
  timeline: { display: 'flex', flexDirection: 'column' },
  tItem: { display: 'grid', gridTemplateColumns: '110px 1fr', gap: '12px', padding: '10px 0', borderBottom: `1px solid ${tokens.colorNeutralStroke3}` },
  savings: { fontSize: '28px', fontWeight: 700, color: tokens.colorPaletteGreenForeground1 },
  locked: { display: 'flex', alignItems: 'center', gap: '12px', padding: '24px', color: tokens.colorNeutralForeground3 },
  pill: { display: 'inline-flex', alignItems: 'center', gap: '6px' },
});

type TabKey = 'overview' | 'suppliers' | 'evaluation' | 'negotiation' | 'justification' | 'activities' | 'documents' | 'discussion' | 'history';

export function ProjectWorkspace() {
  const s = useStyles();
  const { id } = useParams();
  const [params] = useSearchParams();
  const perm = usePermissions();
  const project = projectById(id ?? '');
  const [tab, setTab] = useState<TabKey>('overview');
  const [stageOverride, setStageOverride] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(params.get('created') ? 'Project created. A SharePoint folder was set up for its documents.' : null);

  if (!project) {
    return (
      <MessageBar intent="warning">
        <MessageBarBody>Project not found, or you do not have access to it.</MessageBarBody>
      </MessageBar>
    );
  }
  const p: Project = stageOverride === null ? project : { ...project, stage: stageOverride };
  const stages = workflows[p.scope];
  const currentStage = stages[p.stage];
  const nextStage = stages[p.stage + 1];
  // A stage with an approval gate must be approved before the project can leave it.
  const gate = currentStage.approval;
  const onHold = p.status === 'On hold';
  const isOwner = p.ownerId === perm.userId;
  const canEdit = perm.canEditAll || (perm.canEditAssigned && isOwner);
  const closed = p.status === 'Completed' || p.status === 'Cancelled';

  const tabs: { key: TabKey; label: string; confidential?: boolean }[] =
    p.scope === 'competitive'
      ? [
          { key: 'overview', label: 'Overview' },
          { key: 'suppliers', label: `Suppliers & responses (${p.supplierIds.length})` },
          { key: 'evaluation', label: 'Evaluation', confidential: true },
          { key: 'negotiation', label: 'Negotiation', confidential: true },
          { key: 'documents', label: 'Documents' },
          { key: 'discussion', label: 'Discussion' },
          { key: 'history', label: 'History' },
        ]
      : p.scope === 'sole'
        ? [
            { key: 'overview', label: 'Overview' },
            { key: 'justification', label: 'Justification' },
            { key: 'negotiation', label: 'Negotiation', confidential: true },
            { key: 'documents', label: 'Documents' },
            { key: 'discussion', label: 'Discussion' },
            { key: 'history', label: 'History' },
          ]
        : [
            { key: 'overview', label: 'Overview' },
            { key: 'activities', label: 'Activities' },
            { key: 'documents', label: 'Documents' },
            { key: 'discussion', label: 'Discussion' },
            { key: 'history', label: 'History' },
          ];

  const advance = () => {
    setStageOverride(p.stage + 1);
    setToast(`Moved to ${nextStage.name}. The change was recorded in the audit log.`);
  };

  return (
    <>
      <RouterLink to={`/projects/scope/${p.scope}`} className={s.back}>
        <ArrowLeft16Regular /> Back to projects
      </RouterLink>
      {toast && (
        <MessageBar intent="success" style={{ marginBottom: 12 }}>
          <MessageBarBody>{toast}</MessageBarBody>
        </MessageBar>
      )}
      <div className={s.head}>
        <div>
          <span className={s.ref}>{p.ref}</span>
          <div className={s.titleRow}>
            <Title2 as="h1">{p.title}</Title2>
          </div>
          <div className={s.titleRow}>
            <ScopeBadge scope={p.scope} />
            <StatusBadge status={p.status} />
            {p.clientVisible && (
              <Tooltip content="Summary and client-visible documents are published to the client site." relationship="description">
                <Badge appearance="outline" color="success" shape="rounded" icon={<Globe16Regular />}>
                  Shared with client
                </Badge>
              </Tooltip>
            )}
          </div>
        </div>
        <div className={s.actions}>
          {!closed && onHold && canEdit && (
            <Button appearance="primary" icon={<Next20Regular />} onClick={() => setToast('Project resumed.')}>
              Resume project
            </Button>
          )}
          {!closed && !onHold && canEdit && nextStage && !gate && (
            <Button appearance="primary" icon={<Next20Regular />} onClick={advance}>
              Move to {nextStage.name}
            </Button>
          )}
          {!closed && !onHold && nextStage && gate &&
            (perm.canApprove ? (
              <ApproveDialog stageName={currentStage.name} nextName={nextStage.name} approver={gate} onApprove={() => advance()} onReject={() => setToast('Sent back to the owner with comments.')} />
            ) : (
              canEdit && (
                <Button appearance="primary" icon={<Send20Regular />} onClick={() => setToast(`Submitted for approval: ${gate}.`)}>
                  Submit for approval
                </Button>
              )
            ))}
          {!perm.isClient && (
            <Button icon={<DocumentPdf20Regular />}>{p.scope === 'competitive' ? 'Recommendation report' : p.scope === 'sole' ? 'Negotiation summary' : 'Summary report'}</Button>
          )}
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Button icon={<MoreHorizontal20Regular />} aria-label="More actions" />
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem disabled={!canEdit}>Edit details</MenuItem>
                <MenuItem disabled={!canEdit}>Put on hold</MenuItem>
                <MenuItem disabled={!perm.canEditAll}>Publish summary to client site</MenuItem>
                <MenuItem disabled={!perm.canEditAll}>Archive project</MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </div>
      </div>

      <Section>
        <StageTracker scope={p.scope} stage={p.stage} />
        <Divider />
        <div className={s.facts}>
          <Fact label="Owner" value={<span className={s.pill}><Avatar name={userById(p.ownerId).name} size={20} /> {userById(p.ownerId).name}</span>} />
          <Fact
            label="Stakeholders"
            value={
              p.stakeholderIds.length ? (
                <AvatarGroup size={20} layout="stack">
                  {p.stakeholderIds.map((sid) => (
                    <AvatarGroupItem key={sid} name={userById(sid).name} />
                  ))}
                </AvatarGroup>
              ) : (
                '—'
              )
            }
          />
          <Fact label="Category" value={p.category} />
          <Fact label="Created" value={fmtDate(p.created)} />
          <Fact label="Last modified" value={fmtDate(p.modified)} />
          <Fact label="Target completion" value={<>{fmtDate(p.target)} {!closed && p.target < TODAY && <Badge color="danger" size="small">late</Badge>}</>} />
          <Fact label={p.scope === 'support' ? 'Expected benefit' : 'Estimated spend'} value={fmtMoney(p.estSpend)} />
          <Fact label="Priority" value={<PriorityText priority={p.priority} />} />
        </div>
      </Section>

      <TabList className={s.tabs} selectedValue={tab} onTabSelect={(_, d) => setTab(d.value as TabKey)}>
        {tabs.map((t) => (
          <Tab key={t.key} value={t.key} icon={t.confidential && !perm.canSeeConfidential ? <LockClosed20Regular /> : undefined}>
            {t.label}
          </Tab>
        ))}
      </TabList>

      {tabs.find((t) => t.key === tab)?.confidential && !perm.canSeeConfidential ? (
        <Section>
          <div className={s.locked}>
            <LockClosed20Regular />
            <Body1>This section holds confidential commercial information (scores, target prices, negotiation strategy). It is visible to the procurement team only.</Body1>
          </div>
        </Section>
      ) : (
        <>
          {tab === 'overview' && <Overview p={p} />}
          {tab === 'suppliers' && <SuppliersTab p={p} canEdit={canEdit} />}
          {tab === 'evaluation' && <EvaluationTab p={p} canEdit={canEdit} />}
          {tab === 'negotiation' && <NegotiationTab p={p} canEdit={canEdit} />}
          {tab === 'justification' && <JustificationTab p={p} />}
          {tab === 'activities' && <ActivitiesTab p={p} canEdit={canEdit} />}
          {tab === 'documents' && <DocumentsTab p={p} canEdit={canEdit} />}
          {tab === 'discussion' && <DiscussionTab />}
          {tab === 'history' && <HistoryTab p={p} />}
        </>
      )}
    </>
  );
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  const s = useStyles();
  return (
    <div className={s.fact}>
      <span className={s.factLabel}>{label}</span>
      <span className={s.factValue}>{value}</span>
    </div>
  );
}

function ApproveDialog({ stageName, nextName, approver, onApprove, onReject }: { stageName: string; nextName: string; approver: string; onApprove: () => void; onReject: () => void }) {
  const [comment, setComment] = useState('');
  return (
    <Dialog>
      <DialogTrigger disableButtonEnhancement>
        <Button appearance="primary" icon={<CheckmarkCircle20Regular />}>
          Review approval
        </Button>
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Approve {stageName} and move to {nextName}?</DialogTitle>
          <DialogContent>
            <Body1 block>Required approver: {approver}. Your decision, name and time are stored in the audit trail and cannot be changed.</Body1>
            <Field label="Decision comment" style={{ marginTop: 12 }} hint="Required when rejecting.">
              <Textarea value={comment} onChange={(_, d) => setComment(d.value)} rows={3} />
            </Field>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button icon={<DismissCircle20Regular />} disabled={!comment} onClick={onReject}>
                Reject
              </Button>
            </DialogTrigger>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="primary" icon={<CheckmarkCircle20Regular />} onClick={onApprove}>
                Approve
              </Button>
            </DialogTrigger>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}

function Overview({ p }: { p: Project }) {
  const s = useStyles();
  const perm = usePermissions();
  const done = p.status === 'Completed';
  return (
    <div className={s.grid}>
      <div className={s.stack}>
        <Section title="Description and requirements">
          <Body1>{p.description}</Body1>
          <div className={s.kv}>
            <span className={s.muted}>Requesting department</span>
            <span>{p.department}</span>
            <span className={s.muted}>Category</span>
            <span>{p.category}</span>
            {p.scope === 'competitive' && (
              <>
                <span className={s.muted}>Sourcing strategy</span>
                <span>Two-stage RFP with best-and-final offer; 3-year contract with 1+1 extension</span>
                <span className={s.muted}>Evaluation split</span>
                <span>Technical 60% · Commercial 40%</span>
              </>
            )}
            {p.scope === 'sole' && (
              <>
                <span className={s.muted}>Incumbent supplier</span>
                <span>{p.supplierIds[0] ? supplierById(p.supplierIds[0]).name : '—'}</span>
                <span className={s.muted}>Contract expiry</span>
                <span>{fmtDate(p.target)}</span>
              </>
            )}
          </div>
        </Section>
        <Section title={done ? 'Final outcome' : 'Recommendation'}>
          {done ? (
            <div className={s.kv}>
              <span className={s.muted}>Outcome</span>
              <span>{p.awardedSupplierId ? `Awarded to ${supplierById(p.awardedSupplierId).name}` : 'Advice delivered and accepted'}</span>
              <span className={s.muted}>Negotiated savings</span>
              <span className={s.best}>{fmtMoney(p.savings)}</span>
              <span className={s.muted}>Cost avoidance</span>
              <span>{fmtMoney(p.costAvoidance)}</span>
              <span className={s.muted}>Duration</span>
              <span>{p.completed ? `${daysBetween(p.created, p.completed)} days` : '—'}</span>
            </div>
          ) : (
            <Textarea
              readOnly={!perm.canSeeConfidential}
              placeholder="Write the recommendation here. It is used in the generated report."
              defaultValue={p.scope === 'competitive' && p.stage >= 4 ? 'Preliminary: Brightline Print Solutions leads on service levels and total cost. Final recommendation after clarification from Arcadia on data residency.' : ''}
              rows={4}
              resize="vertical"
            />
          )}
        </Section>
      </div>
      <div className={s.stack}>
        <Section title="Next deadline">
          {p.nextDeadline ? (
            <>
              <Subtitle2>{p.nextDeadline.label}</Subtitle2>
              <Text style={{ color: p.nextDeadline.date < TODAY ? tokens.colorPaletteRedForeground1 : undefined }}>
                {fmtDate(p.nextDeadline.date)} ·{' '}
                {p.nextDeadline.date < TODAY ? `${daysBetween(p.nextDeadline.date, TODAY)} days overdue` : `in ${daysBetween(TODAY, p.nextDeadline.date)} days`}
              </Text>
            </>
          ) : (
            <Text className={s.muted}>No open deadlines.</Text>
          )}
        </Section>
        <Section title="Key decisions">
          <div className={s.timeline}>
            {historyFor(p)
              .filter((h) => h.action.includes('Approved'))
              .slice(0, 4)
              .map((h, i) => (
                <div key={i} className={s.tItem}>
                  <Caption1 className={s.muted}>{fmtDate(h.date)}</Caption1>
                  <span>
                    {h.detail}
                    <Caption1 className={s.muted} block>
                      Approved by {h.who}
                    </Caption1>
                  </span>
                </div>
              ))}
            {historyFor(p).filter((h) => h.action.includes('Approved')).length === 0 && <Text className={s.muted}>No decisions recorded yet.</Text>}
          </div>
        </Section>
      </div>
    </div>
  );
}

function SuppliersTab({ p, canEdit }: { p: Project; canEdit: boolean }) {
  const s = useStyles();
  const perm = usePermissions();
  const offers = offersFor(p);
  const lowest = Math.min(...offers.filter((o) => o.status === 'Submitted').map((o) => o.bestOffer));
  return (
    <Section
      title="Invited suppliers and responses"
      action={
        canEdit && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button icon={<Add20Regular />}>Invite supplier</Button>
            <Button appearance="primary">Record response</Button>
          </div>
        )
      }
    >
      <div className={s.tableWrap}>
        <Table aria-label="Supplier responses">
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Supplier</TableHeaderCell>
              <TableHeaderCell>Response</TableHeaderCell>
              <TableHeaderCell>Submitted</TableHeaderCell>
              {perm.canSeeConfidential && <TableHeaderCell className={s.num}>First offer</TableHeaderCell>}
              {perm.canSeeConfidential && <TableHeaderCell className={s.num}>Best offer</TableHeaderCell>}
              <TableHeaderCell>Payment terms</TableHeaderCell>
              <TableHeaderCell>Lead time</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map((o) => {
              const sup = supplierById(o.supplierId);
              return (
                <TableRow key={o.supplierId}>
                  <TableCell>
                    <Text weight="semibold">{sup.name}</Text>
                    <Caption1 className={s.muted} block>
                      {sup.contact} · {sup.country}
                    </Caption1>
                  </TableCell>
                  <TableCell>
                    <Badge appearance="tint" color={o.status === 'Submitted' ? 'success' : 'subtle'}>
                      {o.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{o.status === 'Submitted' ? fmtDate(o.submitted) : '—'}</TableCell>
                  {perm.canSeeConfidential && <TableCell className={s.num}>{o.status === 'Submitted' ? fmtMoney(o.firstOffer) : '—'}</TableCell>}
                  {perm.canSeeConfidential && (
                    <TableCell className={s.num}>
                      {o.status === 'Submitted' ? <span className={o.bestOffer === lowest ? s.best : undefined}>{fmtMoney(o.bestOffer)}</span> : '—'}
                    </TableCell>
                  )}
                  <TableCell>{o.status === 'Submitted' ? `${o.paymentDays} days` : '—'}</TableCell>
                  <TableCell>{o.status === 'Submitted' ? o.leadTime : '—'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Section>
  );
}

function EvaluationTab({ p, canEdit }: { p: Project; canEdit: boolean }) {
  const s = useStyles();
  const [scores, setScores] = useState(() => scoresFor(p));
  const sups = p.supplierIds.filter((_, i, arr) => !(arr.length > 3 && i === arr.length - 1)); // exclude the supplier that declined
  const weighted = (sid: string, group?: 'Technical' | 'Commercial') =>
    criteria.filter((c) => !group || c.group === group).reduce((a, c) => a + (scores[sid][c.id] / 5) * c.weight, 0);
  const ranked = [...sups].sort((a, b) => weighted(b) - weighted(a));
  const leader = ranked[0];

  const chart = useCallback(
    (c: ChartColors) => ({
      grid: { left: 8, right: 24, top: 28, bottom: 8, containLabel: true },
      legend: { top: 0, right: 0, textStyle: { color: c.muted }, icon: 'roundRect', itemWidth: 10, itemHeight: 10 },
      tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const }, valueFormatter: (v: unknown) => `${Number(v).toFixed(1)} pts` },
      xAxis: { type: 'value' as const, max: 100, ...axisStyle(c) },
      yAxis: { type: 'category' as const, inverse: true, data: ranked.map((sid) => supplierById(sid).name), ...axisStyle(c), splitLine: { show: false } },
      series: (['Technical', 'Commercial'] as const).map((g, i) => ({
        type: 'bar' as const,
        name: `${g} (${g === 'Technical' ? 60 : 40} pts)`,
        stack: 'score',
        barMaxWidth: 18,
        itemStyle: { color: c.series[i], borderColor: c.surface, borderWidth: 1 },
        data: ranked.map((sid) => Number(weighted(sid, g).toFixed(1))),
      })),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scores],
  );

  return (
    <div className={s.stack}>
      <MessageBar intent="info">
        <MessageBarBody>
          Scores are 1 (poor) to 5 (excellent), weighted to 100 points. Current leader: <strong>{supplierById(leader).name}</strong> with {weighted(leader).toFixed(1)} points.
        </MessageBarBody>
      </MessageBar>
      <Section title="Evaluation matrix" action={<Button icon={<ArrowDownload16Regular />} size="small">Export to Excel</Button>}>
        <div className={s.tableWrap}>
          <Table aria-label="Evaluation matrix" size="small">
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Criterion</TableHeaderCell>
                <TableHeaderCell className={s.num}>Weight</TableHeaderCell>
                {sups.map((sid) => (
                  <TableHeaderCell key={sid} className={sid === leader ? s.winner : undefined}>
                    {supplierById(sid).name} {sid === leader && <Star16Filled />}
                  </TableHeaderCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(['Technical', 'Commercial'] as const).map((g) => (
                <Fragment key={g}>
                  <TableRow className={s.groupRow}>
                    <TableCell>
                      <Text weight="semibold">{g}</Text>
                    </TableCell>
                    <TableCell className={s.num}>{criteria.filter((c) => c.group === g).reduce((a, c) => a + c.weight, 0)}%</TableCell>
                    {sups.map((sid) => (
                      <TableCell key={sid} className={sid === leader ? s.winner : undefined}>
                        <Text weight="semibold">{weighted(sid, g).toFixed(1)}</Text>
                      </TableCell>
                    ))}
                  </TableRow>
                  {criteria
                    .filter((c) => c.group === g)
                    .map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{c.name}</TableCell>
                        <TableCell className={s.num}>{c.weight}%</TableCell>
                        {sups.map((sid) => (
                          <TableCell key={sid} className={sid === leader ? s.winner : undefined}>
                            {canEdit ? (
                              <Input
                                className={s.scoreInput}
                                size="small"
                                type="number"
                                min={1}
                                max={5}
                                step={0.5}
                                aria-label={`${supplierById(sid).name}, ${c.name}`}
                                value={String(scores[sid][c.id])}
                                onChange={(_, d) => {
                                  const v = Math.max(1, Math.min(5, Number(d.value) || 1));
                                  setScores({ ...scores, [sid]: { ...scores[sid], [c.id]: v } });
                                }}
                              />
                            ) : (
                              scores[sid][c.id]
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                </Fragment>
              ))}
              <TableRow>
                <TableCell>
                  <Text className={s.total}>Weighted total (of 100)</Text>
                </TableCell>
                <TableCell className={s.num}>100%</TableCell>
                {sups.map((sid) => (
                  <TableCell key={sid} className={sid === leader ? s.winner : undefined}>
                    <Text className={s.total}>{weighted(sid).toFixed(1)}</Text>
                    <Caption1 className={s.muted} block>
                      Rank {ranked.indexOf(sid) + 1}
                    </Caption1>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Section>
      <Section title="Supplier comparison">
        <EChart build={chart} height={60 + sups.length * 44} ariaLabel="Weighted score per supplier" />
      </Section>
    </div>
  );
}

function NegotiationTab({ p, canEdit }: { p: Project; canEdit: boolean }) {
  const s = useStyles();
  const n = negotiationFor(p);
  const latest = n.rounds[n.rounds.length - 1];
  const savings = Math.max(0, n.baseline - latest.price);
  const avoidance = Math.max(0, n.opening - n.baseline);
  const supplier = p.supplierIds[0] ? supplierById(p.supplierIds[0]).name : 'Supplier';

  const chart = useCallback(
    (c: ChartColors) => ({
      grid: { left: 8, right: 96, top: 16, bottom: 8, containLabel: true },
      tooltip: { trigger: 'axis' as const, valueFormatter: (v: unknown) => fmtMoney(Number(v)) },
      xAxis: { type: 'category' as const, data: n.rounds.map((r) => `Round ${r.no}`), ...axisStyle(c), splitLine: { show: false } },
      yAxis: {
        type: 'value' as const,
        min: Math.floor((Math.min(n.target, ...n.rounds.map((r) => r.price)) * 0.97) / 10000) * 10000,
        ...axisStyle(c),
        axisLine: { show: false },
        axisLabel: { color: c.muted, fontSize: 11, formatter: (v: number) => fmtAxis(v) },
      },
      series: [
        {
          type: 'line' as const,
          name: `${supplier} offer`,
          data: n.rounds.map((r) => r.price),
          lineStyle: { width: 2, color: c.series[0] },
          itemStyle: { color: c.series[0] },
          symbolSize: 9,
          label: { show: true, position: 'top' as const, color: c.text, fontSize: 11, formatter: (v: { value?: unknown }) => fmtMoney(Number(v.value), true) },
          markLine: {
            symbol: 'none',
            silent: true,
            label: { position: 'end' as const, color: c.muted, fontSize: 11, formatter: '{b}' },
            data: [
              { name: 'Current price', yAxis: n.baseline, lineStyle: { color: c.muted, type: 'dashed' as const } },
              { name: 'Target', yAxis: n.target, lineStyle: { color: c.series[2], type: 'dashed' as const } },
            ],
          },
        },
      ],
    }),
    [n, supplier],
  );

  return (
    <div className={s.grid}>
      <div className={s.stack}>
        <Section title="Offers by round, against current price and target">
          <EChart build={chart} height={260} ariaLabel="Supplier offer by negotiation round compared with current price and target" />
        </Section>
        <Section title="Negotiation rounds" action={canEdit && <Button icon={<Add20Regular />}>Record round</Button>}>
          <div className={s.tableWrap}>
            <Table aria-label="Negotiation rounds" size="small">
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Round</TableHeaderCell>
                  <TableHeaderCell>Date</TableHeaderCell>
                  <TableHeaderCell className={s.num}>Annual price</TableHeaderCell>
                  <TableHeaderCell>Terms offered</TableHeaderCell>
                  <TableHeaderCell>Notes</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {n.rounds.map((r) => (
                  <TableRow key={r.no}>
                    <TableCell>{r.no}</TableCell>
                    <TableCell>{fmtDate(r.date)}</TableCell>
                    <TableCell className={s.num}>{fmtMoney(r.price)}</TableCell>
                    <TableCell>{r.terms}</TableCell>
                    <TableCell>{r.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Section>
        <Section title="Current vs negotiated conditions">
          <div className={s.tableWrap}>
            <Table aria-label="Commercial conditions" size="small">
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Term</TableHeaderCell>
                  <TableHeaderCell>Current contract</TableHeaderCell>
                  <TableHeaderCell>Target</TableHeaderCell>
                  <TableHeaderCell>Latest offer</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  ['Annual price', fmtMoney(n.baseline), fmtMoney(n.target), fmtMoney(latest.price)],
                  ['Payment terms', '30 days', '60 days', latest.no >= 3 ? '60 days' : latest.no === 2 ? '45 days' : '30 days'],
                  ['Price indexation', 'CPI + 2%', 'CPI, capped at 3%', latest.no >= 3 ? 'CPI, capped at 3%' : latest.no === 2 ? 'CPI' : 'CPI + 2%'],
                  ['Contract term', '1 year', '3 years', latest.no >= 3 ? '3 years' : '1 year'],
                  ['Service level', '98% availability', '99.5% availability', latest.no >= 2 ? '99.5% availability' : '98% availability'],
                ].map(([term, cur, tgt, off]) => (
                  <TableRow key={term}>
                    <TableCell>
                      <Text weight="semibold">{term}</Text>
                    </TableCell>
                    <TableCell>{cur}</TableCell>
                    <TableCell>{tgt}</TableCell>
                    <TableCell className={off === tgt ? s.best : undefined}>{off}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Section>
      </div>
      <div className={s.stack}>
        <Section title="Savings so far">
          <span className={s.savings}>{fmtMoney(savings)}</span>
          <Caption1 className={s.muted}>
            Current price {fmtMoney(n.baseline)} minus latest offer {fmtMoney(latest.price)} ({((savings / n.baseline) * 100).toFixed(1)}%)
          </Caption1>
          <Divider />
          <Subtitle2>Cost avoidance</Subtitle2>
          <Text>{fmtMoney(avoidance)}</Text>
          <Caption1 className={s.muted}>Increase requested in round 1 and withdrawn.</Caption1>
          <Divider />
          <Subtitle2>Gap to target</Subtitle2>
          <Text>{fmtMoney(Math.max(0, latest.price - n.target))}</Text>
        </Section>
        <Section title="Negotiation objectives">
          <Body1>1. Hold annual price at or below {fmtMoney(n.target)}.</Body1>
          <Body1>2. Move payment terms to 60 days.</Body1>
          <Body1>3. Cap indexation at CPI with a 3% ceiling.</Body1>
          <Body1>4. Raise availability commitment to 99.5% with service credits.</Body1>
        </Section>
      </div>
    </div>
  );
}

function JustificationTab({ p }: { p: Project }) {
  const s = useStyles();
  const approved = p.stage > 1;
  return (
    <div className={s.grid}>
      <Section title="Sole-source justification">
        <div className={s.kv}>
          <span className={s.muted}>Reason</span>
          <span>Proprietary technology or IP</span>
          <span className={s.muted}>Business justification</span>
          <span>
            The system is built on the supplier's proprietary platform and only the supplier holds the source code and certified engineers. Migrating to another
            provider would take an estimated 14 months and cost about €900,000, well above any saving a tender could deliver.
          </span>
          <span className={s.muted}>Alternatives considered</span>
          <span>Third-party maintenance (2 providers contacted; neither supports the current version). Replacement project (planned for 2028 roadmap).</span>
          <span className={s.muted}>Current contract value</span>
          <span>{fmtMoney(p.estSpend)} per year</span>
          <span className={s.muted}>Historical spend (3 years)</span>
          <span>{fmtMoney(p.estSpend * 2.85)}</span>
          <span className={s.muted}>Contract expiry</span>
          <span>{fmtDate(p.target)}</span>
        </div>
      </Section>
      <Section title="Approval">
        {approved ? (
          <MessageBar intent="success">
            <MessageBarBody>Approved by Elena Popescu (Procurement Manager). Comment: "Justified; negotiate a multi-year cap on indexation."</MessageBarBody>
          </MessageBar>
        ) : (
          <MessageBar intent="warning">
            <MessageBarBody>Waiting for Procurement Manager approval. Negotiation cannot start until the justification is approved.</MessageBarBody>
          </MessageBar>
        )}
        <Caption1 className={s.muted}>Approval rule: Procurement Manager always; a second approver from Finance above €250,000 per year (configurable in Workflows).</Caption1>
      </Section>
    </div>
  );
}

function ActivitiesTab({ p, canEdit }: { p: Project; canEdit: boolean }) {
  const s = useStyles();
  const [items, setItems] = useState(() => activitiesFor(p));
  const [text, setText] = useState('');
  const [hours, setHours] = useState('1');
  return (
    <div className={s.grid}>
      <Section title="Activities performed">
        <div className={s.tableWrap}>
          <Table size="small" aria-label="Activities">
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Activity</TableHeaderCell>
                <TableHeaderCell>By</TableHeaderCell>
                <TableHeaderCell className={s.num}>Hours</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((a, i) => (
                <TableRow key={i}>
                  <TableCell>{fmtDate(a.date)}</TableCell>
                  <TableCell>{a.text}</TableCell>
                  <TableCell>{userById(a.who).name}</TableCell>
                  <TableCell className={s.num}>{a.hours}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <Field label="New activity" style={{ flex: '1 1 300px' }}>
              <Input value={text} onChange={(_, d) => setText(d.value)} placeholder="What did you do?" />
            </Field>
            <Field label="Hours">
              <Input value={hours} onChange={(_, d) => setHours(d.value)} type="number" style={{ width: 80 }} />
            </Field>
            <Button
              appearance="primary"
              disabled={!text}
              onClick={() => {
                setItems([...items, { date: TODAY, who: p.ownerId, text, hours: Number(hours) || 0 }]);
                setText('');
              }}
            >
              Add
            </Button>
          </div>
        )}
      </Section>
      <div className={s.stack}>
        <Section title="Conclusions and recommendations">
          <Textarea rows={5} readOnly={!canEdit} defaultValue={p.stage >= 3 ? 'Recommend a phased transition: 20% of the fleet electrified by end of 2027, focusing on urban pool cars. Leasing preferred over purchase.' : ''} placeholder="Summarise conclusions for the requester." />
        </Section>
        <Section title="Commercial benefit">
          <Text>{fmtMoney(p.estSpend * 0.04)} estimated benefit</Text>
          <Caption1 className={s.muted}>Recorded as cost avoidance when the request is closed.</Caption1>
        </Section>
      </div>
    </div>
  );
}

function DocumentsTab({ p, canEdit }: { p: Project; canEdit: boolean }) {
  const s = useStyles();
  const perm = usePermissions();
  const [docs, setDocs] = useState<Doc[]>(() => docsFor(p));
  const [over, setOver] = useState(false);
  const [cat, setCat] = useState('All');
  const [notice, setNotice] = useState<string | null>(null);
  const visible = useMemo(
    () => docs.filter((d) => (perm.canSeeConfidential || d.visibility !== 'Confidential') && (cat === 'All' || d.category === cat)),
    [docs, perm.canSeeConfidential, cat],
  );
  const cats = Array.from(new Set(docs.map((d) => d.category)));
  const allowed = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'msg', 'png', 'jpg', 'csv', 'txt'];

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    const files = Array.from(e.dataTransfer.files);
    const rejected = files.filter((f) => !allowed.includes(f.name.split('.').pop()?.toLowerCase() ?? '') || f.size > 100 * 1024 * 1024);
    const ok = files.filter((f) => !rejected.includes(f));
    setDocs([
      ...ok.map((f, i) => ({
        id: `${p.id}-new-${Date.now()}-${i}`,
        projectId: p.id,
        name: f.name,
        category: 'Business documentation',
        version: '1.0',
        size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
        uploadedBy: perm.userId,
        uploaded: TODAY,
        visibility: 'Internal' as Visibility,
      })),
      ...docs,
    ]);
    setNotice(
      `${ok.length} file(s) uploaded to SharePoint.` + (rejected.length ? ` ${rejected.length} rejected: only Office, PDF, image and text files up to 100 MB are allowed.` : ''),
    );
  };

  return (
    <div className={s.stack}>
      {canEdit && (
        <div
          className={`${s.drop} ${over ? s.dropOn : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={onDrop}
          role="button"
          tabIndex={0}
          aria-label="Upload documents"
        >
          <ArrowUpload24Regular />
          <Text weight="semibold">Drag and drop files here, or click to browse</Text>
          <Caption1>PDF, Office, images, up to 100 MB. Files are checked before they are stored in SharePoint.</Caption1>
        </div>
      )}
      {notice && (
        <MessageBar intent={notice.includes('rejected') ? 'warning' : 'success'}>
          <MessageBarBody>{notice}</MessageBarBody>
        </MessageBar>
      )}
      <Section
        title={`Documents (${visible.length})`}
        action={
          <Dropdown size="small" value={cat === 'All' ? 'All categories' : cat} selectedOptions={[cat]} onOptionSelect={(_, d) => setCat(d.optionValue ?? 'All')} aria-label="Category">
            <Option value="All">All categories</Option>
            {cats.map((c) => (
              <Option key={c}>{c}</Option>
            ))}
          </Dropdown>
        }
      >
        {!perm.canSeeConfidential && (
          <Caption1 className={s.muted}>Confidential documents (supplier proposals, evaluations, contracts) are hidden for your role.</Caption1>
        )}
        <div className={s.tableWrap}>
          <Table size="small" aria-label="Project documents">
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Category</TableHeaderCell>
                <TableHeaderCell>Visibility</TableHeaderCell>
                <TableHeaderCell>Version</TableHeaderCell>
                <TableHeaderCell>Uploaded</TableHeaderCell>
                <TableHeaderCell>Size</TableHeaderCell>
                <TableHeaderCell />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <Text weight="semibold">{d.name}</Text>
                  </TableCell>
                  <TableCell>{d.category}</TableCell>
                  <TableCell>
                    <VisibilityBadge v={d.visibility} />
                  </TableCell>
                  <TableCell>{d.version}</TableCell>
                  <TableCell>
                    {fmtDate(d.uploaded)}
                    <Caption1 className={s.muted} block>
                      {userById(d.uploadedBy).name}
                    </Caption1>
                  </TableCell>
                  <TableCell>{d.size}</TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Tooltip content="Download" relationship="label">
                        <Button size="small" appearance="subtle" icon={<ArrowDownload16Regular />} />
                      </Tooltip>
                      <Tooltip content="Version history" relationship="label">
                        <Button size="small" appearance="subtle" icon={<History16Regular />} />
                      </Tooltip>
                      {perm.canEditAll && d.visibility !== 'Confidential' && (
                        <Tooltip content={d.visibility === 'Client-visible' ? 'Published to client site' : 'Publish to client site'} relationship="label">
                          <Button
                            size="small"
                            appearance="subtle"
                            icon={<Globe16Regular />}
                            onClick={() => {
                              setDocs(docs.map((x) => (x.id === d.id ? { ...x, visibility: 'Client-visible' } : x)));
                              setNotice(`${d.name} published to the client site.`);
                            }}
                          />
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Section>
    </div>
  );
}

function DiscussionTab() {
  const s = useStyles();
  const perm = usePermissions();
  const [list, setList] = useState(seedComments);
  const [text, setText] = useState('');
  return (
    <Section title="Comments and decisions">
      {list.map((c, i) => (
        <div key={i} className={s.comment}>
          <Avatar name={userById(c.who).name} size={32} />
          <div className={s.commentBody}>
            <Text weight="semibold">
              {userById(c.who).name} <Caption1 className={s.muted}>· {fmtDate(c.date)}</Caption1>
            </Text>
            <Body1>{c.text}</Body1>
          </div>
        </div>
      ))}
      {perm.canComment && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <Field label="Add a comment" style={{ flex: 1 }}>
            <Textarea value={text} onChange={(_, d) => setText(d.value)} rows={2} placeholder="Comments are visible to the project team, not to clients." />
          </Field>
          <Button
            appearance="primary"
            disabled={!text}
            onClick={() => {
              setList([...list, { who: perm.userId, date: TODAY, text }]);
              setText('');
            }}
          >
            Post
          </Button>
        </div>
      )}
    </Section>
  );
}

function HistoryTab({ p }: { p: Project }) {
  const s = useStyles();
  return (
    <Section title="Activity history" action={<Caption1 className={s.muted}>From the audit trail; read only</Caption1>}>
      <div className={s.timeline}>
        {historyFor(p).map((h, i) => (
          <div key={i} className={s.tItem}>
            <Caption1 className={s.muted}>{fmtDate(h.date)}</Caption1>
            <span>
              <Text weight="semibold">{h.action}</Text> · {h.detail}
              <Caption1 className={s.muted} block>
                {h.who}
              </Caption1>
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}
