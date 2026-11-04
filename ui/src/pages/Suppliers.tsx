import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Badge,
  Button,
  Caption1,
  Dropdown,
  Input,
  makeStyles,
  Option,
  OverlayDrawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  Subtitle2,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  tokens,
} from '@fluentui/react-components';
import { Add20Regular, Dismiss24Regular, Search20Regular, Star16Filled } from '@fluentui/react-icons';
import { PageHeader, ScopeBadge, StatusBadge } from '../components/common';
import { categories, fmtMoney, projects, suppliers, toBase, type Supplier } from '../data/mock';
import { usePermissions } from '../state/AppContext';

const useStyles = makeStyles({
  bar: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' },
  card: { backgroundColor: tokens.colorNeutralBackground1, borderRadius: tokens.borderRadiusLarge, border: `1px solid ${tokens.colorNeutralStroke2}`, overflowX: 'auto' },
  row: { cursor: 'pointer' },
  muted: { color: tokens.colorNeutralForeground3 },
  num: { textAlign: 'right' },
  star: { color: tokens.colorPaletteMarigoldForeground1, display: 'inline-flex', alignItems: 'center', gap: '2px' },
  kv: { display: 'grid', gridTemplateColumns: '130px 1fr', gap: '8px 12px', marginBottom: '20px' },
  link: { color: tokens.colorBrandForegroundLink, textDecoration: 'none', fontWeight: 600 },
  item: { padding: '8px 0', borderBottom: `1px solid ${tokens.colorNeutralStroke3}`, display: 'flex', flexDirection: 'column', gap: '4px' },
});

const stats = (sup: Supplier) => {
  const invited = projects.filter((p) => p.supplierIds.includes(sup.id));
  const awarded = projects.filter((p) => p.awardedSupplierId === sup.id);
  return { invited, awarded, value: awarded.reduce((a, p) => a + toBase(p.estSpend - p.savings, p.currency), 0) };
};

export function Suppliers() {
  const s = useStyles();
  const perm = usePermissions();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [open, setOpen] = useState<Supplier | null>(null);
  const rows = useMemo(
    () => suppliers.filter((x) => (cat === 'All' || x.category === cat) && `${x.name} ${x.country} ${x.contact}`.toLowerCase().includes(q.toLowerCase())),
    [q, cat],
  );
  return (
    <>
      <PageHeader title="Suppliers" subtitle="Supplier master data and participation history" actions={perm.canCreate && <Button appearance="primary" icon={<Add20Regular />}>Add supplier</Button>} />
      <div className={s.bar}>
        <Input value={q} onChange={(_, d) => setQ(d.value)} contentBefore={<Search20Regular />} placeholder="Search suppliers" aria-label="Search suppliers" style={{ minWidth: 260 }} />
        <Dropdown value={cat === 'All' ? 'All categories' : cat} selectedOptions={[cat]} onOptionSelect={(_, d) => setCat(d.optionValue ?? 'All')} aria-label="Category">
          <Option value="All">All categories</Option>
          {categories.map((c) => (
            <Option key={c}>{c}</Option>
          ))}
        </Dropdown>
      </div>
      <div className={s.card}>
        <Table aria-label="Suppliers">
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Supplier</TableHeaderCell>
              <TableHeaderCell>Category</TableHeaderCell>
              <TableHeaderCell>Country</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className={s.num}>Invited</TableHeaderCell>
              <TableHeaderCell className={s.num}>Awarded</TableHeaderCell>
              <TableHeaderCell>Rating</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((x) => {
              const st = stats(x);
              return (
                <TableRow key={x.id} className={s.row} onClick={() => setOpen(x)}>
                  <TableCell>
                    <Text weight="semibold">{x.name}</Text>
                    <Caption1 className={s.muted} block>
                      {x.contact} · {x.email}
                    </Caption1>
                  </TableCell>
                  <TableCell>{x.category}</TableCell>
                  <TableCell>{x.country}</TableCell>
                  <TableCell>
                    <Badge appearance="tint" color={x.status === 'Active' ? 'success' : x.status === 'Under review' ? 'warning' : 'subtle'}>
                      {x.status}
                    </Badge>
                  </TableCell>
                  <TableCell className={s.num}>{st.invited.length}</TableCell>
                  <TableCell className={s.num}>{st.awarded.length}</TableCell>
                  <TableCell>
                    <span className={s.star}>
                      <Star16Filled /> {x.rating.toFixed(1)}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <OverlayDrawer position="end" size="medium" open={!!open} onOpenChange={(_, d) => !d.open && setOpen(null)}>
        {open && (
          <>
            <DrawerHeader>
              <DrawerHeaderTitle action={<Button appearance="subtle" aria-label="Close" icon={<Dismiss24Regular />} onClick={() => setOpen(null)} />}>
                {open.name}
              </DrawerHeaderTitle>
            </DrawerHeader>
            <DrawerBody>
              <div className={s.kv}>
                <span className={s.muted}>Category</span>
                <span>{open.category}</span>
                <span className={s.muted}>Country</span>
                <span>{open.country}</span>
                <span className={s.muted}>Contact</span>
                <span>
                  {open.contact}, {open.email}
                </span>
                <span className={s.muted}>Participation</span>
                <span>
                  {stats(open).invited.length} invitations, {stats(open).awarded.length} awards
                </span>
                <span className={s.muted}>Awarded value (EUR)</span>
                <span>{fmtMoney(stats(open).value)}</span>
              </div>
              <Subtitle2>Project history</Subtitle2>
              {stats(open).invited.map((p) => (
                <div key={p.id} className={s.item}>
                  <RouterLink className={s.link} to={`/projects/${p.id}`}>
                    {p.ref} · {p.title}
                  </RouterLink>
                  <span style={{ display: 'flex', gap: 6 }}>
                    <ScopeBadge scope={p.scope} /> <StatusBadge status={p.status} />
                    {p.awardedSupplierId === open.id && (
                      <Badge appearance="filled" color="success">
                        Awarded
                      </Badge>
                    )}
                  </span>
                </div>
              ))}
              {stats(open).invited.length === 0 && <Text className={s.muted}>Not yet invited to any project.</Text>}
            </DrawerBody>
          </>
        )}
      </OverlayDrawer>
    </>
  );
}
