// Realistic sample data for the design preview. All companies and people are fictional.

export type Scope = 'competitive' | 'sole' | 'support';
export type Role = 'admin' | 'manager' | 'specialist' | 'stakeholder' | 'client';
export type Status = 'Draft' | 'In progress' | 'On hold' | 'Completed' | 'Cancelled';
export type Priority = 'High' | 'Medium' | 'Low';

export const TODAY = '2026-11-04';

export const scopeLabel: Record<Scope, string> = {
  competitive: 'Competitive Sourcing',
  sole: 'Sole Source / Incumbent',
  support: 'Sourcing Support',
};
export const scopeShort: Record<Scope, string> = {
  competitive: 'Competitive',
  sole: 'Sole Source',
  support: 'Support',
};
export const scopePrefix: Record<Scope, string> = { competitive: 'CS', sole: 'SS', support: 'SR' };

export const roleLabel: Record<Role, string> = {
  admin: 'System Administrator',
  manager: 'Procurement Manager',
  specialist: 'Procurement Specialist',
  stakeholder: 'Internal Stakeholder',
  client: 'Client Viewer',
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  lastActive: string;
  active: boolean;
}

export const users: User[] = [
  { id: 'u1', name: 'Alex Georgescu', email: 'alex.georgescu@contoso.example', role: 'admin', department: 'IT', lastActive: '2026-11-04', active: true },
  { id: 'u2', name: 'Elena Popescu', email: 'elena.popescu@contoso.example', role: 'manager', department: 'Procurement', lastActive: '2026-11-04', active: true },
  { id: 'u3', name: 'Andrei Ionescu', email: 'andrei.ionescu@contoso.example', role: 'specialist', department: 'Procurement', lastActive: '2026-11-04', active: true },
  { id: 'u4', name: 'Maria Dumitru', email: 'maria.dumitru@contoso.example', role: 'specialist', department: 'Procurement', lastActive: '2026-11-03', active: true },
  { id: 'u5', name: 'Mihai Stan', email: 'mihai.stan@contoso.example', role: 'specialist', department: 'Procurement', lastActive: '2026-11-03', active: true },
  { id: 'u6', name: 'Ioana Radu', email: 'ioana.radu@contoso.example', role: 'stakeholder', department: 'Operations', lastActive: '2026-10-30', active: true },
  { id: 'u7', name: 'Victor Marin', email: 'victor.marin@contoso.example', role: 'stakeholder', department: 'Information Technology', lastActive: '2026-10-28', active: true },
  { id: 'u8', name: 'Cristina Barbu', email: 'cristina.barbu@contoso.example', role: 'stakeholder', department: 'Finance', lastActive: '2026-10-21', active: true },
  { id: 'u9', name: 'Sarah Klein', email: 'sarah.klein@northwind.example', role: 'client', department: 'Northwind Logistics (guest)', lastActive: '2026-10-29', active: true },
  { id: 'u10', name: 'Tom Becker', email: 'tom.becker@fabrikam.example', role: 'client', department: 'Fabrikam Retail (guest)', lastActive: '2026-09-12', active: false },
];
export const owners = users.filter((u) => u.role === 'manager' || u.role === 'specialist');
export const userById = (id: string) => users.find((u) => u.id === id)!;

export interface Currency {
  code: string; // ISO 4217
  name: string;
  rateToBase: number; // value of 1 unit in the base currency (EUR)
  active: boolean;
  updated: string;
}

export const BASE_CURRENCY = 'EUR';

