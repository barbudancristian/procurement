// SharePoint data model for Sourcing Hub.
//
// Every list lives in one procurement site. Relations use plain indexed number
// columns (ProjectId, SupplierId, ...) instead of SharePoint lookups: lookups are
// limited per view, slow to provision and break when a list is recreated.
//
// "Set up site" reads this file and adds whatever is missing. Never rename or
// remove a column here once a site has been set up: add a new one instead and
// raise SCHEMA_VERSION.

export const SCHEMA_VERSION = 1;

export type ColumnType = 'text' | 'note' | 'number' | 'currency' | 'dateTime' | 'boolean' | 'choice' | 'person';

export interface ColumnDef {
  name: string;
  type: ColumnType;
  required?: boolean;
  indexed?: boolean;
  choices?: string[];
  /** For dateTime: true stores a date only. */
  dateOnly?: boolean;
}

export interface ListDef {
  name: string;
  description: string;
  template: 'genericList' | 'documentLibrary';
  /** Holds data stakeholders and clients must never read (scores, target prices, strategy). */
  confidential?: boolean;
  /** Users may add items but not edit or delete them (audit trail). */
  addOnly?: boolean;
  columns: ColumnDef[];
}

const projectKey: ColumnDef = { name: 'ProjectId', type: 'number', required: true, indexed: true };
const supplierKey: ColumnDef = { name: 'SupplierId', type: 'number', indexed: true };

export const scopes = ['competitive', 'sole', 'support'] as const;
export const statuses = ['Draft', 'In progress', 'On hold', 'Completed', 'Cancelled'] as const;

