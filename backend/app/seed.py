import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone

from backend.app.core.database import AsyncSessionLocal
from backend.app.core.security import hash_password
from backend.app.models.user import User
from backend.app.models.package import ServicePackage
from backend.app.models.template import ProposalTemplate
from backend.app.models.client import Client
from backend.app.models.project import Project

logger = logging.getLogger(__name__)

async def seed_initial_data():
    """Seeds starter records if the database is brand new."""
    async with AsyncSessionLocal() as db:
        # 1. Seed Admin User
        admin_check = await db.execute(select(User).where(User.email == "admin@proposalcraft.ai"))
        admin = admin_check.scalar_one_or_none()
        if not admin:
            admin = User(
                email="admin@proposalcraft.ai",
                full_name="System Administrator",
                hashed_password=hash_password("Admin12345!"),
                role="admin",
                is_active=True
            )
            db.add(admin)
            await db.flush()
            logger.info("Created default administrator: admin@proposalcraft.ai")

        # 2. Seed Consultant User
        consultant_check = await db.execute(select(User).where(User.email == "consultant@proposalcraft.ai"))
        consultant = consultant_check.scalar_one_or_none()
        if not consultant:
            consultant = User(
                email="consultant@proposalcraft.ai",
                full_name="Lead Solutions Architect",
                hashed_password=hash_password("Consultant12345!"),
                role="consultant",
                is_active=True
            )
            db.add(consultant)
            await db.flush()
            logger.info("Created default consultant: consultant@proposalcraft.ai")

        # 3. Seed Starter Proposal Template
        tpl_check = await db.execute(select(ProposalTemplate).where(ProposalTemplate.is_default == True))
        if not tpl_check.scalar_one_or_none():
            starter_tpl = ProposalTemplate(
                name="Standard Professional Services SOW (Starter Template)",
                description="Default starter template for IT consulting, cloud engineering, and AI solutions proposals. Clearly labeled as a starter document.",
                is_default=True,
                approval_status="approved",
                current_version=1,
                approved_by_id=admin.id,
                approved_at=datetime.now(timezone.utc),
                created_by_id=admin.id,
                branding={
                    "company_name": "ProposalCraft Professional Services",
                    "primary_color": "#0F2438",
                    "accent_color": "#2B6695",
                    "header_text": "Statement of Work & Commercial Proposal",
                    "footer_text": "Confidential & Proprietary"
                },
                sections_schema=[
                    {"key": "executive_summary", "title": "Executive Summary", "required": True, "sort_order": 1},
                    {"key": "client_background", "title": "Client Background & Objectives", "required": True, "sort_order": 2},
                    {"key": "business_problem", "title": "Problem Statement & Opportunity", "required": True, "sort_order": 3},
                    {"key": "proposed_solution", "title": "Proposed Technical Solution & Approach", "required": True, "sort_order": 4},
                    {"key": "deliverables", "title": "Deliverables & Scope of Work", "required": True, "sort_order": 5},
                    {"key": "exclusions", "title": "Exclusions & Out of Scope", "required": True, "sort_order": 6},
                    {"key": "assumptions_dependencies", "title": "Assumptions, Dependencies & Client Responsibilities", "required": True, "sort_order": 7},
                    {"key": "milestones", "title": "Project Milestones & Delivery Sequence", "required": True, "sort_order": 8},
                    {"key": "risks", "title": "Risks & Mitigations", "required": True, "sort_order": 9},
                    {"key": "commercial_terms", "title": "Commercial Terms & Investment", "required": True, "sort_order": 10, "protected_legal_text": "Protected from AI hallucination"}
                ]
            )
            db.add(starter_tpl)

        # 4. Seed Approved Packages
        pkg1_check = await db.execute(select(ServicePackage).where(ServicePackage.name == "Enterprise Cloud Architecture & Migration"))
        if not pkg1_check.scalar_one_or_none():
            pkg1 = ServicePackage(
                name="Enterprise Cloud Architecture & Migration",
                category="Cloud Infrastructure",
                description="End-to-end cloud infrastructure audit, landing zone provisioning, container orchestration setup, and workload migration.",
                intended_use="For enterprise clients migrating legacy monolithic workloads to secure cloud environments.",
                included_deliverables=[
                    {"name": "Cloud Infrastructure Architecture Design", "description": "Multi-region Terraform IaC specifications and network topology diagrams."},
                    {"name": "Security & Compliance Hardening Guide", "description": "IAM least-privilege policies, secret management, and SOC2 compliance mapping."},
                    {"name": "Containerized CI/CD Deployment Pipeline", "description": "Automated deployment pipeline with automated test stages and blue-green rollouts."}
                ],
                included_activities=[
                    "Discovery interviews with client engineering leads",
                    "Provisioning of staging and production VPCs with IaC",
                    "Workload containerization using Docker and Kubernetes",
                    "Cutover execution during scheduled maintenance window"
                ],
                excluded_activities=[
                    "Refactoring of client application source code",
                    "Third-party licensing costs (AWS/GCP/Azure compute bills)",
                    "Ongoing 24/7 managed NOC services after 30-day warranty period"
                ],
                dependencies=[
                    "Client provides administrative IAM credentials for cloud accounts",
                    "Client designates primary technical contact for DNS change approvals"
                ],
                constraints=[
                    "Migration cutover must happen within a pre-agreed 4-hour maintenance window"
                ],
                pricing_model="fixed_fee",
                currency="USD",
                fixed_fee_amount=35000.0,
                payment_schedule="40% upon project kickoff; 30% upon completion of staging deployment; 30% upon final production cutover sign-off.",
                commercial_terms="Net 30 payment terms. Taxes excluded. Changes to agreed architecture require formal Change Order.",
                approval_status="approved",
                approved_by_id=admin.id,
                approved_at=datetime.now(timezone.utc),
                created_by_id=admin.id
            )
            db.add(pkg1)

        pkg2_check = await db.execute(select(ServicePackage).where(ServicePackage.name == "Custom Generative AI & NVIDIA NIM Deployment"))
        if not pkg2_check.scalar_one_or_none():
            pkg2 = ServicePackage(
                name="Custom Generative AI & NVIDIA NIM Deployment",
                category="Artificial Intelligence",
                description="Production deployment of NVIDIA NIM hosted inference microservices, custom RAG indexing pipelines, and enterprise safety guardrails.",
                intended_use="For organizations implementing domain-specific LLM workflows with high throughput and low latency.",
                included_deliverables=[
                    {"name": "NVIDIA NIM Infrastructure Integration", "description": "Production integration with NVIDIA NIM API Catalog and microservices."},
                    {"name": "Vector Database & RAG Pipeline", "description": "Document ingestion pipeline, chunking, and semantic vector index."},
                    {"name": "Enterprise Prompt Guardrails & Safety Filter", "description": "Deterministic pricing and prompt-injection guardrails."}
                ],
                included_activities=[
                    "Benchmarking NVIDIA NIM models for token throughput and latency",
                    "Integration of structured JSON output schema validation",
                    "Automated adversarial security testing for prompt injection"
                ],
                excluded_activities=[
                    "Fine-tuning foundational model weights (unless separately scoped)",
                    "Data cleansing of unstructured historical archives"
                ],
                dependencies=[
                    "Client provides access to domain reference documents and API keys"
                ],
                constraints=[
                    "Inference latency target strictly under 2500ms at 95th percentile"
                ],
                pricing_model="fixed_fee",
                currency="USD",
                fixed_fee_amount=48000.0,
                payment_schedule="50% deposit upon contract signing; 50% upon successful verification and client acceptance.",
                commercial_terms="Net 15 payment terms. Model hosting fees paid directly by client to cloud or NVIDIA provider.",
                approval_status="approved",
                approved_by_id=admin.id,
                approved_at=datetime.now(timezone.utc),
                created_by_id=admin.id
            )
            db.add(pkg2)

        # 5. Unpriced Package (For testing commercial missing price protection!)
        pkg3_check = await db.execute(select(ServicePackage).where(ServicePackage.name == "Discovery & Technical Feasibility Assessment"))
        if not pkg3_check.scalar_one_or_none():
            pkg3 = ServicePackage(
                name="Discovery & Technical Feasibility Assessment",
                category="Consulting & Audit",
                description="Initial 2-week architectural assessment and technical feasibility report.",
                intended_use="Initial scoping engagement prior to full scale implementation.",
                included_deliverables=[
                    {"name": "Technical Feasibility Audit Report", "description": "Gap analysis, security assessment, and recommendations."}
                ],
                included_activities=["Stakeholder interviews", "Architecture review"],
                excluded_activities=["Hands-on software development"],
                dependencies=["Access to system diagrams"],
                constraints=["2-week sprint duration"],
                pricing_model="unspecified", # Intentionally unpriced!
                currency=None,
                fixed_fee_amount=None,
                hourly_rate=None,
                payment_schedule=None,
                commercial_terms=None,
                approval_status="approved",
                approved_by_id=admin.id,
                approved_at=datetime.now(timezone.utc),
                created_by_id=admin.id
            )
            db.add(pkg3)

        # 6. Sample Client and Project for Instant Demonstration
        client_check = await db.execute(select(Client).where(Client.company_name == "Acme Global Logistics"))
        if not client_check.scalar_one_or_none():
            acme_client = Client(
                owner_id=consultant.id,
                company_name="Acme Global Logistics",
                primary_contact_name="Sarah Jenkins",
                contact_email="sarah.jenkins@acmeglobal.example.com",
                industry="Supply Chain & Transportation",
                website="https://acmeglobal.example.com",
                background="International freight forwarder operating in 35 countries with over 1,200 fleet vehicles.",
                internal_notes="Key account looking to modernize their legacy dispatch system with AI-driven route optimization."
            )
            db.add(acme_client)
            await db.flush()

            acme_project = Project(
                owner_id=consultant.id,
                client_id=acme_client.id,
                title="AI Route Optimization & Dispatch SOW",
                project_type="Custom Generative AI & Cloud",
                business_problem="Dispatchers spend 4+ hours daily manually resolving delivery exceptions and re-routing delayed drivers across multiple legacy databases.",
                desired_outcomes="Automate 80% of route exception notifications and reduce fuel overhead by 12% across regional transport hubs.",
                existing_environment="PostgreSQL on-premise transactional DB, legacy REST API, AWS EC2 compute.",
                known_constraints="Must integrate with existing proprietary telematics hardware; zero downtime for live delivery tracking.",
                required_integrations="Samsara Fleet Telematics API, Twilio SMS Gateway, internal ERP.",
                delivery_approach="Agile two-week sprints with bi-weekly client stakeholder demos.",
                target_dates="Q1 Kickoff with initial pilot deployment in 8 weeks",
                internal_owner="Lead Solutions Architect",
                status="intake",
                service_package_id=pkg2.id,
                proposal_template_id=starter_tpl.id
            )
            db.add(acme_project)

        await db.commit()
        logger.info("Database seeding completed successfully.")