// Example exchange rates for the preview. In the app an administrator enters or imports them.
export const currencies: Currency[] = [
  { code: 'EUR', name: 'Euro', rateToBase: 1, active: true, updated: '2026-11-03' },
  { code: 'USD', name: 'US dollar', rateToBase: 0.86, active: true, updated: '2026-11-03' },
  { code: 'GBP', name: 'Pound sterling', rateToBase: 1.15, active: true, updated: '2026-11-03' },
  { code: 'CHF', name: 'Swiss franc', rateToBase: 1.07, active: true, updated: '2026-11-03' },
  { code: 'RON', name: 'Romanian leu', rateToBase: 0.197, active: true, updated: '2026-11-03' },
  { code: 'PLN', name: 'Polish złoty', rateToBase: 0.235, active: true, updated: '2026-11-03' },
  { code: 'CZK', name: 'Czech koruna', rateToBase: 0.041, active: false, updated: '2026-11-03' },
  { code: 'HUF', name: 'Hungarian forint', rateToBase: 0.0026, active: false, updated: '2026-11-03' },
  { code: 'SEK', name: 'Swedish krona', rateToBase: 0.091, active: false, updated: '2026-11-03' },
  { code: 'NOK', name: 'Norwegian krone', rateToBase: 0.086, active: false, updated: '2026-11-03' },
  { code: 'DKK', name: 'Danish krone', rateToBase: 0.134, active: false, updated: '2026-11-03' },
  { code: 'JPY', name: 'Japanese yen', rateToBase: 0.0058, active: false, updated: '2026-11-03' },
  { code: 'CNY', name: 'Chinese yuan', rateToBase: 0.12, active: false, updated: '2026-11-03' },
  { code: 'CAD', name: 'Canadian dollar', rateToBase: 0.62, active: false, updated: '2026-11-03' },
  { code: 'AUD', name: 'Australian dollar', rateToBase: 0.57, active: false, updated: '2026-11-03' },
];

/** Converts an amount to the base currency (EUR) for portfolio totals. */
export const toBase = (amount: number, code: string) => amount * (currencies.find((c) => c.code === code)?.rateToBase ?? 1);

export const categories = [
  'IT Hardware',
  'Software & SaaS',
  'Facilities Management',
  'Logistics & Freight',
  'Professional Services',
  'Marketing & Events',
  'Energy & Utilities',
  'MRO & Spare Parts',
  'Fleet',
  'Telecommunications',
];

export interface Supplier {
  id: string;
  name: string;
  country: string;
  category: string;
  contact: string;
  email: string;
  status: 'Active' | 'Under review' | 'Inactive';
  rating: number;
}

export const suppliers: Supplier[] = [
  { id: 's1', name: 'Arcadia Office Systems', country: 'Romania', category: 'IT Hardware', contact: 'Radu Neagu', email: 'bids@arcadia.example', status: 'Active', rating: 4.2 },
  { id: 's2', name: 'Brightline Print Solutions', country: 'Germany', category: 'IT Hardware', contact: 'Jana Weiss', email: 'tenders@brightline.example', status: 'Active', rating: 4.5 },
  { id: 's3', name: 'Cobalt Cloud Services', country: 'Ireland', category: 'Software & SaaS', contact: 'Liam Byrne', email: 'sales@cobalt.example', status: 'Active', rating: 4.0 },
  { id: 's4', name: 'Danube Facility Partners', country: 'Romania', category: 'Facilities Management', contact: 'Ana Toma', email: 'office@danubefp.example', status: 'Active', rating: 3.8 },
  { id: 's5', name: 'Everstone Logistics', country: 'Netherlands', category: 'Logistics & Freight', contact: 'Pieter de Vries', email: 'quotes@everstone.example', status: 'Active', rating: 4.1 },
  { id: 's6', name: 'Fieldmark Consulting', country: 'Austria', category: 'Professional Services', contact: 'Katrin Huber', email: 'rfp@fieldmark.example', status: 'Active', rating: 4.4 },
  { id: 's7', name: 'Granite Energy Trading', country: 'Romania', category: 'Energy & Utilities', contact: 'Sorin Lupu', email: 'b2b@graniteenergy.example', status: 'Active', rating: 3.6 },
  { id: 's8', name: 'Harbor Industrial Supply', country: 'Poland', category: 'MRO & Spare Parts', contact: 'Marek Nowak', email: 'orders@harbor.example', status: 'Active', rating: 4.0 },
  { id: 's9', name: 'Ionic Telecom', country: 'Romania', category: 'Telecommunications', contact: 'Dana Pop', email: 'enterprise@ionic.example', status: 'Active', rating: 3.9 },
  { id: 's10', name: 'Juniper Fleet Leasing', country: 'Germany', category: 'Fleet', contact: 'Felix Wagner', email: 'corporate@juniperfleet.example', status: 'Active', rating: 4.3 },
  { id: 's11', name: 'Keystone ERP Support', country: 'Romania', category: 'Software & SaaS', contact: 'George Matei', email: 'accounts@keystone.example', status: 'Active', rating: 4.1 },
  { id: 's12', name: 'Lumen Events & Media', country: 'Hungary', category: 'Marketing & Events', contact: 'Zsofia Kiss', email: 'hello@lumen.example', status: 'Under review', rating: 3.5 },
  { id: 's13', name: 'Meridian Tech Distribution', country: 'Czech Republic', category: 'IT Hardware', contact: 'Petr Novak', email: 'tenders@meridian.example', status: 'Active', rating: 4.2 },
  { id: 's14', name: 'Northgate Security Services', country: 'Romania', category: 'Facilities Management', contact: 'Ilie Vasile', email: 'contracts@northgate.example', status: 'Active', rating: 3.7 },
  { id: 's15', name: 'Orbit Software Licensing', country: 'United Kingdom', category: 'Software & SaaS', contact: 'Emma Clarke', email: 'licensing@orbit.example', status: 'Active', rating: 4.6 },
  { id: 's16', name: 'Pinnacle Freight Forwarding', country: 'Romania', category: 'Logistics & Freight', contact: 'Bogdan Ene', email: 'rates@pinnacle.example', status: 'Inactive', rating: 3.2 },
];
export const supplierById = (id: string) => suppliers.find((s) => s.id === id)!;

