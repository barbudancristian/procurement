import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
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
} from '@fluentui/react-components';
import { ArrowDownload16Regular, Search20Regular } from '@fluentui/react-icons';
import { PageHeader, VisibilityBadge } from '../components/common';
import { docsFor, fmtDate, projects, userById } from '../data/mock';
import { useApp, usePermissions } from '../state/AppContext';

const useStyles = makeStyles({
  bar: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' },
  card: { backgroundColor: tokens.colorNeutralBackground1, borderRadius: tokens.borderRadiusLarge, border: `1px solid ${tokens.colorNeutralStroke2}`, overflowX: 'auto' },
  muted: { color: tokens.colorNeutralForeground3 },
  link: { color: tokens.colorBrandForegroundLink, textDecoration: 'none', fontWeight: 600 },
  footer: { padding: '10px 16px' },
});

export function Documents() {
  const s = useStyles();
  const perm = usePermissions();
  const { role } = useApp();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const all = useMemo(() => {
    const ps = role === 'stakeholder' ? projects.filter((p) => p.stakeholderIds.includes(perm.userId)) : projects;
    return ps.flatMap((p) => docsFor(p).map((d) => ({ ...d, ref: p.ref, title: p.title })));
  }, [role, perm.userId]);
  const cats = Array.from(new Set(all.map((d) => d.category))).sort();
  const rows = all
    .filter((d) => (perm.canSeeConfidential || d.visibility !== 'Confidential') && (cat === 'All' || d.category === cat) && `${d.name} ${d.ref} ${d.title}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (a.uploaded < b.uploaded ? 1 : -1));
  return (
    <>
      <PageHeader title="Document Repository" subtitle="Search documents across all projects you can access. Files are stored in SharePoint, one folder per project." />
      <div className={s.bar}>
        <Input value={q} onChange={(_, d) => setQ(d.value)} contentBefore={<Search20Regular />} placeholder="Search by file name or project" aria-label="Search documents" style={{ minWidth: 300 }} />
        <Dropdown value={cat === 'All' ? 'All categories' : cat} selectedOptions={[cat]} onOptionSelect={(_, d) => setCat(d.optionValue ?? 'All')} aria-label="Category">
          <Option value="All">All categories</Option>
          {cats.map((c) => (
            <Option key={c}>{c}</Option>
          ))}
        </Dropdown>
      </div>
      <div className={s.card}>
        <Table size="small" aria-label="Documents">
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Document</TableHeaderCell>
              <TableHeaderCell>Project</TableHeaderCell>
              <TableHeaderCell>Category</TableHeaderCell>
              <TableHeaderCell>Visibility</TableHeaderCell>
              <TableHeaderCell>Version</TableHeaderCell>
              <TableHeaderCell>Uploaded</TableHeaderCell>
              <TableHeaderCell />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.slice(0, 60).map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  <Text weight="semibold">{d.name}</Text>
                </TableCell>
                <TableCell>
                  <RouterLink className={s.link} to={`/projects/${d.projectId}`}>
                    {d.ref}
                  </RouterLink>
                  <Caption1 className={s.muted} block>
                    {d.title}
                  </Caption1>
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
                <TableCell>
                  <Button size="small" appearance="subtle" icon={<ArrowDownload16Regular />} aria-label={`Download ${d.name}`} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className={s.footer}>
          <Caption1 className={s.muted}>
            Showing {Math.min(60, rows.length)} of {rows.length} documents
          </Caption1>
        </div>
      </div>
    </>
  );
}
