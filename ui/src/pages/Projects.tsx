import { useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Avatar,
  Button,
  Caption1,
  Dropdown,
  Input,
  makeStyles,
  Option,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  tokens,
  ToggleButton,
} from '@fluentui/react-components';
import { Add20Regular, ArrowDownload20Regular, Search20Regular, Warning16Filled } from '@fluentui/react-icons';
import { PageHeader, PriorityText, ScopeBadge, StatusBadge } from '../components/common';
import {
  categories,
  fmtDate,
  fmtMoney,
  owners,
  toBase,
  projects,
  scopeLabel,
  TODAY,
  userById,
  workflows,
  type Project,
  type Scope,
} from '../data/mock';
import { useApp, usePermissions } from '../state/AppContext';

const useStyles = makeStyles({
  bar: { display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '12px' },
  search: { minWidth: '260px', flex: '1 1 260px', maxWidth: '420px' },
  dd: { minWidth: '160px' },
  views: { display: 'flex', gap: '4px', marginLeft: 'auto' },
  card: { backgroundColor: tokens.colorNeutralBackground1, borderRadius: tokens.borderRadiusLarge, border: `1px solid ${tokens.colorNeutralStroke2}`, overflowX: 'auto' },
  row: { cursor: 'pointer' },
  link: { color: tokens.colorBrandForegroundLink, textDecoration: 'none', fontWeight: 600 },
  title: { display: 'flex', flexDirection: 'column' },
  muted: { color: tokens.colorNeutralForeground3 },
  owner: { display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' },
  late: { color: tokens.colorPaletteRedForeground1, display: 'inline-flex', alignItems: 'center', gap: '4px' },
  num: { textAlign: 'right', whiteSpace: 'nowrap' },
  footer: { padding: '10px 16px', color: tokens.colorNeutralForeground3 },
  stage: { whiteSpace: 'nowrap' },
});

type SortKey = 'ref' | 'title' | 'owner' | 'status' | 'estSpend' | 'target' | 'deadline';

export function Projects() {
  const s = useStyles();
  const { scope } = useParams<{ scope?: Scope }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { role } = useApp();
  const perm = usePermissions();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [view, setView] = useState<'open' | 'all' | 'closed'>('open');
  const [owner, setOwner] = useState('All');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'deadline', dir: 1 });

  const rows = useMemo(() => {
    const base = role === 'stakeholder' ? projects.filter((p) => p.stakeholderIds.includes(perm.userId)) : projects;
    const isOpen = (p: Project) => p.status !== 'Completed' && p.status !== 'Cancelled';
    const text = q.trim().toLowerCase();
    const list = base.filter(
      (p) =>
        (!scope || p.scope === scope) &&
        (view === 'all' || (view === 'open' ? isOpen(p) : !isOpen(p))) &&
        (owner === 'All' || p.ownerId === owner) &&
        (category === 'All' || p.category === category) &&
        (!text || `${p.ref} ${p.title} ${p.category} ${p.department} ${userById(p.ownerId).name}`.toLowerCase().includes(text)),
    );
    const val = (p: Project): string | number => {
      switch (sort.key) {
        case 'ref': return p.ref;
        case 'title': return p.title;
        case 'owner': return userById(p.ownerId).name;
        case 'status': return p.status;
        case 'estSpend': return toBase(p.estSpend, p.currency);
        case 'target': return p.target;
        case 'deadline': return p.nextDeadline?.date ?? '9999';
      }
    };
    return [...list].sort((a, b) => (val(a) < val(b) ? -sort.dir : val(a) > val(b) ? sort.dir : 0));
  }, [scope, view, owner, category, q, sort, role, perm.userId]);

  const header = (key: SortKey, label: string, numeric = false) => (
    <TableHeaderCell
      className={numeric ? s.num : undefined}
      sortDirection={sort.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}
      onClick={() => setSort({ key, dir: sort.key === key ? (sort.dir === 1 ? -1 : 1) : 1 })}
    >
      {label}
    </TableHeaderCell>
  );

  return (
    <>
      <PageHeader
        title={scope ? scopeLabel[scope] : 'All sourcing projects'}
        subtitle={
          scope === 'competitive'
            ? 'Tenders, RFIs, RFQs and RFPs run against several suppliers'
            : scope === 'sole'
              ? 'Negotiations with an incumbent or single supplier, with mandatory justification'
              : scope === 'support'
                ? 'Advisory and sourcing support requested by the business'
                : 'Every sourcing project across the three scopes'
        }
        actions={
          <>
            <Button icon={<ArrowDownload20Regular />}>Export to Excel</Button>
            {perm.canCreate && (
              <Button appearance="primary" icon={<Add20Regular />} onClick={() => navigate(`/projects/new${scope ? `?scope=${scope}` : ''}`)}>
                New project
              </Button>
            )}
          </>
        }
      />
      <div className={s.bar}>
        <Input className={s.search} value={q} onChange={(_, d) => setQ(d.value)} contentBefore={<Search20Regular />} placeholder="Search by reference, title, owner or category" aria-label="Search projects" />
        <Dropdown className={s.dd} aria-label="Owner" value={owner === 'All' ? 'All owners' : userById(owner).name} selectedOptions={[owner]} onOptionSelect={(_, d) => setOwner(d.optionValue ?? 'All')}>
          <Option value="All">All owners</Option>
          {owners.map((o) => (
            <Option key={o.id} value={o.id}>
              {o.name}
            </Option>
          ))}
        </Dropdown>
        <Dropdown className={s.dd} aria-label="Category" value={category === 'All' ? 'All categories' : category} selectedOptions={[category]} onOptionSelect={(_, d) => setCategory(d.optionValue ?? 'All')}>
          <Option value="All">All categories</Option>
          {categories.map((c) => (
            <Option key={c} value={c}>
              {c}
            </Option>
          ))}
        </Dropdown>
        <div className={s.views} role="group" aria-label="Show">
          {(['open', 'closed', 'all'] as const).map((v) => (
            <ToggleButton key={v} size="small" checked={view === v} onClick={() => setView(v)} appearance={view === v ? 'primary' : 'subtle'}>
              {v === 'open' ? 'Open' : v === 'closed' ? 'Closed' : 'All'}
            </ToggleButton>
          ))}
        </div>
      </div>
      <div className={s.card}>
        <Table aria-label="Projects" sortable>
          <TableHeader>
            <TableRow>
              {header('ref', 'Reference')}
              {header('title', 'Project')}
              {!scope && <TableHeaderCell>Scope</TableHeaderCell>}
              <TableHeaderCell>Stage</TableHeaderCell>
              {header('status', 'Status')}
              {header('owner', 'Owner')}
              {header('estSpend', 'Est. spend', true)}
              {header('deadline', 'Next deadline')}
              <TableHeaderCell>Priority</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => {
              const late = p.nextDeadline && p.nextDeadline.date < TODAY;
              return (
                <TableRow key={p.id} className={s.row} onClick={() => navigate(`/projects/${p.id}`)}>
                  <TableCell>
                    <RouterLink className={s.link} to={`/projects/${p.id}`} onClick={(e) => e.stopPropagation()}>
                      {p.ref}
                    </RouterLink>
                  </TableCell>
                  <TableCell>
                    <div className={s.title}>
                      <Text weight="semibold">{p.title}</Text>
                      <Caption1 className={s.muted}>
                        {p.category} · {p.department}
                      </Caption1>
                    </div>
                  </TableCell>
                  {!scope && (
                    <TableCell>
                      <ScopeBadge scope={p.scope} />
                    </TableCell>
                  )}
                  <TableCell className={s.stage}>
                    <Caption1>
                      {p.stage + 1}/{workflows[p.scope].length} · {workflows[p.scope][p.stage].name}
                    </Caption1>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <TableCell>
                    <span className={s.owner}>
                      <Avatar name={userById(p.ownerId).name} size={20} /> {userById(p.ownerId).name}
                    </span>
                  </TableCell>
                  <TableCell className={s.num}>{fmtMoney(p.estSpend, false, p.currency)}</TableCell>
                  <TableCell>
                    {p.nextDeadline ? (
                      <span className={late ? s.late : undefined}>
                        {late && <Warning16Filled />} {fmtDate(p.nextDeadline.date)}
                        <Caption1 className={s.muted} block>
                          {p.nextDeadline.label}
                        </Caption1>
                      </span>
                    ) : (
                      <Caption1 className={s.muted}>Closed {fmtDate(p.completed)}</Caption1>
                    )}
                  </TableCell>
                  <TableCell>
                    <PriorityText priority={p.priority} />
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9}>
                  <Text className={s.muted}>No projects match these filters.</Text>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className={s.footer}>
          <Caption1>{rows.length} projects</Caption1>
        </div>
      </div>
    </>
  );
}