export interface WorkflowStage {
  name: string;
  approval?: string;
  required?: string[];
}

export const workflows: Record<Scope, WorkflowStage[]> = {
  competitive: [
    { name: 'Creation' },
    { name: 'Initial Assessment', required: ['Category', 'Estimated spend'] },
    { name: 'Sourcing Strategy', approval: 'Procurement Manager', required: ['Strategy', 'Timeline'] },
    { name: 'RFx Execution', required: ['At least 3 invited suppliers'] },
    { name: 'Evaluation', required: ['Scores from all evaluators'] },
    { name: 'Recommendation', required: ['Recommended supplier', 'Savings'] },
    { name: 'Approval', approval: 'Procurement Manager; second approver above €250,000' },
    { name: 'Closed' },
  ],
  sole: [
    { name: 'Creation' },
    { name: 'Justification', approval: 'Procurement Manager', required: ['Business justification', 'Alternatives considered'] },
    { name: 'Negotiation Strategy', required: ['Targets', 'Baseline terms'] },
    { name: 'Negotiation', required: ['At least one round recorded'] },
    { name: 'Recommendation', required: ['Final terms', 'Savings'] },
    { name: 'Approval', approval: 'Procurement Manager' },
    { name: 'Closed' },
  ],
  support: [
    { name: 'Request' },
    { name: 'Triage', required: ['Assigned specialist'] },
    { name: 'In Progress' },
    { name: 'Recommendation', required: ['Conclusions'] },
    { name: 'Closed' },
  ],
};

export interface Project {
  id: string;
  ref: string;
  scope: Scope;
  title: string;
  description: string;
  category: string;
  department: string;
  ownerId: string;
  stakeholderIds: string[];
  stage: number;
  status: Status;
  priority: Priority;
  created: string;
  modified: string;
  target: string;
  completed?: string;
  currency: string;
  estSpend: number;
  savings: number;
  costAvoidance: number;
  supplierIds: string[];
  awardedSupplierId?: string;
  nextDeadline?: { label: string; date: string };
  clientVisible: boolean;
}

// Deterministic pseudo-random generator so the sample data is the same on every load.
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20261104);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const between = (lo: number, hi: number) => lo + rand() * (hi - lo);
const addDays = (iso: string, days: number) => {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + Math.round(days));
  return d.toISOString().slice(0, 10);
};
export const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5);

