import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Button,
  Caption1,
  Input,
  makeStyles,
  Menu,
  MenuItemRadio,
  MenuList,
  MenuPopover,
  MenuTrigger,
  MenuGroup,
  MenuGroupHeader,
  mergeClasses,
  Text,
  tokens,
  Tooltip,
} from '@fluentui/react-components';
import {
  Add20Regular,
  Alert20Regular,
  Board20Regular,
  BuildingMultiple20Regular,
  ChartMultiple20Regular,
  ChevronDown16Regular,
  DocumentBulletList20Regular,
  Flow20Regular,
  FolderOpen20Regular,
  Handshake20Regular,
  History20Regular,
  Navigation20Regular,
  PaintBrush20Regular,
  People20Regular,
  PlugConnected20Regular,
  QuestionCircle20Regular,
  Search20Regular,
  Trophy20Regular,
  WeatherMoon20Regular,
  WeatherSunny20Regular,
  Lightbulb20Regular,
  Globe20Regular,
} from '@fluentui/react-icons';
import { useApp, usePermissions } from '../state/AppContext';
import { projects, roleLabel, TODAY, type Role } from '../data/mock';

const useStyles = makeStyles({
  root: { display: 'grid', gridTemplateColumns: 'auto 1fr', gridTemplateRows: 'auto auto 1fr', height: '100%', backgroundColor: tokens.colorNeutralBackground2 },
  banner: {
    gridColumn: '1 / -1',
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorNeutralForeground1,
    padding: '6px 16px',
    fontSize: '12px',
    textAlign: 'center',
  },
  top: {
    gridColumn: '1 / -1',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '0 16px',
    height: '56px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  brand: { display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, textDecoration: 'none', color: 'inherit' },
  logo: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '13px',
    flexShrink: 0,
    overflow: 'hidden',
  },
  logoImg: { width: '100%', height: '100%', objectFit: 'contain' },
  appName: { fontWeight: 600, fontSize: '16px', whiteSpace: 'nowrap' },
  search: { flex: '1 1 auto', maxWidth: '520px', marginLeft: '24px', '@media (max-width: 760px)': { display: 'none' } },
  spacer: { flex: '1 1 auto' },
  topActions: { display: 'flex', alignItems: 'center', gap: '4px' },
  hideSmall: { '@media (max-width: 760px)': { display: 'none' } },
  userText: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: '14px', '@media (max-width: 760px)': { display: 'none' } },
  menuBtn: { display: 'none', '@media (max-width: 760px)': { display: 'inline-flex' } },
  nav: {
    width: '244px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: '12px 8px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    '@media (max-width: 760px)': {
      position: 'fixed',
      top: '88px',
      bottom: 0,
      left: 0,
      zIndex: 20,
      boxShadow: tokens.shadow16,
      transform: 'translateX(-110%)',
      transition: 'transform 0.2s',
    },
  },
  navOpen: { '@media (max-width: 760px)': { transform: 'translateX(0)' } },
  group: { padding: '14px 12px 4px', color: tokens.colorNeutralForeground3, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    borderRadius: '6px',
    color: tokens.colorNeutralForeground2,
    textDecoration: 'none',
    fontSize: '14px',
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover, color: tokens.colorNeutralForeground1 },
  },
  sublink: { paddingLeft: '42px', fontSize: '13px' },
  active: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    fontWeight: 600,
    ':hover': { backgroundColor: tokens.colorBrandBackground2Hover, color: tokens.colorBrandForeground2 },
  },
  count: { marginLeft: 'auto' },
  main: { overflow: 'auto', padding: '24px 32px 48px', minWidth: 0, '@media (max-width: 760px)': { padding: '16px', gridColumn: '1 / -1' } },
  inner: { maxWidth: '1440px', margin: '0 auto' },
  navFooter: { marginTop: 'auto', padding: '12px', color: tokens.colorNeutralForeground3 },
});

