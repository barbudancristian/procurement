import { useMemo, useState } from 'react';
import {
  Body1,
  Button,
  Caption1,
  Card,
  Dropdown,
  makeStyles,
  mergeClasses,
  Option,
  Subtitle2,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  tokens,
} from '@fluentui/react-components';
import { DocumentPdf20Regular, DocumentTable20Regular, TextBulletListSquare20Regular } from '@fluentui/react-icons';
import { PageHeader, Section } from '../components/common';
import { daysBetween, fmtMoney, toBase, owners, projects, scopeLabel, suppliers, userById, type Project, type Scope } from '../data/mock';

const useStyles = makeStyles({
  layout: { display: 'grid', gridTemplateColumns: '320px 1fr', gap: '16px', '@media (max-width: 1000px)': { gridTemplateColumns: '1fr' } },
  list: { display: 'flex', flexDirection: 'column', gap: '8px' },
  item: { padding: '12px 14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px' },
  on: { outline: `2px solid ${tokens.colorBrandStroke1}`, backgroundColor: tokens.colorBrandBackground2 },
  muted: { color: tokens.colorNeutralForeground3 },
  actions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  tableWrap: { overflowX: 'auto' },
  num: { textAlign: 'right', whiteSpace: 'nowrap' },
  sheet: { border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusMedium, padding: '20px', backgroundColor: tokens.colorNeutralBackground1 },
  sheetHead: { display: 'flex', justifyContent: 'space-between', borderBottom: `2px solid ${tokens.colorBrandStroke1}`, paddingBottom: '8px', marginBottom: '12px' },
});

type Row = (string | number)[];
interface Report {
  id: string;
  name: string;
  description: string;
  build: (year: string) => { cols: string[]; rows: Row[]; numeric: number[] };
}

const inYear = (p: Project, y: string) => p.created.startsWith(y) || p.completed?.startsWith(y);
const scopes: Scope[] = ['competitive', 'sole', 'support'];

const reports: Report[] = [
  {
    id: 'annual',
    name: 'Annual sourcing activity',
    description: 'Projects started, completed and open, by scope.',
    build: (y) => ({
      cols: ['Scope', 'Started', 'Completed', 'Open', 'Spend under management (EUR)'],
      numeric: [1, 2, 3, 4],
      rows: scopes.map((sc) => {
        const ps = projects.filter((p) => p.scope === sc && inYear(p, y));
        return [scopeLabel[sc], ps.filter((p) => p.created.startsWith(y)).length, ps.filter((p) => p.completed?.startsWith(y)).length, ps.filter((p) => !p.completed).length, fmtMoney(ps.reduce((a, p) => a + toBase(p.estSpend, p.currency), 0))];
      }),
    }),
  },
  {
    id: 'competitive',
    name: 'Competitive sourcing projects',
    description: 'Every competitive event with suppliers invited, outcome and savings.',
    build: (y) => ({
      cols: ['Reference', 'Title', 'Suppliers', 'Status', 'Awarded to', 'Savings'],
      numeric: [2, 5],
      rows: projects.filter((p) => p.scope === 'competitive' && inYear(p, y)).map((p) => [p.ref, p.title, p.supplierIds.length, p.status, p.awardedSupplierId ? suppliers.find((s) => s.id === p.awardedSupplierId)!.name : '—', fmtMoney(p.savings, false, p.currency)]),
    }),
  },
  {
    id: 'sole',
    name: 'Sole-source justification',
    description: 'Sole-source decisions, reasons and approvals.',
    build: (y) => ({
      cols: ['Reference', 'Title', 'Supplier', 'Annual value', 'Justification', 'Approved by'],
      numeric: [3],
      rows: projects.filter((p) => p.scope === 'sole' && inYear(p, y)).map((p) => [p.ref, p.title, p.supplierIds[0] ? suppliers.find((s) => s.id === p.supplierIds[0])!.name : '—', fmtMoney(p.estSpend, false, p.currency), 'Proprietary technology or IP', p.stage > 1 ? 'Elena Popescu' : 'Pending']),
    }),
  },
  {
    id: 'negotiation',
    name: 'Negotiation performance',
    description: 'Baseline vs final price for completed negotiations.',
    build: (y) => ({
      cols: ['Reference', 'Title', 'Baseline', 'Final', 'Savings %'],
      numeric: [2, 3, 4],
      rows: projects.filter((p) => p.scope !== 'support' && p.completed?.startsWith(y)).map((p) => [p.ref, p.title, fmtMoney(p.estSpend, false, p.currency), fmtMoney(p.estSpend - p.savings, false, p.currency), `${((p.savings / p.estSpend) * 100).toFixed(1)}%`]),
    }),
  },
  {
    id: 'participation',
    name: 'Supplier participation',
    description: 'Invitations and awards per supplier.',
    build: (y) => ({
      cols: ['Supplier', 'Category', 'Invited', 'Awarded', 'Win rate'],
      numeric: [2, 3, 4],
      rows: suppliers
        .map((s) => {
          const inv = projects.filter((p) => p.supplierIds.includes(s.id) && inYear(p, y)).length;
          const aw = projects.filter((p) => p.awardedSupplierId === s.id && inYear(p, y)).length;
          return [s.name, s.category, inv, aw, inv ? `${Math.round((aw / inv) * 100)}%` : '—'];
        })
        .filter((r) => (r[2] as number) > 0),
    }),
  },
  {
    id: 'savings',
    name: 'Savings report',
    description: 'Negotiated savings by category.',
    build: (y) => ({
      cols: ['Category', 'Projects completed', 'Addressed spend (EUR)', 'Savings (EUR)', 'Savings %'],
      numeric: [1, 2, 3, 4],
      rows: Array.from(new Set(projects.map((p) => p.category))).map((c) => {
        const ps = projects.filter((p) => p.category === c && p.completed?.startsWith(y));
        const sp = ps.reduce((a, p) => a + toBase(p.estSpend, p.currency), 0);
        const sv = ps.reduce((a, p) => a + toBase(p.savings, p.currency), 0);
        return [c, ps.length, fmtMoney(sp), fmtMoney(sv), sp ? `${((sv / sp) * 100).toFixed(1)}%` : '—'];
      }),
    }),
  },
  {
    id: 'avoidance',
    name: 'Cost avoidance report',
    description: 'Price increases requested and prevented.',
    build: (y) => ({
      cols: ['Reference', 'Title', 'Cost avoidance'],
      numeric: [2],
      rows: projects.filter((p) => p.costAvoidance > 0 && p.completed?.startsWith(y)).map((p) => [p.ref, p.title, fmtMoney(p.costAvoidance, false, p.currency)]),
    }),
  },
  {
    id: 'workload',
    name: 'Procurement workload',
    description: 'Open and completed projects per owner.',
    build: (y) => ({
      cols: ['Owner', 'Open', 'Completed', 'Avg. duration (days)'],
      numeric: [1, 2, 3],
      rows: owners.map((o) => {
        const ps = projects.filter((p) => p.ownerId === o.id && inYear(p, y));
        const done = ps.filter((p) => p.completed);
        return [o.name, ps.filter((p) => !p.completed).length, done.length, done.length ? Math.round(done.reduce((a, p) => a + daysBetween(p.created, p.completed!), 0) / done.length) : '—'];
      }),
    }),
  },
  {
    id: 'status',
    name: 'Project status',
    description: 'Open projects with stage, owner and next deadline.',
    build: (y) => ({
      cols: ['Reference', 'Title', 'Status', 'Owner', 'Next deadline'],
      numeric: [],
      rows: projects.filter((p) => !p.completed && inYear(p, y)).map((p) => [p.ref, p.title, p.status, userById(p.ownerId).name, p.nextDeadline?.date ?? '—']),
    }),
  },
  {
    id: 'completion',
    name: 'Project completion',
    description: 'Completed projects against target dates.',
    build: (y) => ({
      cols: ['Reference', 'Title', 'Target', 'Completed', 'On time'],
      numeric: [],
      rows: projects.filter((p) => p.completed?.startsWith(y)).map((p) => [p.ref, p.title, p.target, p.completed!, p.completed! <= p.target ? 'Yes' : 'No']),
    }),
  },
];

