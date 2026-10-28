# ProposalCraft AI — System Architecture & Specification

## 1. Executive Overview
ProposalCraft AI is an enterprise-grade proposal and Statement of Work (SOW) drafting assistant. It leverages high-performance LLMs hosted on **NVIDIA NIM** (such as `meta/llama-3.3-70b-instruct`) while enforcing **deterministic commercial safeguards**: AI models draft scope, deliverables, assumptions, risks, and client responsibilities, but **never invent pricing, payment terms, delivery dates, or contractual warranties**.

## 2. High-Level Architecture Diagram

```mermaid
graph TD
    ClientApp["Frontend (React 19, TypeScript, Vite, Tailwind, TipTap)"]
    API["FastAPI Backend (REST API /api/v1)"]
    AuthModule["Auth & Tenant Isolation (JWT / Argon2 / RBAC)"]
    DocParser["Document Parsing Engine (PyPDF / python-docx)"]
    NvidiaService["NVIDIA NIM Service (Official Chat Completions)"]
    SafetyEngine["Deterministic Guardrail & Commercial Engine"]
    ExportEngine["Export Engine (ReportLab PDF / python-docx)"]
    DB[(PostgreSQL / SQLite with SQLAlchemy & Alembic)]

    ClientApp -->|HTTPS / Bearer JWT| API
    API --> AuthModule
    API --> DocParser
    API --> DB
    API --> SafetyEngine
    SafetyEngine -->|Sanitized Structured Context| NvidiaService
    NvidiaService -->|Raw Proposal Draft| SafetyEngine
    SafetyEngine -->|Verified & Structured Proposal| DB
    API --> ExportEngine
    ExportEngine -->|PDF / DOCX Stream| ClientApp
```

## 3. Data Models & Entity Relationships

```mermaid
erDiagram
    USER ||--o{ CLIENT : owns
    USER ||--o{ PROJECT : manages
    USER ||--o{ PROPOSAL : authors
    USER ||--o{ AUDIT_LOG : triggers
    CLIENT ||--o{ PROJECT : contains
    PROJECT ||--o{ DISCOVERY_NOTE : has
    PROJECT ||--o{ SOURCE_DOCUMENT : attaches
    PROJECT ||--o{ PROPOSAL : generates
    SERVICE_PACKAGE ||--o{ PACKAGE_VERSION : versions
    SERVICE_PACKAGE ||--o{ PROPOSAL : informs
    PROPOSAL_TEMPLATE ||--o{ TEMPLATE_VERSION : versions
    PROPOSAL_TEMPLATE ||--o{ PROPOSAL : formats
    PROPOSAL ||--o{ PROPOSAL_SECTION : includes
    PROPOSAL ||--o{ PROPOSAL_VERSION : history
    PROPOSAL ||--o{ CONFIRMATION_QUESTION : requires
```

## 4. Key Entities Detail

1. **User**: `id`, `email`, `hashed_password`, `full_name`, `role` (`admin`, `consultant`, `reviewer`), `is_active`, `created_at`.
2. **Client**: `id`, `owner_id`, `company_name`, `primary_contact_name`, `contact_email`, `industry`, `website`, `background`, `internal_notes`, `created_at`, `updated_at`.
3. **Project**: `id`, `owner_id`, `client_id`, `title`, `project_type`, `business_problem`, `desired_outcomes`, `existing_environment`, `constraints`, `required_integrations`, `delivery_approach`, `target_dates`, `status` (`intake`, `in_review`, `proposal_ready`, `archived`).
4. **DiscoveryNote**: `id`, `project_id`, `content`, `note_type` (`meeting_notes`, `interview`, `requirements`, `constraints`), `created_at`.
5. **SourceDocument**: `id`, `project_id`, `original_filename`, `storage_path`, `file_type` (`txt`, `pdf`, `docx`), `file_size_bytes`, `extracted_text`, `sanitized_text`, `uploaded_at`.
6. **ServicePackage**: `id`, `name`, `slug`, `category`, `description`, `intended_use`, `deliverables` (JSON), `included_activities` (JSON), `excluded_activities` (JSON), `dependencies` (JSON), `constraints` (JSON), `approval_status` (`draft`, `approved`, `archived`), `current_version`, `approved_by_id`, `approved_at`.
   - Structured Commercial Terms: `pricing_model` (`fixed_fee`, `time_and_materials`, `retainer`, `unspecified`), `currency` (e.g. `USD`, `INR`), `fixed_fee_amount`, `hourly_rate`, `payment_schedule`, `commercial_terms`.
7. **ProposalTemplate**: `id`, `name`, `description`, `is_default`, `approval_status`, `branding` (JSON), `sections_schema` (JSON: order, title, required, protected_legal_text), `created_at`.
8. **Proposal**: `id`, `project_id`, `owner_id`, `package_id`, `template_id`, `title`, `status` (`draft`, `in_review`, `approved`, `archived`), `current_version_number`, `generation_metadata` (JSON: model used, token count, latency, review warnings), `created_at`, `updated_at`.
9. **ProposalSection**: `id`, `proposal_id`, `section_key`, `title`, `content_markdown`, `content_html`, `sort_order`, `is_protected`, `source_references` (JSON), `last_modified_by`.
10. **ProposalVersion**: `id`, `proposal_id`, `version_number`, `snapshot_json`, `change_summary`, `created_at`, `created_by_id`.
11. **ConfirmationQuestion**: `id`, `proposal_id`, `question`, `category` (`pricing`, `timeline`, `scope`, `technical`, `dependency`), `rationale`, `impact`, `status` (`open`, `answered`, `resolved`, `dismissed`), `answer`, `resolved_by_id`, `resolved_at`.
12. **AuditLog**: `id`, `user_id`, `action`, `resource_type`, `resource_id`, `details` (JSON), `ip_address`, `timestamp`.

## 5. The Commercial Integrity Firewall

1. **Extraction**: Structured price fields reside in `ServicePackage`.
2. **Prompt Boundary**: The system prompt instructs the NVIDIA NIM LLM to NEVER fabricate numbers or currencies.
3. **Deterministic Synthesis**: In `proposal_generation.py`, the commercial section is composed programmatically from trusted database values.
4. **Adversarial Validation**: A regex & semantic scanner inspects all generated content. Any unapproved currency symbols, rate figures, or unauthorized deadline claims are stripped or flagged as critical review questions.
5. **No Blind Fallbacks**: If commercial details are missing, the UI and document output state: `"Pricing not provided — confirmation required."` Never `0` or free.

