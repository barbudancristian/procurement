import { useCallback, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Caption1,
  Dropdown,
  makeStyles,
  Option,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  tokens,
} from '@fluentui/react-components';
import { Add20Regular, ArrowDownload20Regular, CalendarClock16Regular, Warning16Filled } from '@fluentui/react-icons';
import { axisStyle, EChart, type ChartColors } from '../components/Chart';
import { KpiCard, PageHeader, ScopeBadge, Section, StatusBadge } from '../components/common';
import {
  categories,
  daysBetween,
  fmtDate,
  fmtMoney,
  fmtAxis,
  toBase,
  owners,
  projects,
  scopeLabel,
  scopeShort,
  suppliers,
  TODAY,
  userById,
  type Project,
  type Scope,
  type Status,
} from '../data/mock';
import { useApp, usePermissions } from '../state/AppContext';

const useStyles = makeStyles({
  filters: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    alignItems: 'center',
    padding: '10px 12px',
    marginBottom: '16px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusLarge,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  dd: { minWidth: '150px', maxWidth: '200px' },
  kpis: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(138px, 1fr))', gap: '12px', marginBottom: '16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '16px' },
  span4: { gridColumn: 'span 4', '@media (max-width: 1100px)': { gridColumn: 'span 6' }, '@media (max-width: 760px)': { gridColumn: 'span 12' } },
  span6: { gridColumn: 'span 6', '@media (max-width: 1100px)': { gridColumn: 'span 12' } },
  span8: { gridColumn: 'span 8', '@media (max-width: 1100px)': { gridColumn: 'span 12' } },
  span12: { gridColumn: 'span 12' },
  tableWrap: { overflowX: 'auto' },
  overdue: { color: tokens.colorPaletteRedForeground1, display: 'inline-flex', alignItems: 'center', gap: '4px' },
  soon: { color: tokens.colorNeutralForeground2, display: 'inline-flex', alignItems: 'center', gap: '4px' },
  muted: { color: tokens.colorNeutralForeground3 },
  link: { color: tokens.colorBrandForegroundLink, textDecoration: 'none', fontWeight: 600, ':hover': { textDecoration: 'underline' } },
});

const ALL = 'All';

