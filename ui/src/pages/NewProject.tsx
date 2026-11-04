import { useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Body1,
  Button,
  Caption1,
  Card,
  Combobox,
  Dropdown,
  Field,
  Input,
  makeStyles,
  mergeClasses,
  MessageBar,
  MessageBarBody,
  Option,
  Radio,
  RadioGroup,
  Subtitle1,
  Subtitle2,
  Textarea,
  tokens,
} from '@fluentui/react-components';
import { ArrowLeft20Regular, ArrowRight20Regular, Checkmark20Regular, Handshake24Regular, Lightbulb24Regular, Trophy24Regular } from '@fluentui/react-icons';
import { PageHeader } from '../components/common';
import {
  categories,
  fmtMoney,
  owners,
  projects,
  scopeLabel,
  scopePrefix,
  suppliers,
  TODAY,
  users,
  type Project,
  type Scope,
} from '../data/mock';
import { usePermissions } from '../state/AppContext';

const useStyles = makeStyles({
  wrap: { maxWidth: '920px' },
  steps: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  step: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '999px', fontSize: '13px', color: tokens.colorNeutralForeground3, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}` },
  stepOn: { color: tokens.colorNeutralForegroundOnBrand, backgroundColor: tokens.colorBrandBackground, border: `1px solid ${tokens.colorBrandBackground}` },
  stepDone: { color: tokens.colorBrandForeground1 },
  num: { fontWeight: 600 },
  card: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  scopes: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' },
  scopeCard: { padding: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px', border: `2px solid transparent` },
  scopeOn: { border: `2px solid ${tokens.colorBrandStroke1}`, backgroundColor: tokens.colorBrandBackground2 },
  scopeIcon: { color: tokens.colorBrandForeground1 },
  muted: { color: tokens.colorNeutralForeground3 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', '@media (max-width: 640px)': { gridTemplateColumns: '1fr' } },
  actions: { display: 'flex', justifyContent: 'space-between', marginTop: '8px' },
  review: { display: 'grid', gridTemplateColumns: '200px 1fr', gap: '8px 16px', '@media (max-width: 640px)': { gridTemplateColumns: '1fr' } },
  label: { color: tokens.colorNeutralForeground3 },
});

const scopeCards: { scope: Scope; icon: ReactNode; text: string; when: string }[] = [
  { scope: 'competitive', icon: <Trophy24Regular />, text: 'Run an RFI, RFQ or RFP with several suppliers, evaluate offers and award.', when: 'Use when the market has several credible suppliers.' },
  { scope: 'sole', icon: <Handshake24Regular />, text: 'Negotiate with the incumbent or a single supplier. A justification and approval are required.', when: 'Use when switching supplier is not practical.' },
  { scope: 'support', icon: <Lightbulb24Regular />, text: 'Advise the business: market analysis, benchmarks, contract reviews, estimates.', when: 'Use when no sourcing event is needed.' },
];

export function NewProject() {
  const s = useStyles();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const perm = usePermissions();
  const [step, setStep] = useState(params.get('scope') ? 1 : 0);
  const [scope, setScope] = useState<Scope>((params.get('scope') as Scope) ?? 'competitive');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [owner, setOwner] = useState(perm.userId);
  const [stakeholders, setStakeholders] = useState<string[]>([]);
  const [target, setTarget] = useState('');
  const [spend, setSpend] = useState('');
  const [strategy, setStrategy] = useState('RFP');
  const [invited, setInvited] = useState<string[]>([]);
  const [incumbent, setIncumbent] = useState('');
  const [expiry, setExpiry] = useState('');
  const [reason, setReason] = useState('');
  const [justification, setJustification] = useState('');
  const [supportType, setSupportType] = useState('Market analysis');
  const [touched, setTouched] = useState(false);

  const steps = ['Sourcing scope', 'Basics', 'Team and dates', scope === 'competitive' ? 'Strategy and suppliers' : scope === 'sole' ? 'Supplier and justification' : 'Support request', 'Review'];
  const year = TODAY.slice(0, 4);
  const nextNo = projects.filter((p) => p.scope === scope && p.ref.includes(`-${year}-`)).length * 3 + 4;
  const ref = `${scopePrefix[scope]}-${year}-${String(nextNo).padStart(4, '0')}`;

  const errors: Record<number, string[]> = {
    1: [!title && 'Title', !category && 'Category', !description && 'Description'].filter(Boolean) as string[],
    2: [!owner && 'Owner', !target && 'Target completion date'].filter(Boolean) as string[],
    3:
      scope === 'competitive'
        ? [!spend && 'Estimated spend'].filter(Boolean) as string[]
        : scope === 'sole'
          ? [!incumbent && 'Incumbent supplier', !reason && 'Justification reason', justification.length < 40 && 'Business justification (at least 40 characters)'].filter(Boolean) as string[]
          : [!department && 'Requesting department'].filter(Boolean) as string[],
  };
  const stepErrors = errors[step] ?? [];
  const req = (cond: boolean) => (touched && cond ? 'error' : 'none') as 'error' | 'none';

  const next = () => {
    if (stepErrors.length) {
      setTouched(true);
      return;
    }
    setTouched(false);
    setStep(step + 1);
  };

  const create = () => {
    const p: Project = {
      id: ref,
      ref,
      scope,
      title,
      description,
      category,
      department: department || 'Procurement',
      ownerId: owner,
      stakeholderIds: stakeholders,
      stage: 0,
      status: 'Draft',
      priority: priority as Project['priority'],
      created: TODAY,
      modified: TODAY,
      target,
      estSpend: Number(spend.replace(/[^0-9]/g, '')) || 0,
      savings: 0,
      costAvoidance: 0,
      supplierIds: scope === 'sole' ? [incumbent] : scope === 'competitive' ? invited : [],
      nextDeadline: { label: scope === 'sole' ? 'Justification approval' : scope === 'support' ? 'Triage' : 'Initial assessment', date: target },
      clientVisible: false,
    };
    projects.unshift(p);
    navigate(`/projects/${p.id}?created=1`);
  };

  return (
    <div className={s.wrap}>
      <PageHeader title="New sourcing project" subtitle={`Reference ${ref} will be assigned when you create the project.`} />
      <div className={s.steps} aria-label="Steps">
        {steps.map((name, i) => (
          <span key={name} className={mergeClasses(s.step, i === step && s.stepOn, i < step && s.stepDone)} aria-current={i === step ? 'step' : undefined}>
            <span className={s.num}>{i < step ? <Checkmark20Regular /> : i + 1}</span> {name}
          </span>
        ))}
      </div>

      <Card className={s.card}>
        {touched && stepErrors.length > 0 && (
          <MessageBar intent="error">
            <MessageBarBody>Please complete: {stepErrors.join(', ')}.</MessageBarBody>
          </MessageBar>
        )}

        {step === 0 && (
          <>
            <Subtitle1>What kind of sourcing work is this?</Subtitle1>
            <div className={s.scopes} role="radiogroup" aria-label="Sourcing scope">
              {scopeCards.map((c) => (
                <Card
                  key={c.scope}
                  className={mergeClasses(s.scopeCard, scope === c.scope && s.scopeOn)}
                  onClick={() => setScope(c.scope)}
                  role="radio"
                  aria-checked={scope === c.scope}
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setScope(c.scope)}
                >
                  <span className={s.scopeIcon}>{c.icon}</span>
                  <Subtitle2>{scopeLabel[c.scope]}</Subtitle2>
                  <Body1>{c.text}</Body1>
                  <Caption1 className={s.muted}>{c.when}</Caption1>
                </Card>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <Field label="Project title" required validationState={req(!title)} validationMessage={touched && !title ? 'Enter a short, descriptive title.' : undefined}>
              <Input value={title} onChange={(_, d) => setTitle(d.value)} placeholder="e.g. Managed print services for all offices" />
            </Field>
            <Field label="Description and business requirements" required validationState={req(!description)} hint="What is needed, why, and any must-have requirements.">
              <Textarea value={description} onChange={(_, d) => setDescription(d.value)} rows={4} resize="vertical" />
            </Field>
            <div className={s.row2}>
              <Field label="Category" required validationState={req(!category)}>
                <Dropdown placeholder="Select a category" value={category} selectedOptions={category ? [category] : []} onOptionSelect={(_, d) => setCategory(d.optionValue ?? '')}>
                  {categories.map((c) => (
                    <Option key={c}>{c}</Option>
                  ))}
                </Dropdown>
              </Field>
              <Field label="Priority">
                <RadioGroup layout="horizontal" value={priority} onChange={(_, d) => setPriority(d.value)}>
                  <Radio value="High" label="High" />
                  <Radio value="Medium" label="Medium" />
                  <Radio value="Low" label="Low" />
                </RadioGroup>
              </Field>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className={s.row2}>
              <Field label="Procurement owner" required>
                <Dropdown value={owners.find((o) => o.id === owner)?.name ?? ''} selectedOptions={[owner]} onOptionSelect={(_, d) => setOwner(d.optionValue ?? '')}>
                  {owners.map((o) => (
                    <Option key={o.id} value={o.id}>
                      {o.name}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
              <Field label="Target completion date" required validationState={req(!target)}>
                <Input type="date" value={target} min={TODAY} onChange={(_, d) => setTarget(d.value)} />
              </Field>
            </div>
            <Field label="Internal stakeholders" hint="They can view the project, comment and see non-confidential documents.">
              <Combobox
                multiselect
                placeholder="Add stakeholders"
                selectedOptions={stakeholders}
                value={stakeholders.map((id) => users.find((u) => u.id === id)?.name).join(', ')}
                onOptionSelect={(_, d) => setStakeholders(d.selectedOptions)}
              >
                {users
                  .filter((u) => u.role === 'stakeholder' || u.role === 'manager')
                  .map((u) => (
                    <Option key={u.id} value={u.id} text={u.name}>
                      {u.name} · {u.department}
                    </Option>
                  ))}
              </Combobox>
            </Field>
          </>
        )}

        {step === 3 && scope === 'competitive' && (
          <>
            <div className={s.row2}>
              <Field label="Estimated spend (EUR)" required validationState={req(!spend)} hint="Total contract value over the full term.">
                <Input value={spend} onChange={(_, d) => setSpend(d.value)} placeholder="e.g. 450000" inputMode="numeric" />
              </Field>
              <Field label="Sourcing strategy">
                <Dropdown value={strategy} selectedOptions={[strategy]} onOptionSelect={(_, d) => setStrategy(d.optionValue ?? 'RFP')}>
                  {['RFI then RFP', 'RFP', 'RFQ', 'RFI only', 'Two-stage RFP with negotiation'].map((x) => (
                    <Option key={x}>{x}</Option>
                  ))}
                </Dropdown>
              </Field>
            </div>
            <Field label="Suppliers to invite" hint="You can add more later. At least 3 are needed before RFx execution.">
              <Combobox
                multiselect
                placeholder="Search suppliers"
                selectedOptions={invited}
                value={invited.map((id) => suppliers.find((x) => x.id === id)?.name).join(', ')}
                onOptionSelect={(_, d) => setInvited(d.selectedOptions)}
              >
                {suppliers
                  .filter((x) => x.status !== 'Inactive')
                  .map((x) => (
                    <Option key={x.id} value={x.id} text={x.name}>
                      {x.name} · {x.category}
                    </Option>
                  ))}
              </Combobox>
            </Field>
          </>
        )}

        {step === 3 && scope === 'sole' && (
          <>
            <div className={s.row2}>
              <Field label="Incumbent supplier" required validationState={req(!incumbent)}>
                <Dropdown placeholder="Select supplier" value={suppliers.find((x) => x.id === incumbent)?.name ?? ''} selectedOptions={incumbent ? [incumbent] : []} onOptionSelect={(_, d) => setIncumbent(d.optionValue ?? '')}>
                  {suppliers.map((x) => (
                    <Option key={x.id} value={x.id}>
                      {x.name}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
              <Field label="Current contract expiry">
                <Input type="date" value={expiry} onChange={(_, d) => setExpiry(d.value)} />
              </Field>
              <Field label="Current annual contract value (EUR)">
                <Input value={spend} onChange={(_, d) => setSpend(d.value)} inputMode="numeric" placeholder="e.g. 180000" />
              </Field>
              <Field label="Justification reason" required validationState={req(!reason)}>
                <Dropdown placeholder="Select reason" value={reason} selectedOptions={reason ? [reason] : []} onOptionSelect={(_, d) => setReason(d.optionValue ?? '')}>
                  {['Proprietary technology or IP', 'Only qualified supplier', 'Switching cost exceeds benefit', 'Continuity of ongoing project', 'Regulatory or certification constraint', 'Urgency (documented)'].map((x) => (
                    <Option key={x}>{x}</Option>
                  ))}
                </Dropdown>
              </Field>
            </div>
            <Field
              label="Business justification"
              required
              validationState={req(justification.length < 40)}
              validationMessage={touched && justification.length < 40 ? 'Explain why a competitive process is not appropriate (at least 40 characters).' : undefined}
              hint="Mandatory. Reviewed by the Procurement Manager at the Justification gate."
            >
              <Textarea value={justification} onChange={(_, d) => setJustification(d.value)} rows={4} />
            </Field>
          </>
        )}

        {step === 3 && scope === 'support' && (
          <>
            <div className={s.row2}>
              <Field label="Requesting department" required validationState={req(!department)}>
                <Dropdown placeholder="Select department" value={department} selectedOptions={department ? [department] : []} onOptionSelect={(_, d) => setDepartment(d.optionValue ?? '')}>
                  {['Operations', 'Information Technology', 'Finance', 'Human Resources', 'Marketing', 'Supply Chain', 'Legal', 'Maintenance', 'Quality'].map((x) => (
                    <Option key={x}>{x}</Option>
                  ))}
                </Dropdown>
              </Field>
              <Field label="Type of support">
                <Dropdown value={supportType} selectedOptions={[supportType]} onOptionSelect={(_, d) => setSupportType(d.optionValue ?? '')}>
                  {['Market analysis', 'Benchmark', 'Contract review', 'Should-cost model', 'Budget estimate', 'Specification support', 'Supplier risk check'].map((x) => (
                    <Option key={x}>{x}</Option>
                  ))}
                </Dropdown>
              </Field>
            </div>
            <Field label="Expected benefit (EUR, optional)" hint="Estimated savings or commercial benefit, if any.">
              <Input value={spend} onChange={(_, d) => setSpend(d.value)} inputMode="numeric" />
            </Field>
          </>
        )}

        {step === 4 && (
          <>
            <Subtitle1>Check and create</Subtitle1>
            <div className={s.review}>
              <span className={s.label}>Reference</span>
              <strong>{ref}</strong>
              <span className={s.label}>Scope</span>
              <span>{scopeLabel[scope]}</span>
              <span className={s.label}>Title</span>
              <span>{title}</span>
              <span className={s.label}>Category</span>
              <span>{category}</span>
              <span className={s.label}>Owner</span>
              <span>{owners.find((o) => o.id === owner)?.name}</span>
              <span className={s.label}>Target date</span>
              <span>{target}</span>
              {spend && (
                <>
                  <span className={s.label}>{scope === 'support' ? 'Expected benefit' : 'Estimated spend'}</span>
                  <span>{fmtMoney(Number(spend.replace(/[^0-9]/g, '')) || 0)}</span>
                </>
              )}
              {scope === 'sole' && (
                <>
                  <span className={s.label}>Incumbent</span>
                  <span>{suppliers.find((x) => x.id === incumbent)?.name}</span>
                  <span className={s.label}>Justification</span>
                  <span>{reason}</span>
                </>
              )}
            </div>
            <MessageBar intent="info">
              <MessageBarBody>
                A project folder will be created in SharePoint and the team will be notified. The project starts as a Draft at stage 1.
              </MessageBarBody>
            </MessageBar>
          </>
        )}

        <div className={s.actions}>
          <Button icon={<ArrowLeft20Regular />} disabled={step === 0} onClick={() => setStep(step - 1)}>
            Back
          </Button>
          {step < 4 ? (
            <Button appearance="primary" icon={<ArrowRight20Regular />} iconPosition="after" onClick={next}>
              Continue
            </Button>
          ) : (
            <Button appearance="primary" icon={<Checkmark20Regular />} onClick={create}>
              Create project
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