function Item({ to, icon, label, count, sub, onClick, end }: { to: string; icon?: ReactNode; label: string; count?: number; sub?: boolean; onClick: () => void; end?: boolean }) {
  const s = useStyles();
  return (
    <NavLink to={to} end={end} onClick={onClick} className={({ isActive }) => mergeClasses(s.link, sub && s.sublink, isActive && s.active)}>
      {icon}
      <span>{label}</span>
      {count !== undefined && (
        <Badge className={s.count} appearance="tint" color="informative" size="small">
          {count}
        </Badge>
      )}
    </NavLink>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const s = useStyles();
  const { branding, dark, setDark, role, setRole, currentUser } = useApp();
  const perm = usePermissions();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const close = () => setOpen(false);
  const active = projects.filter((p) => p.status === 'In progress' || p.status === 'On hold' || p.status === 'Draft');
  const overdue = active.filter((p) => p.nextDeadline && p.nextDeadline.date < TODAY).length;
  const count = (scope: string) => active.filter((p) => p.scope === scope).length;

  return (
    <div className={s.root}>
      <div className={s.banner}>
        Design preview with sample data. Use <strong>Viewing as</strong> (top right) to see what each role can see and do.
      </div>
      <header className={s.top}>
        <Button className={s.menuBtn} appearance="subtle" icon={<Navigation20Regular />} aria-label="Open navigation" onClick={() => setOpen(!open)} />
        <NavLink to="/" className={s.brand}>
          <div className={s.logo} aria-hidden>
            {branding.logoDataUrl ? <img src={branding.logoDataUrl} alt="" className={s.logoImg} /> : branding.logoText}
          </div>
          <span className={s.appName}>{branding.appName}</span>
        </NavLink>
        {!perm.isClient && (
          <Input
            className={s.search}
            contentBefore={<Search20Regular />}
            placeholder="Search projects, suppliers, documents"
            aria-label="Search"
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigate(`/projects?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`);
            }}
          />
        )}
        <div className={s.spacer} />
        <div className={s.topActions}>
          {perm.canCreate && (
            <Button className={s.hideSmall} appearance="primary" icon={<Add20Regular />} onClick={() => navigate('/projects/new')}>
              New project
            </Button>
          )}
          {!perm.isClient && (
            <Tooltip content={`${overdue} overdue deadlines`} relationship="label">
              <Button appearance="subtle" icon={<Alert20Regular />} onClick={() => navigate('/?focus=overdue')} />
            </Tooltip>
          )}
          <Tooltip content={dark ? 'Switch to light mode' : 'Switch to dark mode'} relationship="label">
            <Button appearance="subtle" icon={dark ? <WeatherSunny20Regular /> : <WeatherMoon20Regular />} onClick={() => setDark(!dark)} />
          </Tooltip>
          <Tooltip content="Help and guides" relationship="label">
            <Button className={s.hideSmall} appearance="subtle" icon={<QuestionCircle20Regular />} />
          </Tooltip>
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Button appearance="subtle" icon={<Avatar name={currentUser.name} size={24} />} iconPosition="before">
                <span className={s.userText}>
                  <Text size={200} weight="semibold">{currentUser.name}</Text>
                  <Caption1>Viewing as {roleLabel[role]}</Caption1>
                </span>
                <ChevronDown16Regular />
              </Button>
            </MenuTrigger>
            <MenuPopover>
              <MenuList
                checkedValues={{ role: [role] }}
                onCheckedValueChange={(_, d) => {
                  setRole(d.checkedItems[0] as Role);
                  navigate('/');
                }}
              >
                <MenuGroup>
                  <MenuGroupHeader>Preview as role</MenuGroupHeader>
                  {(['admin', 'manager', 'specialist', 'stakeholder', 'client'] as Role[]).map((r) => (
                    <MenuItemRadio key={r} name="role" value={r}>
                      {roleLabel[r]}
                    </MenuItemRadio>
                  ))}
                </MenuGroup>
              </MenuList>
            </MenuPopover>
          </Menu>
        </div>
      </header>

      <nav className={mergeClasses(s.nav, open && s.navOpen)} aria-label="Main">
        {perm.isClient ? (
          <>
            <Item to="/" end icon={<Globe20Regular />} label="Client site preview" onClick={close} />
          </>
        ) : (
          <>
            <Item to="/" end icon={<Board20Regular />} label="Dashboard" onClick={close} />
            <div className={s.group}>Sourcing projects</div>
            <Item to="/projects" end icon={<DocumentBulletList20Regular />} label="All projects" count={active.length} onClick={close} />
            <Item to="/projects/scope/competitive" icon={<Trophy20Regular />} label="Competitive Sourcing" count={count('competitive')} onClick={close} />
            <Item to="/projects/scope/sole" icon={<Handshake20Regular />} label="Sole Source" count={count('sole')} onClick={close} />
            <Item to="/projects/scope/support" icon={<Lightbulb20Regular />} label="Sourcing Support" count={count('support')} onClick={close} />
            <div className={s.group}>Workspace</div>
            <Item to="/suppliers" icon={<BuildingMultiple20Regular />} label="Suppliers" onClick={close} />
            {role !== 'stakeholder' && <Item to="/reports" icon={<ChartMultiple20Regular />} label="Reports & Analytics" onClick={close} />}
            <Item to="/documents" icon={<FolderOpen20Regular />} label="Document Repository" onClick={close} />
            {(perm.canAdmin || perm.canSeeAudit) && <div className={s.group}>Administration</div>}
            {perm.canAdmin && (
              <>
                <Item to="/admin/users" icon={<People20Regular />} label="Users & Access" onClick={close} />
                <Item to="/admin/workflows" icon={<Flow20Regular />} label="Workflows" onClick={close} />
                <Item to="/admin/branding" icon={<PaintBrush20Regular />} label="Branding" onClick={close} />
                <Item to="/admin/connection" icon={<PlugConnected20Regular />} label="SharePoint Connection" onClick={close} />
              </>
            )}
            {perm.canSeeAudit && <Item to="/admin/audit" icon={<History20Regular />} label="Audit Log" onClick={close} />}
          </>
        )}
        <Caption1 className={s.navFooter}>
          {branding.appName} · v0.1 design preview
        </Caption1>
      </nav>

      <main className={s.main} onClick={close}>
        <div className={s.inner}>{children}</div>
      </main>
    </div>
  );
}