const seeds: { scope: Scope; title: string; category: string; dept: string }[] = [
  { scope: 'competitive', title: 'Managed print services for all offices', category: 'IT Hardware', dept: 'Information Technology' },
  { scope: 'competitive', title: 'Laptop refresh 2027 (420 units)', category: 'IT Hardware', dept: 'Information Technology' },
  { scope: 'competitive', title: 'Integrated facility management, Bucharest HQ', category: 'Facilities Management', dept: 'Operations' },
  { scope: 'competitive', title: 'Road freight framework, domestic lanes', category: 'Logistics & Freight', dept: 'Supply Chain' },
  { scope: 'competitive', title: 'Electricity supply 2027–2028', category: 'Energy & Utilities', dept: 'Finance' },
  { scope: 'competitive', title: 'Mobile voice and data contract', category: 'Telecommunications', dept: 'Information Technology' },
  { scope: 'competitive', title: 'Company car fleet leasing', category: 'Fleet', dept: 'Human Resources' },
  { scope: 'competitive', title: 'Customer event agency, annual conference', category: 'Marketing & Events', dept: 'Marketing' },
  { scope: 'competitive', title: 'Cybersecurity penetration testing services', category: 'Professional Services', dept: 'Information Technology' },
  { scope: 'competitive', title: 'Bearings and transmission spare parts', category: 'MRO & Spare Parts', dept: 'Maintenance' },
  { scope: 'competitive', title: 'HR information system (SaaS)', category: 'Software & SaaS', dept: 'Human Resources' },
  { scope: 'competitive', title: 'Security guarding, three warehouses', category: 'Facilities Management', dept: 'Operations' },
  { scope: 'competitive', title: 'Ocean freight forwarding, Asia imports', category: 'Logistics & Freight', dept: 'Supply Chain' },
  { scope: 'competitive', title: 'Network switches and Wi-Fi upgrade', category: 'IT Hardware', dept: 'Information Technology' },
  { scope: 'competitive', title: 'Cleaning services, regional offices', category: 'Facilities Management', dept: 'Operations' },
  { scope: 'competitive', title: 'Legal advisory panel', category: 'Professional Services', dept: 'Legal' },
  { scope: 'competitive', title: 'Digital marketing agency retainer', category: 'Marketing & Events', dept: 'Marketing' },
  { scope: 'competitive', title: 'Natural gas supply, production site', category: 'Energy & Utilities', dept: 'Operations' },
  { scope: 'competitive', title: 'Collaboration software licences', category: 'Software & SaaS', dept: 'Information Technology' },
  { scope: 'competitive', title: 'Industrial lubricants framework', category: 'MRO & Spare Parts', dept: 'Maintenance' },
  { scope: 'sole', title: 'ERP support and maintenance renewal', category: 'Software & SaaS', dept: 'Information Technology' },
  { scope: 'sole', title: 'Warehouse management system licence renewal', category: 'Software & SaaS', dept: 'Supply Chain' },
  { scope: 'sole', title: 'OEM service contract, packaging line', category: 'MRO & Spare Parts', dept: 'Maintenance' },
  { scope: 'sole', title: 'Incumbent courier rates review', category: 'Logistics & Freight', dept: 'Supply Chain' },
  { scope: 'sole', title: 'Building access control maintenance', category: 'Facilities Management', dept: 'Operations' },
  { scope: 'sole', title: 'Payroll outsourcing contract extension', category: 'Professional Services', dept: 'Human Resources' },
  { scope: 'sole', title: 'Proprietary lab equipment calibration', category: 'MRO & Spare Parts', dept: 'Quality' },
  { scope: 'sole', title: 'Fleet telematics subscription renewal', category: 'Fleet', dept: 'Human Resources' },
  { scope: 'sole', title: 'Data centre colocation extension', category: 'IT Hardware', dept: 'Information Technology' },
  { scope: 'sole', title: 'Audit firm fee renegotiation', category: 'Professional Services', dept: 'Finance' },
  { scope: 'sole', title: 'Leased line price review', category: 'Telecommunications', dept: 'Information Technology' },
  { scope: 'support', title: 'Market analysis: fleet electrification', category: 'Fleet', dept: 'Human Resources' },
  { scope: 'support', title: 'Should-cost model for corrugated packaging', category: 'MRO & Spare Parts', dept: 'Supply Chain' },
  { scope: 'support', title: 'Contract review: marketing agency terms', category: 'Marketing & Events', dept: 'Marketing' },
  { scope: 'support', title: 'Supplier risk check: freight carriers', category: 'Logistics & Freight', dept: 'Supply Chain' },
  { scope: 'support', title: 'Benchmark of cloud storage pricing', category: 'Software & SaaS', dept: 'Information Technology' },
  { scope: 'support', title: 'Energy hedging options briefing', category: 'Energy & Utilities', dept: 'Finance' },
  { scope: 'support', title: 'Specification support: office furniture', category: 'Facilities Management', dept: 'Operations' },
  { scope: 'support', title: 'Budget estimate: event venues 2027', category: 'Marketing & Events', dept: 'Marketing' },
  { scope: 'support', title: 'Telecom invoice audit', category: 'Telecommunications', dept: 'Finance' },
  { scope: 'support', title: 'Consultancy rate card benchmark', category: 'Professional Services', dept: 'Legal' },
  { scope: 'support', title: 'Spare parts consolidation opportunity', category: 'MRO & Spare Parts', dept: 'Maintenance' },
];