export const lists: ListDef[] = [
  {
    name: 'SH_Projects',
    description: 'Sourcing projects across the three scopes.',
    template: 'genericList',
    columns: [
      { name: 'Reference', type: 'text', required: true, indexed: true },
      { name: 'Scope', type: 'choice', required: true, indexed: true, choices: [...scopes] },
      { name: 'Description', type: 'note' },
      { name: 'Category', type: 'text', indexed: true },
      { name: 'Department', type: 'text' },
      { name: 'Owner', type: 'person', indexed: true },
      { name: 'StageIndex', type: 'number' },
      { name: 'Status', type: 'choice', required: true, indexed: true, choices: [...statuses] },
      { name: 'Priority', type: 'choice', choices: ['Low', 'Medium', 'High', 'Critical'] },
      { name: 'EstimatedSpend', type: 'number' },
      { name: 'Currency', type: 'text', required: true },
      { name: 'StartDate', type: 'dateTime', dateOnly: true },
      { name: 'TargetDate', type: 'dateTime', dateOnly: true },
      { name: 'CompletedDate', type: 'dateTime', dateOnly: true, indexed: true },
      { name: 'Confidentiality', type: 'choice', choices: ['Internal', 'Restricted'] },
      { name: 'ClientName', type: 'text' },
    ],
  },
  {
    name: 'SH_ProjectMembers',
    description: 'Who works on each project and in which project role.',
    template: 'genericList',
    columns: [projectKey, { name: 'Member', type: 'person', required: true, indexed: true }, { name: 'ProjectRole', type: 'choice', choices: ['Owner', 'Team member', 'Stakeholder', 'Evaluator', 'Approver'] }],
  },
  {
    name: 'SH_ClientAccess',
    description: 'Client guests allowed to see published project information.',
    template: 'genericList',
    columns: [projectKey, { name: 'GuestEmail', type: 'text', required: true, indexed: true }, { name: 'GrantedBy', type: 'person' }, { name: 'Expires', type: 'dateTime', dateOnly: true }],
  },
  {
    name: 'SH_Suppliers',
    description: 'Supplier master data.',
    template: 'genericList',
    columns: [
      { name: 'Category', type: 'text', indexed: true },
      { name: 'Country', type: 'text' },
      { name: 'VatNumber', type: 'text', indexed: true },
      { name: 'SupplierStatus', type: 'choice', choices: ['Active', 'Under review', 'Inactive'] },
      { name: 'Rating', type: 'number' },
      { name: 'Website', type: 'text' },
    ],
  },
  {
    name: 'SH_SupplierContacts',
    description: 'Contacts at each supplier.',
    template: 'genericList',
    columns: [{ ...supplierKey, required: true }, { name: 'Email', type: 'text' }, { name: 'Phone', type: 'text' }, { name: 'JobTitle', type: 'text' }],
  },
  {
    name: 'SH_ProjectSuppliers',
    description: 'Suppliers taking part in a project and how far they got.',
    template: 'genericList',
    columns: [projectKey, { ...supplierKey, required: true }, { name: 'ParticipationStatus', type: 'choice', choices: ['Invited', 'Declined', 'Responded', 'Shortlisted', 'Awarded', 'Not awarded'] }],
  },
  {
    name: 'SH_RfxEvents',
    description: 'RFI, RFQ and RFP rounds in competitive projects.',
    template: 'genericList',
    columns: [projectKey, { name: 'EventType', type: 'choice', choices: ['RFI', 'RFQ', 'RFP', 'Tender'] }, { name: 'IssueDate', type: 'dateTime' }, { name: 'ClosingDate', type: 'dateTime' }, { name: 'EventStatus', type: 'choice', choices: ['Draft', 'Open', 'Closed', 'Evaluated'] }],
  },
  {
    name: 'SH_RfxResponses',
    description: 'Supplier responses and offered prices.',
    template: 'genericList',
    confidential: true,
    columns: [projectKey, { name: 'RfxEventId', type: 'number', indexed: true }, { ...supplierKey, required: true }, { name: 'Received', type: 'dateTime' }, { name: 'OfferedPrice', type: 'number' }, { name: 'Notes', type: 'note' }],
  },
  {
    name: 'SH_EvaluationCriteria',
    description: 'Technical and commercial evaluation criteria with weights.',
    template: 'genericList',
    columns: [projectKey, { name: 'CriterionGroup', type: 'choice', choices: ['Technical', 'Commercial'] }, { name: 'Weight', type: 'number' }, { name: 'SortOrder', type: 'number' }],
  },
  {
    name: 'SH_EvaluationScores',
    description: 'Scores per evaluator, criterion and supplier.',
    template: 'genericList',
    confidential: true,
    columns: [projectKey, { name: 'CriterionId', type: 'number', required: true }, { ...supplierKey, required: true }, { name: 'Evaluator', type: 'person' }, { name: 'Score', type: 'number' }, { name: 'Comment', type: 'note' }],
  },
  {
    name: 'SH_NegotiationRounds',
    description: 'Negotiation rounds with target and offered prices.',
    template: 'genericList',
    confidential: true,
    columns: [projectKey, supplierKey, { name: 'RoundNumber', type: 'number' }, { name: 'RoundDate', type: 'dateTime', dateOnly: true }, { name: 'OfferedPrice', type: 'number' }, { name: 'TargetPrice', type: 'number' }, { name: 'Strategy', type: 'note' }],
  },
  {
    name: 'SH_CommercialTerms',
    description: 'Baseline, offered and final commercial terms.',
    template: 'genericList',
    confidential: true,
    columns: [projectKey, supplierKey, { name: 'Term', type: 'text' }, { name: 'Baseline', type: 'text' }, { name: 'Offered', type: 'text' }, { name: 'Final', type: 'text' }],
  },
  {
    name: 'SH_SoleSourceJustifications',
    description: 'Mandatory justification for sole-source projects.',
    template: 'genericList',
    columns: [projectKey, { name: 'ReasonCode', type: 'text', required: true }, { name: 'Narrative', type: 'note' }, { name: 'AlternativesConsidered', type: 'note' }, { name: 'RiskIfNotApproved', type: 'note' }],
  },
  {
    name: 'SH_SupportActivities',
    description: 'Advisory work in sourcing support projects.',
    template: 'genericList',
    columns: [projectKey, { name: 'ActivityType', type: 'text' }, { name: 'DueDate', type: 'dateTime', dateOnly: true }, { name: 'Done', type: 'boolean' }, { name: 'Notes', type: 'note' }],
  },
  {
    name: 'SH_Outcomes',
    description: 'Award, contract value, savings and cost avoidance per project.',
    template: 'genericList',
    columns: [projectKey, supplierKey, { name: 'ContractValue', type: 'number' }, { name: 'Savings', type: 'number' }, { name: 'CostAvoidance', type: 'number' }, { name: 'Method', type: 'text' }, { name: 'Recommendation', type: 'note' }],
  },
  {
    name: 'SH_Workflows',
    description: 'Configurable stages per scope.',
    template: 'genericList',
    columns: [{ name: 'Scope', type: 'choice', required: true, indexed: true, choices: [...scopes] }, { name: 'StageIndex', type: 'number' }, { name: 'RequiresApproval', type: 'boolean' }, { name: 'RequiredFields', type: 'note' }, { name: 'ApprovalThreshold', type: 'number' }],
  },
  {
    name: 'SH_Approvals',
    description: 'Approval decisions. Only approver groups can add items.',
    template: 'genericList',
    addOnly: true,
    columns: [projectKey, { name: 'StageIndex', type: 'number' }, { name: 'Decision', type: 'choice', choices: ['Approved', 'Rejected', 'Returned'] }, { name: 'Approver', type: 'person' }, { name: 'DecisionComment', type: 'note' }],
  },
  {
    name: 'SH_Tasks',
    description: 'Deadlines and milestones.',
    template: 'genericList',
    columns: [projectKey, { name: 'DueDate', type: 'dateTime', dateOnly: true, indexed: true }, { name: 'AssignedTo', type: 'person' }, { name: 'Done', type: 'boolean' }],
  },
  {
    name: 'SH_Comments',
    description: 'Project discussion.',
    template: 'genericList',
    columns: [projectKey, { name: 'Body', type: 'note' }, { name: 'Internal', type: 'boolean' }],
  },
  {
    name: 'SH_AuditEvents',
    description: 'Business events. Add-only for everyone except administrators.',
    template: 'genericList',
    addOnly: true,
    columns: [{ name: 'EventTime', type: 'dateTime', required: true, indexed: true }, { name: 'Actor', type: 'text', indexed: true }, { name: 'Action', type: 'text', required: true }, { name: 'EntityList', type: 'text' }, { name: 'EntityId', type: 'number', indexed: true }, { name: 'Details', type: 'note' }],
  },
  {
    name: 'SH_Lookups',
    description: 'Categories, departments, currencies and reason codes.',
    template: 'genericList',
    columns: [{ name: 'LookupType', type: 'choice', required: true, indexed: true, choices: ['Category', 'Department', 'Currency', 'ReasonCode'] }, { name: 'Code', type: 'text' }, { name: 'NumberValue', type: 'number' }, { name: 'Active', type: 'boolean' }],
  },
  {
    name: 'SH_Settings',
    description: 'App settings such as schema version and branding.',
    template: 'genericList',
    columns: [{ name: 'SettingValue', type: 'note' }],
  },
  {
    name: 'SH_Documents',
    description: 'Project documents, one folder per project.',
    template: 'documentLibrary',
    columns: [{ ...projectKey, required: false }, { name: 'DocCategory', type: 'text' }, { name: 'Visibility', type: 'choice', choices: ['Internal', 'Confidential', 'Client'] }, supplierKey],
  },
];
