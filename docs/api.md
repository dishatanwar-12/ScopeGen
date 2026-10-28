# ProposalCraft AI — REST API Specification (`/api/v1`)

All endpoints are versioned under `/api/v1`. Protected endpoints require HTTP Bearer JWT token header:
`Authorization: Bearer <jwt_token>`

## 1. Authentication & User Management
- `POST /api/v1/auth/register` — Register a new user account
- `POST /api/v1/auth/login` — Login with username/password, returns access token
- `GET /api/v1/auth/me` — Return current authenticated user profile
- `POST /api/v1/auth/logout` — Invalidate session/client token

## 2. Clients
- `GET /api/v1/clients` — List clients (paginated, searchable, user-scoped)
- `POST /api/v1/clients` — Create a new client record
- `GET /api/v1/clients/{id}` — Retrieve client details
- `PUT /api/v1/clients/{id}` — Update client details
- `DELETE /api/v1/clients/{id}` — Archive/delete client

## 3. Projects
- `GET /api/v1/projects` — List projects (filterable by client, status)
- `POST /api/v1/projects` — Create project
- `GET /api/v1/projects/{id}` — Retrieve project with associated discovery notes, packages, proposals
- `PUT /api/v1/projects/{id}` — Update project
- `DELETE /api/v1/projects/{id}` — Delete project

## 4. Discovery Notes & Documents
- `GET /api/v1/projects/{id}/notes` — List discovery notes
- `POST /api/v1/projects/{id}/notes` — Add a discovery note
- `DELETE /api/v1/projects/{id}/notes/{note_id}` — Delete note
- `POST /api/v1/projects/{id}/documents/upload` — Upload TXT, PDF, DOCX file; extracts sanitized text
- `GET /api/v1/projects/{id}/documents` — List uploaded source documents
- `DELETE /api/v1/projects/{id}/documents/{doc_id}` — Remove document

## 5. Service Packages (Catalog)
- `GET /api/v1/packages` — List service packages (approved for consultants; all for admin)
- `POST /api/v1/packages` — Create service package (admin)
- `GET /api/v1/packages/{id}` — Get package details
- `PUT /api/v1/packages/{id}` — Update package (creates new version if approved)
- `POST /api/v1/packages/{id}/approve` — Approve package for production use (admin only)
- `POST /api/v1/packages/{id}/archive` — Archive package (admin only)

## 6. Proposal Templates
- `GET /api/v1/templates` — List proposal templates
- `POST /api/v1/templates` — Create custom template (admin)
- `GET /api/v1/templates/{id}` — Get template details
- `PUT /api/v1/templates/{id}` — Update template
- `POST /api/v1/templates/{id}/approve` — Approve template (admin only)

## 7. Pre-Generation Fact Review & Proposal Generation
- `POST /api/v1/proposals/review-facts` — Analyze project facts, notes, and selected package before calling NVIDIA LLM. Returns confirmed facts, missing fields, ambiguities.
- `POST /api/v1/proposals/generate` — Trigger NVIDIA NIM LLM proposal generation. Enforces pricing firewall, parses sections, generates confirmation questions.
- `GET /api/v1/proposals` — List proposals
- `GET /api/v1/proposals/{id}` — Get proposal details, sections, questions, and version info
- `PUT /api/v1/proposals/{id}` — Update proposal metadata/status
- `PUT /api/v1/proposals/{id}/sections/{section_id}` — Update a proposal section with optimistic concurrency check
- `POST /api/v1/proposals/{id}/regenerate-section` — Regenerate a single section using NVIDIA LLM
- `POST /api/v1/proposals/{id}/versions` — Create a snapshot version
- `GET /api/v1/proposals/{id}/versions` — List snapshot versions
- `POST /api/v1/proposals/{id}/restore/{version_id}` — Restore proposal to a previous snapshot
- `GET /api/v1/proposals/{id}/export/pdf` — Stream generated PDF
- `GET /api/v1/proposals/{id}/export/docx` — Stream generated DOCX

## 8. Confirmation Questions
- `GET /api/v1/proposals/{id}/questions` — List confirmation questions
- `PUT /api/v1/proposals/{id}/questions/{q_id}` — Answer, resolve, or dismiss a confirmation question

## 9. System & Health
- `GET /api/v1/system/health` — Basic API health check
- `GET /api/v1/system/ai-status` — Check NVIDIA NIM connectivity, verify configured model without leaking secrets
- `GET /api/v1/system/dashboard-stats` — Real database-backed statistics for current user