const descriptions: Record<Scope, string> = {
  competitive:
    'Competitive tender to select a supplier on best value: technical fit, service levels and total cost of ownership over the contract term.',
  sole:
    'Negotiation with the incumbent supplier where switching is not practical. Goal: improve price and terms against the current contract.',
  support:
    'Advisory support requested by the business. Deliverable: analysis and recommendation; no sourcing event is run.',
};

function generateProjects(): Project[] {
  const counters: Record<string, number> = {};
  const list: Project[] = [];
  // About 300 projects a year: 2025 in full, 2026 up to early November.
  const variants = ['', ' – Bucharest', ' – Cluj-Napoca', ' – Timișoara', ' – Iași', ' – Brașov', ' – Constanța'];
  for (const year of [2025, 2026]) {
    const rounds = year === 2025 ? 7 : 6;
    for (let k = 0; k < rounds; k++) seeds.forEach((seed) => {
      const s = { ...seed, title: seed.title + variants[k] };
      const key = `${s.scope}-${year}`;
      counters[key] = (counters[key] ?? 0) + 1;
      const ref = `${scopePrefix[s.scope]}-${year}-${String(counters[key]).padStart(4, '0')}`;
      const created = addDays(`${year}-01-06`, between(0, year === 2026 ? 290 : 340));
      const duration = s.scope === 'support' ? between(14, 60) : s.scope === 'sole' ? between(30, 110) : between(60, 170);
      const target = addDays(created, duration);
      const stages = workflows[s.scope].length;
      let stage: number;
      let status: Status;
      let completed: string | undefined;
      const age = daysBetween(created, TODAY);
      if ((age > duration * 1.05 && rand() < 0.9) || (year === 2025 && age > duration)) {
        status = rand() < 0.06 ? 'Cancelled' : 'Completed';
        stage = stages - 1;
        completed = addDays(created, duration * between(0.8, 1.25));
        if (completed > TODAY) completed = addDays(TODAY, -between(2, 20));
      } else {
        const progress = Math.min(0.95, age / duration);
        stage = Math.max(0, Math.min(stages - 2, Math.floor(progress * (stages - 1))));
        status = rand() < 0.08 ? 'On hold' : stage === 0 && rand() < 0.4 ? 'Draft' : 'In progress';
      }
      const r = rand();
      const currency = r < 0.6 ? 'EUR' : r < 0.75 ? 'USD' : r < 0.87 ? 'RON' : r < 0.92 ? 'GBP' : r < 0.96 ? 'PLN' : 'CHF';
      const rate = currencies.find((c) => c.code === currency)!.rateToBase;
      const estSpend =
        Math.round(((s.scope === 'support' ? between(20, 400) : between(60, 1800)) * 1000) / rate / 1000) * 1000;
      const done = status === 'Completed';
      const savingsRate = s.scope === 'competitive' ? between(0.04, 0.16) : s.scope === 'sole' ? between(0.02, 0.09) : between(0, 0.05);
      const savings = done ? Math.round((estSpend * savingsRate) / 100) * 100 : 0;
      const costAvoidance = done && rand() < 0.5 ? Math.round((estSpend * between(0.01, 0.06)) / 100) * 100 : 0;
      const pool = suppliers.filter((x) => x.category === s.category);
      const others = suppliers.filter((x) => x.category !== s.category);
      const supplierIds =
        s.scope === 'sole'
          ? [pool[0]?.id ?? others[0].id]
          : s.scope === 'support'
            ? []
            : [...pool, pick(others), pick(others)].slice(0, 3 + Math.floor(rand() * 2)).map((x) => x.id);
      const ownerId = pick(owners).id;
      const modified = done ? completed! : addDays(TODAY, -between(0, 12));
      const nextDeadline = done || status === 'Cancelled'
        ? undefined
        : {
            label:
              s.scope === 'competitive'
                ? ['Strategy sign-off', 'RFP issue date', 'Bid submission deadline', 'Evaluation complete', 'Award recommendation'][Math.min(4, Math.max(0, stage - 1))]
                : s.scope === 'sole'
                  ? ['Justification approval', 'Negotiation plan', 'Round 2 meeting', 'Final offer due', 'Approval'][Math.min(4, Math.max(0, stage - 1))]
                  : ['Triage', 'Analysis draft', 'Recommendation due'][Math.min(2, Math.max(0, stage - 1))],
            date: age > duration ? addDays(TODAY, -between(1, 12)) : addDays(TODAY, between(-4, 40)),
          };
      list.push({
        id: ref,
        ref,
        scope: s.scope,
        title: s.title,
        description: descriptions[s.scope],
        category: s.category,
        department: s.dept,
        ownerId,
        stakeholderIds: [pick(users.filter((u) => u.role === 'stakeholder')).id],
        stage,
        status,
        priority: estSpend * rate > 900000 ? 'High' : estSpend * rate > 250000 ? 'Medium' : 'Low',
        created,
        modified,
        target,
        completed: done ? completed : undefined,
        currency,
        estSpend,
        savings,
        costAvoidance,
        supplierIds,
        awardedSupplierId: done && supplierIds.length ? supplierIds[0] : undefined,
        nextDeadline,
        clientVisible: rand() < 0.15,
      });
    });
  }
  return list.sort((a, b) => (a.created < b.created ? 1 : -1));
}

