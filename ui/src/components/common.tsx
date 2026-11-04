import type { ReactNode } from 'react';
import {
  Badge,
  Body1,
  Caption1,
  Card,
  makeStyles,
  mergeClasses,
  Subtitle2,
  Text,
  Title2,
  tokens,
  Tooltip,
} from '@fluentui/react-components';
import { CheckmarkCircle16Filled, Circle16Regular, Info16Regular, LockClosed12Regular } from '@fluentui/react-icons';
import { scopeShort, workflows, type Priority, type Scope, type Status, type Visibility } from '../data/mock';

const useStyles = makeStyles({
  header: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' },
  headerText: { display: 'flex', flexDirection: 'column', gap: '4px' },
  sub: { color: tokens.colorNeutralForeground3 },
  actions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  kpi: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 },
  kpiLabel: { color: tokens.colorNeutralForeground3, display: 'flex', alignItems: 'center', gap: '6px' },
  kpiValue: { fontSize: '26px', lineHeight: '32px', fontWeight: 600, color: tokens.colorNeutralForeground1 },
  kpiNote: { color: tokens.colorNeutralForeground3 },
  section: { padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 },
  sectionHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' },
  stages: { display: 'flex', alignItems: 'flex-start', gap: '0', overflowX: 'auto', paddingBottom: '4px' },
  stage: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: '1 1 0', minWidth: '92px', position: 'relative' },
  stageLine: { position: 'absolute', top: '9px', left: '50%', width: '100%', height: '2px', backgroundColor: tokens.colorNeutralStroke2 },
  stageLineDone: { backgroundColor: tokens.colorBrandBackground },
  dot: { width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, backgroundColor: tokens.colorNeutralBackground1 },
  dotCurrent: { boxShadow: `0 0 0 3px ${tokens.colorBrandBackground2}`, backgroundColor: tokens.colorBrandBackground },
  dotDone: { color: tokens.colorBrandForeground1 },
  dotTodo: { color: tokens.colorNeutralForeground4 },
  stageName: { textAlign: 'center', fontSize: '12px', lineHeight: '16px', color: tokens.colorNeutralForeground3, maxWidth: '110px' },
  stageNameCurrent: { color: tokens.colorNeutralForeground1, fontWeight: 600 },
  gate: { fontSize: '10px', color: tokens.colorNeutralForeground3, display: 'flex', alignItems: 'center', gap: '2px' },
});

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  const s = useStyles();
  return (
    <div className={s.header}>
      <div className={s.headerText}>
        <Title2 as="h1">{title}</Title2>
        {subtitle && <Body1 className={s.sub}>{subtitle}</Body1>}
      </div>
      {actions && <div className={s.actions}>{actions}</div>}
    </div>
  );
}

export function KpiCard({ label, value, note, help, icon }: { label: string; value: ReactNode; note?: ReactNode; help?: string; icon?: ReactNode }) {
  const s = useStyles();
  return (
    <Card className={s.kpi}>
      <Caption1 className={s.kpiLabel}>
        {icon}
        {label}
        {help && (
          <Tooltip content={help} relationship="description">
            <Info16Regular tabIndex={0} aria-label={`About ${label}`} />
          </Tooltip>
        )}
      </Caption1>
      <span className={s.kpiValue}>{value}</span>
      {note && <Caption1 className={s.kpiNote}>{note}</Caption1>}
    </Card>
  );
}

export function Section({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  const s = useStyles();
  return (
    <Card className={mergeClasses(s.section, className)}>
      {(title || action) && (
        <div className={s.sectionHead}>
          {title && <Subtitle2 as="h2">{title}</Subtitle2>}
          {action}
        </div>
      )}
      {children}
    </Card>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  const color = {
    Draft: 'informative',
    'In progress': 'brand',
    'On hold': 'warning',
    Completed: 'success',
    Cancelled: 'subtle',
  } as const;
  return (
    <Badge appearance="tint" color={color[status]} shape="rounded">
      {status}
    </Badge>
  );
}

export function ScopeBadge({ scope }: { scope: Scope }) {
  const color = { competitive: 'informative', sole: 'important', support: 'subtle' } as const;
  return (
    <Badge appearance="outline" color={color[scope]} shape="rounded">
      {scopeShort[scope]}
    </Badge>
  );
}

export function PriorityText({ priority }: { priority: Priority }) {
  const color = priority === 'High' ? tokens.colorPaletteRedForeground1 : priority === 'Medium' ? tokens.colorPaletteMarigoldForeground1 : tokens.colorNeutralForeground3;
  return <Text style={{ color }}>{priority}</Text>;
}

export function VisibilityBadge({ v }: { v: Visibility }) {
  if (v === 'Confidential')
    return (
      <Badge appearance="tint" color="danger" shape="rounded" icon={<LockClosed12Regular />}>
        Confidential
      </Badge>
    );
  if (v === 'Client-visible')
    return (
      <Badge appearance="tint" color="success" shape="rounded">
        Client-visible
      </Badge>
    );
  return (
    <Badge appearance="tint" color="subtle" shape="rounded">
      Internal
    </Badge>
  );
}

export function StageTracker({ scope, stage }: { scope: Scope; stage: number }) {
  const s = useStyles();
  const stages = workflows[scope];
  return (
    <div className={s.stages} role="list" aria-label="Project stages">
      {stages.map((st, i) => {
        const done = i < stage;
        const current = i === stage;
        return (
          <div key={st.name} className={s.stage} role="listitem" aria-current={current ? 'step' : undefined}>
            {i < stages.length - 1 && <div className={mergeClasses(s.stageLine, done && s.stageLineDone)} />}
            <div className={mergeClasses(s.dot, current && s.dotCurrent, done && s.dotDone, !done && !current && s.dotTodo)}>
              {done ? <CheckmarkCircle16Filled /> : current ? null : <Circle16Regular />}
            </div>
            <span className={mergeClasses(s.stageName, current && s.stageNameCurrent)}>{st.name}</span>
            {st.approval && (
              <Tooltip content={`Approval: ${st.approval}`} relationship="description">
                <span className={s.gate} tabIndex={0}>
                  <LockClosed12Regular /> Approval
                </span>
              </Tooltip>
            )}
          </div>
        );
      })}
    </div>
  );
}