export function Reports() {
  const s = useStyles();
  const [sel, setSel] = useState(reports[0].id);
  const [year, setYear] = useState('2026');
  const report = reports.find((r) => r.id === sel)!;
  const data = useMemo(() => report.build(year), [report, year]);
  return (
    <>
      <PageHeader title="Reports & Analytics" subtitle="Ten standard reports. Export to Excel, PDF or CSV with your company branding." />
      <div className={s.layout}>
        <div className={s.list} role="listbox" aria-label="Reports">
          {reports.map((r) => (
            <Card key={r.id} className={mergeClasses(s.item, sel === r.id && s.on)} onClick={() => setSel(r.id)} role="option" aria-selected={sel === r.id} tabIndex={0}>
              <Subtitle2>{r.name}</Subtitle2>
              <Caption1 className={s.muted}>{r.description}</Caption1>
            </Card>
          ))}
        </div>
        <Section
          title={report.name}
          action={
            <div className={s.actions}>
              <Dropdown size="small" value={year} selectedOptions={[year]} onOptionSelect={(_, d) => setYear(d.optionValue ?? '2026')} aria-label="Year" style={{ minWidth: 100 }}>
                <Option>2026</Option>
                <Option>2025</Option>
              </Dropdown>
              <Button size="small" icon={<DocumentTable20Regular />}>Excel</Button>
              <Button size="small" icon={<DocumentPdf20Regular />}>PDF</Button>
              <Button size="small" icon={<TextBulletListSquare20Regular />}>CSV</Button>
            </div>
          }
        >
          <div className={s.sheet}>
            <div className={s.sheetHead}>
              <Body1>
                <strong>{report.name}</strong> · {year}
              </Body1>
              <Caption1 className={s.muted}>Generated 4 Nov 2026</Caption1>
            </div>
            <div className={s.tableWrap}>
              <Table size="small" aria-label={report.name}>
                <TableHeader>
                  <TableRow>
                    {data.cols.map((c, i) => (
                      <TableHeaderCell key={c} className={data.numeric.includes(i) ? s.num : undefined}>
                        {c}
                      </TableHeaderCell>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((r, i) => (
                    <TableRow key={i}>
                      {r.map((v, j) => (
                        <TableCell key={j} className={data.numeric.includes(j) ? s.num : undefined}>
                          {v}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {data.rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={data.cols.length}>No data for {year}.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <Caption1 className={s.muted} block style={{ marginTop: 12 }}>
              Confidential – for internal use only
            </Caption1>
          </div>
        </Section>
      </div>
    </>
  );
}