export const projects: Project[] = generateProjects();

// A hand-made flagship project for the competitive workspace demo.
const flagship = projects.find((p) => p.scope === 'competitive' && p.title === 'Managed print services for all offices' && p.created.startsWith('2026'));
if (flagship) {
  Object.assign(flagship, {
    status: 'In progress',
    stage: 4,
    estSpend: 640000,
    currency: 'EUR',
    savings: 0,
    completed: undefined,
    ownerId: 'u3',
    stakeholderIds: ['u7', 'u8'],
    supplierIds: ['s2', 's1', 's13', 's3'],
    awardedSupplierId: undefined,
    nextDeadline: { label: 'Evaluation complete', date: '2026-11-12' },
    created: '2026-06-02',
    modified: '2026-11-03',
    target: '2026-12-15',
    clientVisible: true,
  });
}
export const flagshipId = flagship?.id ?? projects[0].id;

export const projectById = (id: string) => projects.find((p) => p.id === id);

// ----- Evaluation, negotiation, activities, documents, history -----

export interface Criterion {
  id: string;
  group: 'Technical' | 'Commercial';
  name: string;
  weight: number;
}
export const criteria: Criterion[] = [
  { id: 'c1', group: 'Technical', name: 'Functional fit to requirements', weight: 25 },
  { id: 'c2', group: 'Technical', name: 'Service levels and support model', weight: 15 },
  { id: 'c3', group: 'Technical', name: 'Implementation plan and risk', weight: 10 },
  { id: 'c4', group: 'Technical', name: 'Sustainability and compliance', weight: 10 },
  { id: 'c5', group: 'Commercial', name: 'Total cost of ownership', weight: 30 },
  { id: 'c6', group: 'Commercial', name: 'Payment terms', weight: 5 },
  { id: 'c7', group: 'Commercial', name: 'Contract flexibility', weight: 5 },
];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function scoresFor(project: Project) {
  // score 1–5 per criterion per supplier
  const r = rng(hash(project.id));
  const result: Record<string, Record<string, number>> = {};
  project.supplierIds.forEach((sid, idx) => {
    result[sid] = {};
    criteria.forEach((c) => {
      const bias = idx === 0 ? 0.6 : idx === 1 ? 0.3 : 0;
      result[sid][c.id] = Math.max(1, Math.min(5, Math.round((2.6 + r() * 2.2 + bias) * 2) / 2));
    });
  });
  return result;
}

export function offersFor(project: Project) {
  const r = rng(hash(project.id + 'offers'));
  return project.supplierIds.map((sid, idx) => {
    const first = Math.round(project.estSpend * (0.92 + r() * 0.22 - idx * 0.01) / 1000) * 1000;
    const best = Math.round(first * (0.9 + r() * 0.06) / 1000) * 1000;
    return {
      supplierId: sid,
      status: idx === project.supplierIds.length - 1 && project.supplierIds.length > 3 ? 'Declined' : 'Submitted',
      submitted: addDays(project.created, 45 + idx * 2),
      firstOffer: first,
      bestOffer: best,
      paymentDays: [30, 45, 60, 60][idx % 4],
      leadTime: `${2 + idx} weeks`,
    };
  });
}

