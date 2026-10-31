import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  FileCode,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  Table,
  Layers,
  Shield,
  Users,
  CheckSquare,
  ArrowRight,
  Eye
} from 'lucide-react';

interface ColumnDef {
  name: string;
  type: string;
  desc: string;
  sample: string;
  mandatory?: boolean;
}

interface DatasetSpec {
  title: string;
  description: string;
  icon: any;
  mandatory: string[];
  optional: string[];
  columns: ColumnDef[];
  sampleRecords: Record<string, string>[];
  note: string;
}

const DATASET_SCHEMAS: Record<string, DatasetSpec> = {
  joiners: {
    title: 'Employee Joiner Profiles',
    description: 'Statutory recruit data used to initialize onboarding pipelines and generate dynamic day-1 checklists.',
    icon: Users,
    mandatory: ['full_name', 'email', 'role', 'department', 'location', 'manager_name', 'manager_email', 'joining_date'],
    optional: ['phone', 'grade', 'notes'],
    columns: [
      { name: 'full_name', type: 'String', desc: 'Legal full name of candidate', sample: 'Tanvi Rao', mandatory: true },
      { name: 'email', type: 'Email', desc: 'Candidate official / personal email', sample: 'tanvi.rao@example.com', mandatory: true },
      { name: 'role', type: 'String', desc: 'Job designation / title', sample: 'Cloud Architect', mandatory: true },
      { name: 'grade', type: 'String', desc: 'Band or level (L3-L7)', sample: 'L5', mandatory: false },
      { name: 'department', type: 'String', desc: 'Department', sample: 'Engineering', mandatory: true },
      { name: 'location', type: 'String', desc: 'Office location', sample: 'Bengaluru', mandatory: true },
      { name: 'manager_name', type: 'String', desc: 'Direct reporting manager', sample: 'Karthik Subramaniam', mandatory: true },
      { name: 'manager_email', type: 'Email', desc: 'Manager email for escalations', sample: 'karthik.s@company.com', mandatory: true },
      { name: 'joining_date', type: 'Date (YYYY-MM-DD)', desc: 'Scheduled first day', sample: '2026-11-20', mandatory: true },
      { name: 'phone', type: 'String', desc: 'Primary contact phone number', sample: '+91 98450 99887', mandatory: false },
      { name: 'notes', type: 'String', desc: 'Optional background comments', sample: 'Lateral senior hire', mandatory: false },
    ],
    sampleRecords: [
      {
        full_name: 'Tanvi Rao',
        email: 'tanvi.rao@example.com',
        phone: '+91 98450 99887',
        role: 'Cloud Architect',
        grade: 'L5',
        department: 'Engineering',
        location: 'Bengaluru',
        manager_name: 'Karthik Subramaniam',
        manager_email: 'karthik.s@company.com',
        joining_date: '2026-11-20',
        notes: 'Lateral senior hire'
      },
      {
        full_name: 'Rohan Deshmukh',
        email: 'rohan.d@example.com',
        phone: '+91 98210 44321',
        role: 'Data Analyst',
        grade: 'L4',
        department: 'Analytics',
        location: 'Mumbai',
        manager_name: 'Pooja Hegde',
        manager_email: 'pooja.h@company.com',
        joining_date: '2026-11-25',
        notes: 'Product analytics specialist'
      }
    ],
    note: 'Date format must strictly follow ISO 8601 (YYYY-MM-DD). Each valid row automatically initializes onboarding checklist tasks.'
  },
  requirements: {
    title: 'Checklist Rules & Statutory Gates',
    description: 'Rule definitions mapped to onboarding categories, SLA offsets, and blocking compliance gates.',
    icon: CheckSquare,
    mandatory: ['code', 'title', 'item_type', 'owner_function', 'due_offset_days'],
    optional: ['category', 'anchor', 'is_blocking', 'linked_policy_code', 'explanation'],
    columns: [
      { name: 'code', type: 'String (Code)', desc: 'Unique rule identifier', sample: 'DOC-MED-01', mandatory: true },
      { name: 'title', type: 'String', desc: 'Task or document requirement title', sample: 'Medical Fitness Certificate', mandatory: true },
      { name: 'item_type', type: 'Enum', desc: 'Document | Task | IT_Provisioning', sample: 'Document', mandatory: true },
      { name: 'category', type: 'String', desc: 'Group category', sample: 'Health & Safety', mandatory: false },
      { name: 'owner_function', type: 'String', desc: 'Responsible team (HR, IT, Facilities)', sample: 'HR', mandatory: true },
      { name: 'due_offset_days', type: 'Integer', desc: 'Offset days relative to anchor', sample: '-5', mandatory: true },
      { name: 'anchor', type: 'String', desc: 'JOINING_DATE | DAY_ONE', sample: 'JOINING_DATE', mandatory: false },
      { name: 'is_blocking', type: 'Boolean', desc: 'Whether this blocks Day-1 readiness', sample: 'true', mandatory: false },
      { name: 'linked_policy_code', type: 'String', desc: 'Related policy code reference', sample: 'HR-ONB-001', mandatory: false },
      { name: 'explanation', type: 'String', desc: 'Employee-facing rationale', sample: 'Required pre-joining medical review', mandatory: false }
    ],
    sampleRecords: [
      {
        code: 'DOC-MED-01',
        title: 'Medical Fitness Certificate',
        item_type: 'Document',
        category: 'Health & Safety',
        owner_function: 'HR',
        due_offset_days: '-5',
        anchor: 'JOINING_DATE',
        is_blocking: 'true',
        linked_policy_code: 'HR-ONB-001',
        explanation: 'Mandatory pre-joining medical clearance'
      },
      {
        code: 'IT-VPN-02',
        title: 'Remote Access & Production VPN Setup',
        item_type: 'IT_Provisioning',
        category: 'IT Systems',
        owner_function: 'IT',
        due_offset_days: '-2',
        anchor: 'JOINING_DATE',
        is_blocking: 'true',
        linked_policy_code: 'POL-IT-002',
        explanation: 'Secure tunnel access for engineering and production environments'
      }
    ],
    note: 'Offset days can be negative (e.g. -5 days before joining date) or positive.'
  },
  owners: {
    title: 'Department Owners & Escalation Matrix',
    description: 'Function and departmental ownership matrix for task escalation paths and SLA breach notifications.',
    icon: Layers,
    mandatory: ['function_name', 'department', 'owner_name', 'owner_email'],
    optional: ['backup_owner_name', 'backup_owner_email', 'dept_head_name', 'dept_head_email'],
    columns: [
      { name: 'function_name', type: 'String', desc: 'Functional stream (HR, IT, Facilities)', sample: 'HR', mandatory: true },
      { name: 'department', type: 'String', desc: 'Target business department or location', sample: 'Engineering', mandatory: true },
      { name: 'owner_name', type: 'String', desc: 'Primary operational SLA owner', sample: 'Sarah Jenkins', mandatory: true },
      { name: 'owner_email', type: 'Email', desc: 'Primary owner email address', sample: 'sarah.j@company.com', mandatory: true },
      { name: 'backup_owner_name', type: 'String', desc: 'Secondary backup SLA owner', sample: 'Anand Rao', mandatory: false },
      { name: 'backup_owner_email', type: 'Email', desc: 'Backup owner email address', sample: 'anand.r@company.com', mandatory: false },
      { name: 'dept_head_name', type: 'String', desc: 'Department Head / Escalation lead', sample: 'Kavita Reddy', mandatory: false },
      { name: 'dept_head_email', type: 'Email', desc: 'Department head email address', sample: 'kavita.r@company.com', mandatory: false }
    ],
    sampleRecords: [
      {
        function_name: 'HR',
        department: 'Engineering',
        owner_name: 'Sarah Jenkins',
        owner_email: 'sarah.j@company.com',
        backup_owner_name: 'Anand Rao',
        backup_owner_email: 'anand.r@company.com',
        dept_head_name: 'Kavita Reddy',
        dept_head_email: 'kavita.r@company.com'
      },
      {
        function_name: 'IT',
        department: 'All Departments',
        owner_name: 'Deepak Nair',
        owner_email: 'deepak.n@company.com',
        backup_owner_name: 'Priya Sen',
        backup_owner_email: 'priya.s@company.com',
        dept_head_name: 'Vikram Malhotra',
        dept_head_email: 'vikram.m@company.com'
      }
    ],
    note: 'Used for automatic SLA escalation alerts and overdue notification routing.'
  },
  policies: {
    title: 'Compliance & Governance Policies',
    description: 'Internal and statutory governance policies indexed into Elasticsearch knowledge base for employee grounding.',
    icon: Shield,
    mandatory: ['code', 'title', 'category'],
    optional: ['version', 'audience', 'departments', 'locations', 'roles', 'requires_ack'],
    columns: [
      { name: 'code', type: 'String (Code)', desc: 'Policy identifier code', sample: 'POL-HR-007', mandatory: true },
      { name: 'title', type: 'String', desc: 'Official title of policy document', sample: 'Remote Working & Travel Policy', mandatory: true },
      { name: 'category', type: 'String', desc: 'Policy domain / subject', sample: 'Workplace', mandatory: true },
      { name: 'version', type: 'String', desc: 'Semantic revision number', sample: '1.2', mandatory: false },
      { name: 'audience', type: 'List (separated by ;)', desc: 'Roles applicable (* for all, or EMPLOYEE;HR_ADMIN)', sample: 'EMPLOYEE;HR_ADMIN', mandatory: false },
      { name: 'departments', type: 'List (separated by ;)', desc: 'Department filter or *', sample: 'Engineering;Analytics', mandatory: false },
      { name: 'locations', type: 'List (separated by ;)', desc: 'Office locations or *', sample: 'Bengaluru;Mumbai;Remote', mandatory: false },
      { name: 'roles', type: 'List (separated by ;)', desc: 'Role filters or *', sample: '*', mandatory: false },
      { name: 'requires_ack', type: 'Boolean', desc: 'Whether pre-day-1 digital sign-off is mandatory', sample: 'true', mandatory: false }
    ],
    sampleRecords: [
      {
        code: 'POL-HR-007',
        title: 'Remote Working and Travel Expense Policy',
        version: '1.0',
        category: 'Workplace',
        audience: 'EMPLOYEE;HR_ADMIN',
        departments: '*',
        locations: 'Bengaluru;Mumbai;Remote',
        roles: '*',
        requires_ack: 'true'
      },
      {
        code: 'POL-SEC-004',
        title: 'Information Security & Data Protection Standard',
        version: '2.1',
        category: 'Security',
        audience: 'EMPLOYEE',
        departments: 'Engineering;Product;IT',
        locations: '*',
        roles: '*',
        requires_ack: 'true'
      }
    ],
    note: 'Policies ingested here are automatically vectorized and indexed into the Elasticsearch Knowledge Base.'
  }
};

