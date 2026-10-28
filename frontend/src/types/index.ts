export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'consultant' | 'reviewer';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  owner_id: string;
  company_name: string;
  primary_contact_name: string;
  contact_email: string;
  industry: string;
  website?: string;
  background?: string;
  internal_notes?: string;
  created_at: string;
  updated_at: string;
  project_count?: number;
}

export interface Project {
  id: string;
  owner_id: string;
  client_id: string;
  title: string;
  project_type: string;
  business_problem: string;
  desired_outcomes: string;
  existing_environment?: string;
  known_constraints?: string;
  required_integrations?: string;
  delivery_approach?: string;
  target_dates?: string;
  internal_owner?: string;
  status: 'intake' | 'in_review' | 'proposal_ready' | 'archived';
  service_package_id?: string;
  proposal_template_id?: string;
  created_at: string;
  updated_at: string;
  client_name?: string;
  notes_count?: number;
  docs_count?: number;
  proposals_count?: number;
}

export interface DiscoveryNote {
  id: string;
  project_id: string;
  note_type: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface SourceDocument {
  id: string;
  project_id: string;
  original_filename: string;
  file_type: string;
  file_size_bytes: number;
  extracted_text_preview: string;
  sanitized_text: string;
  uploaded_at: string;
}

export interface ServicePackage {
  id: string;
  name: string;
  category: string;
  description: string;
  intended_use: string;
  included_deliverables: Array<{ name: string; description: string }>;
  included_activities: string[];
  excluded_activities: string[];
  dependencies: string[];
  constraints: string[];
  pricing_model: 'fixed_fee' | 'time_and_materials' | 'retainer' | 'unspecified';
  currency?: string;
  fixed_fee_amount?: number;
  hourly_rate?: number;
  payment_schedule?: string;
  commercial_terms?: string;
  current_version: number;
  approval_status: 'draft' | 'approved' | 'archived';
  approved_by_id?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ProposalTemplate {
  id: string;
  name: string;
  description: string;
  is_default: boolean;
  approval_status: 'draft' | 'approved' | 'archived';
  branding: Record<string, any>;
  sections_schema: Array<{ key: string; title: string; required: boolean; sort_order: number }>;
  current_version: number;
  created_at: string;
  updated_at: string;
}

export interface ProposalSection {
  id: string;
  proposal_id: string;
  section_key: string;
  title: string;
  content_markdown: string;
  sort_order: number;
  is_protected: boolean;
  source_references: string[];
  version_lock: number;
  updated_at: string;
}

export interface ConfirmationQuestion {
  id: string;
  proposal_id: string;
  question: string;
  category: 'pricing' | 'timeline' | 'scope' | 'technical' | 'dependency';
  rationale: string;
  impact: string;
  suggested_role?: string;
  status: 'open' | 'answered' | 'resolved' | 'dismissed';
  answer?: string;
  resolved_by_id?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ProposalVersion {
  id: string;
  proposal_id: string;
  version_number: number;
  change_summary: string;
  created_by_id?: string;
  created_at: string;
}

export interface Proposal {
  id: string;
  owner_id: string;
  project_id: string;
  service_package_id?: string;
  proposal_template_id?: string;
  title: string;
  status: 'draft' | 'in_review' | 'approved' | 'archived';
  current_version_number: number;
  generation_metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  project_title?: string;
  client_name?: string;
  service_package_name?: string;
  sections: ProposalSection[];
  questions: ConfirmationQuestion[];
}

export interface FactReviewData {
  confirmed_facts: Array<{ label: string; value: string }>;
  client_goals: string[];
  package_derived_deliverables: Array<{ name: string; description: string }>;
  package_derived_activities: string[];
  package_exclusions: string[];
  explicitly_agreed_decisions: string[];
  unconfirmed_assumptions: string[];
  missing_information: string[];
  contradictions: string[];
  scope_ambiguities: string[];
  commercial_status: Record<string, any>;
  can_generate: boolean;
  readiness_score: number;
}

export interface DashboardStats {
  total_proposals: number;
  draft_proposals: number;
  in_review_proposals: number;
  approved_proposals: number;
  total_clients: number;
  total_projects: number;
  open_questions: number;
  recent_proposals: Array<{
    id: string;
    title: string;
    project_title: string;
    status: string;
    version: number;
    updated_at: string;
  }>;
}