export interface Round {
  no: number;
  date: string;
  price: number;
  terms: string;
  notes: string;
}
export function negotiationFor(project: Project) {
  const baseline = project.estSpend;
  const target = Math.round(baseline * 0.9 / 1000) * 1000;
  const opening = Math.round(baseline * 1.06 / 1000) * 1000; // incumbent asks for an increase
  const rounds: Round[] = [
    { no: 1, date: addDays(project.created, 20), price: opening, terms: 'Indexation CPI + 2%, 30-day payment', notes: 'Supplier opened with a 6% increase citing labour costs.' },
    { no: 2, date: addDays(project.created, 34), price: Math.round(baseline * 0.99 / 1000) * 1000, terms: 'Indexation capped at CPI, 45-day payment', notes: 'Shared benchmark data; supplier withdrew the increase.' },
    { no: 3, date: addDays(project.created, 47), price: Math.round(baseline * 0.94 / 1000) * 1000, terms: '3-year term, CPI cap 3%, 60-day payment', notes: 'Longer term traded for a 6% reduction and better payment terms.' },
  ];
  const visible = rounds.slice(0, Math.max(1, Math.min(3, project.stage - 1)));
  return { baseline, target, opening, rounds: visible };
}

export function activitiesFor(project: Project) {
  const base = project.created;
  const items = [
    { date: addDays(base, 1), who: project.ownerId, text: 'Kick-off call with requesting department; scope and deadline agreed.', hours: 1 },
    { date: addDays(base, 5), who: project.ownerId, text: 'Collected spend data for the last 24 months from finance.', hours: 3 },
    { date: addDays(base, 9), who: project.ownerId, text: 'Market scan of 6 suppliers and 2 published price indexes.', hours: 6 },
    { date: addDays(base, 14), who: project.ownerId, text: 'Draft findings shared with stakeholder for comments.', hours: 2 },
  ];
  return items.filter((a) => a.date <= TODAY).slice(0, Math.max(1, project.stage + 1));
}

export type Visibility = 'Internal' | 'Confidential' | 'Client-visible';
export interface Doc {
  id: string;
  projectId: string;
  name: string;
  category: string;
  version: string;
  size: string;
  uploadedBy: string;
  uploaded: string;
  visibility: Visibility;
  supplierId?: string;
}

const docTemplates: Record<Scope, { name: string; category: string; visibility: Visibility; perSupplier?: boolean }[]> = {
  competitive: [
    { name: 'Business requirements.docx', category: 'Business documentation', visibility: 'Internal' },
    { name: 'Sourcing strategy.pptx', category: 'Approval documents', visibility: 'Internal' },
    { name: 'RFP pack.pdf', category: 'RFx documents', visibility: 'Client-visible' },
    { name: 'Pricing template.xlsx', category: 'RFx documents', visibility: 'Internal' },
    { name: 'Proposal.pdf', category: 'Supplier proposals', visibility: 'Confidential', perSupplier: true },
    { name: 'Technical evaluation.xlsx', category: 'Technical evaluations', visibility: 'Confidential' },
    { name: 'Commercial evaluation.xlsx', category: 'Commercial evaluations', visibility: 'Confidential' },
    { name: 'Recommendation report.pdf', category: 'Approval documents', visibility: 'Client-visible' },
  ],
  sole: [
    { name: 'Sole source justification.docx', category: 'Approval documents', visibility: 'Internal' },
    { name: 'Current contract.pdf', category: 'Contracts', visibility: 'Confidential' },
    { name: 'Spend history 2023–2026.xlsx', category: 'Business documentation', visibility: 'Internal' },
    { name: 'Supplier proposal round 2.pdf', category: 'Supplier proposals', visibility: 'Confidential' },
    { name: 'Negotiation minutes.docx', category: 'Negotiation records', visibility: 'Confidential' },
    { name: 'Negotiation summary.pdf', category: 'Approval documents', visibility: 'Client-visible' },
  ],
  support: [
    { name: 'Request brief.docx', category: 'Business documentation', visibility: 'Internal' },
    { name: 'Market analysis.xlsx', category: 'Business documentation', visibility: 'Internal' },
    { name: 'Recommendation memo.pdf', category: 'Approval documents', visibility: 'Client-visible' },
  ],
};