export const Ingestion: React.FC = () => {
  const [dataset, setDataset] = useState<'joiners' | 'requirements' | 'owners' | 'policies'>('joiners');
  const [runs, setRuns] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const currentSpec = DATASET_SCHEMAS[dataset] || DATASET_SCHEMAS['joiners'];

  const fetchRuns = async () => {
    try {
      const data = await apiRequest('/ingest/runs');
      setRuns(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);
    setLastResult(null);
    setSuccessBanner(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('generate_checklists', 'true');

    try {
      const res = await apiRequest(`/ingest/${dataset}`, {
        method: 'POST',
        body: formData,
      });
      setLastResult(res);
      setSuccessBanner(`Dataset "${dataset.toUpperCase()}" ingested successfully (${res.saved_rows} saved, ${res.failed_rows} rejected). Changes are live across the system.`);
      fetchRuns();
    } catch (err: any) {
      alert(err.message || 'Ingestion failed');
    } finally {
      setUploading(false);
    }
  };

  const handleLoadSynthetic = async () => {
    setSeeding(true);
    setSuccessBanner(null);
    try {
      await apiRequest('/admin/data/seed', { method: 'POST' });
      setSuccessBanner('Synthetic sample data reloaded and synchronized across all HR, Reviewer, and IT modules!');
      fetchRuns();
    } catch (err: any) {
      alert(err.message || 'Failed to seed sample data');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <UploadCloud className="w-6 h-6 text-brand-600" />
            <span>Section 4.1: Data Ingestion & Batch Validation</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ingest synthetic onboarding records via CSV, Excel, or JSON with strict row-level schema validation.
          </p>
        </div>

        <button
          onClick={handleLoadSynthetic}
          disabled={seeding}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>{seeding ? 'Syncing Cohort...' : 'Reload Synthetic Sample Data'}</span>
        </button>
      </div>

      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span className="text-xs font-semibold">{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-xs text-emerald-700 dark:text-emerald-300 font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Dataset Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        {(['joiners', 'requirements', 'owners', 'policies'] as const).map((d) => (
          <button
            key={d}
            onClick={() => {
              setDataset(d);
              setLastResult(null);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl capitalize transition-all cursor-pointer ${
              dataset === d
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Dropzone & Dynamic Specification Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-4 flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center shadow-inner">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Upload {dataset.toUpperCase()} Dataset
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Supports CSV, XLSX, and JSON files. Validation runs automatically per row.
            </p>
          </div>

          <label className="cursor-pointer px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-md transition-all">
            <span>{uploading ? 'Validating & Ingesting...' : 'Select File to Ingest'}</span>
            <input
              type="file"
              accept=".csv,.json,.xlsx"
              disabled={uploading}
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Multi-Format Sample Downloads Card */}
          <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Download Sample Templates
              </span>
              <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
                2 Sample Records
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <a
                href={`/api/v1/ingest/template/${dataset}/csv`}
                download
                className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50 dark:bg-slate-950 flex flex-col items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all text-center group shadow-sm hover:shadow"
                title={`Download ${dataset} CSV template with 2 sample records`}
              >
                <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="leading-tight">
                  <span className="text-xs font-bold block">CSV</span>
                  <span className="text-[10px] text-slate-400 font-mono">.csv</span>
                </div>
              </a>

              <a
                href={`/api/v1/ingest/template/${dataset}/xlsx`}
                download
                className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50 dark:bg-slate-950 flex flex-col items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all text-center group shadow-sm hover:shadow"
                title={`Download ${dataset} Excel spreadsheet with 2 sample records`}
              >
                <div className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="leading-tight">
                  <span className="text-xs font-bold block">Excel</span>
                  <span className="text-[10px] text-slate-400 font-mono">.xlsx</span>
                </div>
              </a>

              <a
                href={`/api/v1/ingest/template/${dataset}/json`}
                download
                className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 bg-slate-50 dark:bg-slate-950 flex flex-col items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-all text-center group shadow-sm hover:shadow"
                title={`Download ${dataset} JSON schema with 2 sample records`}
              >
                <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                  <FileCode className="w-4 h-4" />
                </div>
                <div className="leading-tight">
                  <span className="text-xs font-bold block">JSON</span>
                  <span className="text-[10px] text-slate-400 font-mono">.json</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Dynamic Schema Specification Card for Selected Dataset */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Table className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {currentSpec.title} Schema
                </h4>
                <p className="text-[11px] text-slate-400">
                  {currentSpec.description}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {currentSpec.columns.length} Columns
            </span>
          </div>

          {/* Mandatory vs Optional Pills */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Mandatory Columns (Required in CSV header)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {currentSpec.mandatory.map((col) => (
                <span
                  key={col}
                  className="px-2 py-0.5 rounded-lg font-mono text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                >
                  {col} *
                </span>
              ))}
            </div>
          </div>

          {currentSpec.optional.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Optional Columns
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentSpec.optional.map((col) => (
                  <span
                    key={col}
                    className="px-2 py-0.5 rounded-lg font-mono text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Columns Table */}
          <div className="overflow-x-auto max-h-48 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-950 sticky top-0 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2 px-3">Column Name</th>
                  <th className="py-2 px-3">Data Type</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3">Example Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {currentSpec.columns.map((c) => (
                  <tr key={c.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                      <span>{c.name}</span>
                      {c.mandatory && <span className="text-rose-500 font-sans">*</span>}
                    </td>
                    <td className="py-2 px-3 text-brand-600 dark:text-brand-400">{c.type}</td>
                    <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-400">{c.desc}</td>
                    <td className="py-2 px-3 text-slate-500">{c.sample}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sample Data Live Preview (2 records) */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-brand-600" />
                <span>Sample Data Preview (2 Pre-configured Records)</span>
              </span>
              <span className="text-[10px] text-slate-400">
                Included in CSV, Excel, and JSON downloads
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/50">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                  <tr>
                    <th className="py-1.5 px-2.5 font-sans">#</th>
                    {currentSpec.columns.slice(0, 6).map((c) => (
                      <th key={c.name} className="py-1.5 px-2.5 font-mono">{c.name}</th>
                    ))}
                    {currentSpec.columns.length > 6 && (
                      <th className="py-1.5 px-2.5 font-sans text-slate-400">+{currentSpec.columns.length - 6} more</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-[10px]">
                  {currentSpec.sampleRecords.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white dark:hover:bg-slate-900">
                      <td className="py-1.5 px-2.5 font-sans font-bold text-slate-400">Sample {idx + 1}</td>
                      {currentSpec.columns.slice(0, 6).map((c) => (
                        <td key={c.name} className="py-1.5 px-2.5 text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {row[c.name] || '—'}
                        </td>
                      ))}
                      {currentSpec.columns.length > 6 && (
                        <td className="py-1.5 px-2.5 text-slate-400 italic">...</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            Note: {currentSpec.note}
          </p>
        </div>
      </div>

      {/* Validation Report Banner if Upload Occurred */}
      {lastResult && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Ingestion Validation Summary</span>
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {lastResult.status}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950">
              <span className="text-slate-400 block text-[10px] uppercase">Total Read</span>
              <span className="text-xl font-black text-slate-800 dark:text-slate-200">{lastResult.total_rows}</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
              <span className="text-emerald-600 block text-[10px] uppercase font-bold">Successfully Saved</span>
              <span className="text-xl font-black text-emerald-600">{lastResult.saved_rows}</span>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
              <span className="text-rose-600 block text-[10px] uppercase font-bold">Validation Failures</span>
              <span className="text-xl font-black text-rose-600">{lastResult.failed_rows}</span>
            </div>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500">
              Changes have been validated and saved. All modules and checklists are updated.
            </span>
            {lastResult.dataset === 'joiners' && (
              <a
                href="/hr/joiners"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm flex items-center gap-1"
              >
                <span>View Joiners List & Checklists</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}
            {lastResult.dataset === 'requirements' && (
              <a
                href="/hr/rules"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm flex items-center gap-1"
              >
                <span>View Checklist Rules</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}
            {lastResult.dataset === 'owners' && (
              <a
                href="/hr/owners"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm flex items-center gap-1"
              >
                <span>View Department Owners</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}
            {lastResult.dataset === 'policies' && (
              <a
                href="/hr/policies"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm flex items-center gap-1"
              >
                <span>View Policy Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Errors table if any */}
          {lastResult.errors && lastResult.errors.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="font-bold text-xs text-rose-600 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Row-Level Discrepancy Log:</span>
              </h4>
              <div className="max-h-48 overflow-y-auto border border-rose-100 dark:border-rose-950 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 font-semibold">
                    <tr>
                      <th className="py-2 px-3">Row #</th>
                      <th className="py-2 px-3">Field</th>
                      <th className="py-2 px-3">Rejected Value</th>
                      <th className="py-2 px-3">Error Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100 dark:divide-rose-950 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                    {lastResult.errors.map((err: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-bold text-rose-600">{err.row}</td>
                        <td className="py-2 px-3">{err.field}</td>
                        <td className="py-2 px-3 text-slate-400">{err.value}</td>
                        <td className="py-2 px-3 font-sans text-slate-700 dark:text-slate-300">{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Prior Ingestion Run Audit History */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-600" />
            <span>Ingestion Audit Log</span>
          </h3>
          <button
            onClick={fetchRuns}
            className="text-xs text-brand-600 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh History</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-slate-100 dark:border-slate-800 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Dataset</th>
                <th className="py-2.5 px-3">Filename</th>
                <th className="py-2.5 px-3">Total Rows</th>
                <th className="py-2.5 px-3">Saved</th>
                <th className="py-2.5 px-3">Failed</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
              {runs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400 font-sans">
                    No ingestion runs recorded yet.
                  </td>
                </tr>
              ) : (
                runs.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 text-slate-500 font-sans">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 uppercase font-bold text-brand-600">
                      {r.dataset}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      {r.filename}
                    </td>
                    <td className="py-2.5 px-3">{r.total_rows}</td>
                    <td className="py-2.5 px-3 text-emerald-600 font-bold">{r.saved_rows}</td>
                    <td className="py-2.5 px-3 text-rose-500 font-bold">{r.failed_rows}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          r.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-500">{r.uploaded_by}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