export function Dashboard() {
  const s = useStyles();
  const navigate = useNavigate();
  const { role } = useApp();
  const perm = usePermissions();
  const [year, setYear] = useState('2026');
  const [scope, setScope] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);
  const [owner, setOwner] = useState<string>(ALL);
  const [category, setCategory] = useState<string>(ALL);
  const [supplier, setSupplier] = useState<string>(ALL);
  const [mine, setMine] = useState(role === 'specialist');

  const visible = useMemo(
    () => (role === 'stakeholder' ? projects.filter((p) => p.stakeholderIds.includes(perm.userId)) : projects),
    [role, perm.userId],
  );

  const filtered = useMemo(
    () =>
      visible.filter(
        (p) =>
          (year === ALL || p.created.startsWith(year) || (p.completed?.startsWith(year) ?? false) || (p.status !== 'Completed' && p.status !== 'Cancelled')) &&
          (scope === ALL || p.scope === scope) &&
          (status === ALL || p.status === status) &&
          (owner === ALL || p.ownerId === owner) &&
          (category === ALL || p.category === category) &&
          (supplier === ALL || p.supplierIds.includes(supplier)) &&
          (!mine || p.ownerId === perm.userId),
      ),
    [visible, year, scope, status, owner, category, supplier, mine, perm.userId],
  );

  const isOpen = (p: Project) => p.status === 'In progress' || p.status === 'On hold' || p.status === 'Draft';
  const open = filtered.filter(isOpen);
  const completed = filtered.filter((p) => p.status === 'Completed' && (year === ALL || p.completed?.startsWith(year)));
  const spend = filtered.filter((p) => p.status !== 'Cancelled').reduce((a, p) => a + toBase(p.estSpend, p.currency), 0);
  const savings = completed.reduce((a, p) => a + toBase(p.savings, p.currency), 0);
  const avoidance = completed.reduce((a, p) => a + toBase(p.costAvoidance, p.currency), 0);
  const avgDuration = completed.length
    ? Math.round(completed.reduce((a, p) => a + daysBetween(p.created, p.completed!), 0) / completed.length)
    : 0;
  const overdue = open.filter((p) => p.nextDeadline && p.nextDeadline.date < TODAY).sort((a, b) => (a.nextDeadline!.date < b.nextDeadline!.date ? -1 : 1));
  const upcoming = open
    .filter((p) => p.nextDeadline && p.nextDeadline.date >= TODAY && daysBetween(TODAY, p.nextDeadline.date) <= 30)
    .sort((a, b) => (a.nextDeadline!.date < b.nextDeadline!.date ? -1 : 1));

  const scopes: Scope[] = ['competitive', 'sole', 'support'];
  const statuses: Status[] = ['Draft', 'In progress', 'On hold', 'Completed', 'Cancelled'];

  const byScope = useCallback(
    (c: ChartColors) => ({
      tooltip: { trigger: 'item' as const, formatter: '{b}: {c} projects ({d}%)' },
      legend: { bottom: 0, textStyle: { color: c.muted }, icon: 'circle', itemWidth: 10 },
      series: [
        {
          type: 'pie' as const,
          radius: ['52%', '78%'],
          center: ['50%', '44%'],
          padAngle: 1,
          itemStyle: { borderColor: c.surface, borderWidth: 2, borderRadius: 4 },
          label: { show: true, color: c.text, formatter: '{c}', fontSize: 12 },
          labelLine: { length: 6, length2: 6 },
          data: scopes.map((sc, i) => ({ name: scopeShort[sc], value: filtered.filter((p) => p.scope === sc).length, itemStyle: { color: c.series[i] } })),
        },
      ],
    }),
    [filtered],
  );

  const byStatus = useCallback(
    (c: ChartColors) => ({
      grid: { left: 8, right: 16, top: 8, bottom: 8, containLabel: true },
      tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
      xAxis: { type: 'value' as const, minInterval: 1, ...axisStyle(c) },
      yAxis: { type: 'category' as const, inverse: true, data: statuses, ...axisStyle(c), splitLine: { show: false } },
      series: [
        {
          type: 'bar' as const,
          name: 'Projects',
          barMaxWidth: 18,
          itemStyle: { color: c.brand, borderRadius: [0, 4, 4, 0] },
          label: { show: true, position: 'right' as const, color: c.muted, fontSize: 11 },
          data: statuses.map((st) => filtered.filter((p) => p.status === st).length),
        },
      ],
    }),
    [filtered],
  );

  const volume = useCallback(
    (c: ChartColors) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const y = year === ALL ? '2026' : year;
      const created = months.map((_, i) => filtered.filter((p) => p.created.startsWith(`${y}-${String(i + 1).padStart(2, '0')}`)).length);
      const done = months.map((_, i) => filtered.filter((p) => p.completed?.startsWith(`${y}-${String(i + 1).padStart(2, '0')}`)).length);
      return {
        grid: { left: 8, right: 8, top: 28, bottom: 8, containLabel: true },
        legend: { top: 0, right: 0, textStyle: { color: c.muted }, icon: 'roundRect', itemWidth: 10, itemHeight: 10 },
        tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
        xAxis: { type: 'category' as const, data: months, ...axisStyle(c), splitLine: { show: false } },
        yAxis: { type: 'value' as const, minInterval: 1, ...axisStyle(c), axisLine: { show: false } },
        series: [
          { type: 'bar' as const, name: 'Started', data: created, barMaxWidth: 14, barGap: '15%', itemStyle: { color: c.series[0], borderRadius: [4, 4, 0, 0] } },
          { type: 'bar' as const, name: 'Completed', data: done, barMaxWidth: 14, itemStyle: { color: c.series[2], borderRadius: [4, 4, 0, 0] } },
        ],
      };
    },
    [filtered, year],
  );

  const byCategory = useCallback(
    (c: ChartColors) => {
      const rows = categories
        .map((cat) => ({ cat, n: filtered.filter((p) => p.category === cat).length }))
        .filter((r) => r.n > 0)
        .sort((a, b) => b.n - a.n);
      return {
        grid: { left: 8, right: 24, top: 8, bottom: 8, containLabel: true },
        tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
        xAxis: { type: 'value' as const, minInterval: 1, ...axisStyle(c) },
        yAxis: { type: 'category' as const, inverse: true, data: rows.map((r) => r.cat), ...axisStyle(c), splitLine: { show: false } },
        series: [
          {
            type: 'bar' as const,
            name: 'Projects',
            barMaxWidth: 14,
            itemStyle: { color: c.brand, borderRadius: [0, 4, 4, 0] },
            label: { show: true, position: 'right' as const, color: c.muted, fontSize: 11 },
            data: rows.map((r) => r.n),
          },
        ],
      };
    },
    [filtered],
  );

  const byOwner = useCallback(
    (c: ChartColors) => {
      const list = owners.filter((o) => filtered.some((p) => p.ownerId === o.id));
      return {
        grid: { left: 8, right: 16, top: 28, bottom: 8, containLabel: true },
        legend: { top: 0, right: 0, textStyle: { color: c.muted }, icon: 'roundRect', itemWidth: 10, itemHeight: 10 },
        tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
        xAxis: { type: 'value' as const, minInterval: 1, ...axisStyle(c) },
        yAxis: { type: 'category' as const, inverse: true, data: list.map((o) => o.name), ...axisStyle(c), splitLine: { show: false } },
        series: scopes.map((sc, i) => ({
          type: 'bar' as const,
          stack: 'owner',
          name: scopeShort[sc],
          barMaxWidth: 16,
          itemStyle: { color: c.series[i], borderColor: c.surface, borderWidth: 1 },
          data: list.map((o) => filtered.filter((p) => p.ownerId === o.id && p.scope === sc && isOpen(p)).length),
        })),
      };
    },
    [filtered],
  );

  const value = useCallback(
    (c: ChartColors) => {
      const q = ['Q1', 'Q2', 'Q3', 'Q4'];
      const y = year === ALL ? '2026' : year;
      const inQ = (p: Project, i: number) => {
        if (!p.completed?.startsWith(y)) return false;
        const m = Number(p.completed.slice(5, 7));
        return Math.floor((m - 1) / 3) === i;
      };
      return {
        grid: { left: 8, right: 8, top: 28, bottom: 8, containLabel: true },
        legend: { top: 0, right: 0, textStyle: { color: c.muted }, icon: 'roundRect', itemWidth: 10, itemHeight: 10 },
        tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const }, valueFormatter: (v: unknown) => fmtMoney(Number(v)) },
        xAxis: { type: 'category' as const, data: q.map((x) => `${x} ${y}`), ...axisStyle(c), splitLine: { show: false } },
        yAxis: { type: 'value' as const, ...axisStyle(c), axisLine: { show: false }, axisLabel: { color: c.muted, fontSize: 11, formatter: (v: number) => fmtAxis(v) } },
        series: [
          { type: 'bar' as const, name: 'Negotiated savings', barMaxWidth: 22, itemStyle: { color: c.series[0], borderRadius: [4, 4, 0, 0] }, data: q.map((_, i) => completed.filter((p) => inQ(p, i)).reduce((a, p) => a + toBase(p.savings, p.currency), 0)) },
          { type: 'bar' as const, name: 'Cost avoidance', barMaxWidth: 22, itemStyle: { color: c.series[1], borderRadius: [4, 4, 0, 0] }, data: q.map((_, i) => completed.filter((p) => inQ(p, i)).reduce((a, p) => a + toBase(p.costAvoidance, p.currency), 0)) },
        ],
      };
    },
    [completed, year],
  );

  const dd = (label: string, valueStr: string, set: (v: string) => void, options: { value: string; text: string }[]) => (
    <Dropdown
      className={s.dd}
      aria-label={label}
      value={valueStr === ALL ? `${label}: All` : `${label}: ${options.find((o) => o.value === valueStr)?.text}`}
      selectedOptions={[valueStr]}
      onOptionSelect={(_, d) => set(d.optionValue ?? ALL)}
      size="small"
    >
      <Option value={ALL}>{`All`}</Option>
      {options.map((o) => (
        <Option key={o.value} value={o.value}>
          {o.text}
        </Option>
      ))}
    </Dropdown>
  );

  const deadlineRows = (rows: Project[], isOverdue: boolean) => (
    <div className={s.tableWrap}>
      <Table size="small" aria-label={isOverdue ? 'Overdue activities' : 'Upcoming deadlines'}>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Project</TableHeaderCell>
            <TableHeaderCell>Milestone</TableHeaderCell>
            <TableHeaderCell>Due</TableHeaderCell>
            <TableHeaderCell>Owner</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(0, 6).map((p) => {
            const d = daysBetween(TODAY, p.nextDeadline!.date);
            return (
              <TableRow key={p.id}>
                <TableCell>
                  <RouterLink className={s.link} to={`/projects/${p.id}`}>
                    {p.ref}
                  </RouterLink>{' '}
                  <Caption1 className={s.muted}>{p.title}</Caption1>
                </TableCell>
                <TableCell>{p.nextDeadline!.label}</TableCell>
                <TableCell>
                  {isOverdue ? (
                    <span className={s.overdue}>
                      <Warning16Filled /> {-d} days late
                    </span>
                  ) : (
                    <span className={s.soon}>
                      <CalendarClock16Regular /> {d === 0 ? 'Today' : `in ${d} days`} · {fmtDate(p.nextDeadline!.date)}
                    </span>
                  )}
                </TableCell>
                <TableCell>{userById(p.ownerId).name}</TableCell>
              </TableRow>
            );
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={4}>
                <Text className={s.muted}>{isOverdue ? 'Nothing overdue. Well done.' : 'No deadlines in the next 30 days.'}</Text>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Procurement portfolio"
        subtitle={`${role === 'stakeholder' ? 'Projects you are involved in' : 'All sourcing activity at a glance'}. Amounts converted to EUR.`}
        actions={
          <>
            <Button icon={<ArrowDownload20Regular />}>Export</Button>
            {perm.canCreate && (
              <Button appearance="primary" icon={<Add20Regular />} onClick={() => navigate('/projects/new')}>
                New project
              </Button>
            )}
          </>
        }
      />

      <div className={s.filters} role="group" aria-label="Dashboard filters">
        {dd('Year', year, setYear, [
          { value: '2026', text: '2026' },
          { value: '2025', text: '2025' },
        ])}
        {dd('Type', scope, setScope, scopes.map((x) => ({ value: x, text: scopeLabel[x] })))}
        {dd('Status', status, setStatus, statuses.map((x) => ({ value: x, text: x })))}
        {dd('Owner', owner, setOwner, owners.map((o) => ({ value: o.id, text: o.name })))}
        {dd('Category', category, setCategory, categories.map((x) => ({ value: x, text: x })))}
        {dd('Supplier', supplier, setSupplier, suppliers.map((x) => ({ value: x.id, text: x.name })))}
        {role === 'specialist' && <Switch checked={mine} onChange={(_, d) => setMine(d.checked)} label="Only my projects" />}
      </div>

      <div className={s.kpis}>
        <KpiCard label="Total projects" value={filtered.length} note={`${open.length} in progress`} />
        <KpiCard label="Completed" value={completed.length} note={year === ALL ? 'all years' : `in ${year}`} />
        <KpiCard label="Spend under management" value={fmtMoney(spend, true)} help="Sum of estimated spend for all projects that are not cancelled." />
        <KpiCard label="Negotiated savings" value={fmtMoney(savings, true)} help="Baseline cost minus final cost, for completed projects." note={spend ? `${((savings / Math.max(1, completed.reduce((a, p) => a + toBase(p.estSpend, p.currency), 0))) * 100).toFixed(1)}% of addressed spend` : undefined} />
        <KpiCard label="Cost avoidance" value={fmtMoney(avoidance, true)} help="Price increases requested by suppliers that were prevented." />
        <KpiCard label="Avg. duration" value={`${avgDuration} days`} note="creation to close" />
        <KpiCard
          label="Overdue"
          value={<span style={{ color: overdue.length ? tokens.colorPaletteRedForeground1 : undefined }}>{overdue.length}</span>}
          note="activities past due"
        />
      </div>

      <div className={s.grid}>
        <Section className={s.span4} title="Projects by sourcing scope">
          <EChart build={byScope} ariaLabel="Projects by sourcing scope" />
        </Section>
        <Section className={s.span4} title="Projects by status">
          <EChart build={byStatus} ariaLabel="Projects by status" />
        </Section>
        <Section className={s.span4} title="Projects by category">
          <EChart build={byCategory} ariaLabel="Projects by category" />
        </Section>
        <Section className={s.span8} title={`Annual project volume ${year === ALL ? '2026' : year}`}>
          <EChart build={volume} ariaLabel="Projects started and completed per month" />
        </Section>
        <Section className={s.span4} title="Open projects by owner">
          <EChart build={byOwner} ariaLabel="Open projects by owner and scope" />
        </Section>
        <Section className={s.span6} title={<>Overdue activities <Badge appearance="filled" color="danger" size="small">{overdue.length}</Badge></>}>
          {deadlineRows(overdue, true)}
        </Section>
        <Section className={s.span6} title="Upcoming deadlines (30 days)">
          {deadlineRows(upcoming, false)}
        </Section>
        <Section className={s.span12} title="Savings and cost avoidance by quarter">
          <EChart build={value} height={240} ariaLabel="Savings and cost avoidance by quarter" />
        </Section>
        <Section className={s.span12} title="Recently updated">
          <div className={s.tableWrap}>
            <Table size="small" aria-label="Recently updated projects">
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Reference</TableHeaderCell>
                  <TableHeaderCell>Title</TableHeaderCell>
                  <TableHeaderCell>Scope</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Owner</TableHeaderCell>
                  <TableHeaderCell>Updated</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...filtered]
                  .sort((a, b) => (a.modified < b.modified ? 1 : -1))
                  .slice(0, 6)
                  .map((p) => (
                    <TableRow key={p.id} onClick={() => navigate(`/projects/${p.id}`)} style={{ cursor: 'pointer' }}>
                      <TableCell>
                        <RouterLink className={s.link} to={`/projects/${p.id}`}>
                          {p.ref}
                        </RouterLink>
                      </TableCell>
                      <TableCell>{p.title}</TableCell>
                      <TableCell>
                        <ScopeBadge scope={p.scope} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={p.status} />
                      </TableCell>
                      <TableCell>{userById(p.ownerId).name}</TableCell>
                      <TableCell>{fmtDate(p.modified)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </Section>
      </div>
    </>
  );
}