export function docsFor(project: Project): Doc[] {
  const r = rng(hash(project.id + 'docs'));
  const out: Doc[] = [];
  const max = Math.max(2, Math.round((docTemplates[project.scope].length * (project.stage + 1)) / workflows[project.scope].length) + 1);
  docTemplates[project.scope].slice(0, max).forEach((t, i) => {
    const targets = t.perSupplier ? project.supplierIds.slice(0, 3) : [undefined];
    targets.forEach((sid, j) => {
      const date = addDays(project.created, 3 + i * 9 + j);
      if (date > TODAY) return;
      out.push({
        id: `${project.id}-d${i}-${j}`,
        projectId: project.id,
        name: sid ? `${supplierById(sid).name.split(' ')[0]} – ${t.name}` : t.name,
        category: t.category,
        version: `${1 + Math.floor(r() * 3)}.0`,
        size: `${(0.2 + r() * 4.8).toFixed(1)} MB`,
        uploadedBy: project.ownerId,
        uploaded: date,
        visibility: t.visibility,
        supplierId: sid,
      });
    });
  });
  return out;
}

export function historyFor(project: Project) {
  const owner = userById(project.ownerId).name;
  const stages = workflows[project.scope];
  const events = [{ date: project.created, who: owner, action: 'Created project', detail: project.ref }];
  for (let i = 1; i <= project.stage; i++) {
    events.push({
      date: addDays(project.created, (daysBetween(project.created, project.modified) * i) / Math.max(1, project.stage)),
      who: stages[i].approval ? userById('u2').name : owner,
      action: stages[i].approval ? 'Approved stage gate' : 'Moved stage',
      detail: `${stages[i - 1].name} → ${stages[i].name}`,
    });
  }
  events.push({ date: project.modified, who: owner, action: 'Updated', detail: 'Next deadline and notes' });
  return events.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const comments = [
  { who: 'u7', date: '2026-10-28', text: 'Brightline\'s fleet monitoring meets our security requirements; Arcadia needs to confirm data stays in the EU.' },
  { who: 'u3', date: '2026-10-29', text: 'Clarification request sent to Arcadia on data residency; answer due 5 Nov.' },
  { who: 'u8', date: '2026-10-31', text: 'Finance prefers 60-day payment terms where possible.' },
];

export const auditLog = [
  { time: '2026-11-04 09:58', user: 'Andrei Ionescu', action: 'Document downloaded', record: 'CS-2026-0004 · Technical evaluation.xlsx', source: 'VDI-POOL-07' },
  { time: '2026-11-04 09:41', user: 'Elena Popescu', action: 'Stage approved', record: 'SS-2026-0010 · Justification → Negotiation Strategy', source: 'VDI-POOL-02' },
  { time: '2026-11-04 09:12', user: 'Maria Dumitru', action: 'Project created', record: 'SR-2026-0040', source: 'VDI-POOL-05' },
  { time: '2026-11-04 08:55', user: 'Alex Georgescu', action: 'Permission changed', record: 'Sarah Klein · added to client site Northwind', source: 'VDI-POOL-01' },
  { time: '2026-11-03 17:20', user: 'Mihai Stan', action: 'Document published to client', record: 'SS-2026-0004 · Negotiation summary.pdf', source: 'VDI-POOL-03' },
  { time: '2026-11-03 16:02', user: 'Andrei Ionescu', action: 'Scores updated', record: 'CS-2026-0004 · Brightline Print Solutions', source: 'VDI-POOL-07' },
  { time: '2026-11-03 11:47', user: 'Maria Dumitru', action: 'Status changed', record: 'CS-2026-0019 · In progress → On hold', source: 'VDI-POOL-05' },
  { time: '2026-11-03 08:31', user: 'Victor Marin', action: 'Sign-in', record: '—', source: 'VDI-POOL-09' },
  { time: '2026-11-02 15:13', user: 'Unknown (blocked)', action: 'Access refused', record: 'Confidential list · Evaluation scores', source: 'VDI-POOL-11' },
  { time: '2026-11-02 10:05', user: 'Elena Popescu', action: 'Project archived', record: 'SR-2025-0013', source: 'VDI-POOL-02' },
];

// ----- Formatting helpers -----
export const fmtMoney = (n: number, compact = false, currency = BASE_CURRENCY) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: compact ? 1 : 0,
    notation: compact ? 'compact' : 'standard',
  }).format(n);
export const fmtDate = (iso?: string) =>
  iso ? new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—';
/** Short axis labels that stay distinct between ticks, e.g. €1.75M or €320K. */
export const fmtAxis = (n: number, currency = BASE_CURRENCY) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency, notation: 'compact', maximumSignificantDigits: 3 }).format(n);
