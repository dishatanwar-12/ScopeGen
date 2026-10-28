from typing import List, Dict, Any, Optional
from backend.app.models.project import Project
from backend.app.models.package import ServicePackage
from backend.app.models.discovery import DiscoveryNote, SourceDocument
from backend.app.schemas.proposal import FactReviewResponse

def extract_and_review_facts(
    project: Project,
    service_package: Optional[ServicePackage],
    discovery_notes: List[DiscoveryNote],
    source_documents: List[SourceDocument]
) -> FactReviewResponse:
    """
    Performs deterministic pre-generation analysis on project context,
    discovery notes, uploaded files, and selected service package.
    Categorizes facts, goals, ambiguities, and missing data prior to LLM generation.
    """
    confirmed_facts: List[Dict[str, str]] = []
    client_goals: List[str] = []
    package_deliverables: List[Dict[str, Any]] = []
    package_activities: List[str] = []
    package_exclusions: List[str] = []
    explicitly_agreed_decisions: List[str] = []
    unconfirmed_assumptions: List[str] = []
    missing_information: List[str] = []
    contradictions: List[str] = []
    scope_ambiguities: List[str] = []

    # 1. Evaluate Project Metadata
    confirmed_facts.append({"label": "Project Title", "value": project.title})
    confirmed_facts.append({"label": "Project Type", "value": project.project_type})
    confirmed_facts.append({"label": "Business Problem", "value": project.business_problem})
    confirmed_facts.append({"label": "Target Outcomes", "value": project.desired_outcomes})

    if project.existing_environment:
        confirmed_facts.append({"label": "Existing Environment", "value": project.existing_environment})
    else:
        missing_information.append("Existing technical infrastructure or architecture environment is unspecified.")

    if project.known_constraints:
        confirmed_facts.append({"label": "Known Constraints", "value": project.known_constraints})
    else:
        unconfirmed_assumptions.append("No technical or regulatory constraints specified; standard practices assumed.")

    if project.required_integrations:
        confirmed_facts.append({"label": "Required Integrations", "value": project.required_integrations})
    else:
        scope_ambiguities.append("Third-party API and systems integration requirements are unconfirmed.")

    if project.target_dates:
        confirmed_facts.append({"label": "Target Dates (Client Stated)", "value": project.target_dates})
    else:
        unconfirmed_assumptions.append("No hard calendar delivery deadline was set; sequencing will be relative.")

    # 2. Evaluate Discovery Notes
    for note in discovery_notes:
        if note.note_type in ("requirements", "pain_points"):
            client_goals.append(note.content)
        elif note.note_type == "decisions":
            explicitly_agreed_decisions.append(note.content)
        elif note.note_type == "open_questions":
            missing_information.append(f"Unresolved discovery question: {note.content}")
        elif note.note_type == "constraints":
            confirmed_facts.append({"label": "Documented Constraint", "value": note.content})

    # 3. Evaluate Service Package
    commercial_status: Dict[str, Any] = {}
    if service_package:
        confirmed_facts.append({"label": "Approved Package", "value": service_package.name})
        package_deliverables = service_package.included_deliverables or []
        package_activities = service_package.included_activities or []
        package_exclusions = service_package.excluded_activities or []

        commercial_status = {
            "has_package": True,
            "package_name": service_package.name,
            "approval_status": service_package.approval_status,
            "pricing_model": service_package.pricing_model,
            "currency": service_package.currency,
            "fixed_fee_amount": service_package.fixed_fee_amount,
            "hourly_rate": service_package.hourly_rate,
            "has_pricing": bool(service_package.fixed_fee_amount or service_package.hourly_rate),
            "payment_schedule": service_package.payment_schedule,
            "commercial_terms": service_package.commercial_terms
        }

        if service_package.approval_status != "approved":
            contradictions.append(
                f"Selected package '{service_package.name}' is currently in '{service_package.approval_status}' state. Proposals should use approved packages."
            )

        if not commercial_status["has_pricing"]:
            missing_information.append("The selected service package does not contain approved pricing amounts.")
    else:
        commercial_status = {
            "has_package": False,
            "has_pricing": False,
            "message": "No service package selected."
        }
        missing_information.append("No approved service package selected. SOW will require manual commercial definition.")

    # 4. Check for Contradictions between Notes & Constraints
    combined_notes_text = " ".join([n.content for n in discovery_notes] + [d.extracted_text for d in source_documents]).lower()
    if "on-premise" in combined_notes_text and "pure cloud" in combined_notes_text:
        contradictions.append("Conflicting hosting requirements: Both 'on-premise' and 'pure cloud' appear across discovery sources.")

    # Calculate Readiness Score (0-100)
    score = 100
    if not service_package:
        score -= 25
    elif service_package.approval_status != "approved":
        score -= 10
    if not commercial_status.get("has_pricing"):
        score -= 15
    score -= min(30, len(missing_information) * 5)
    score -= min(20, len(contradictions) * 10)
    readiness_score = max(20, score)

    can_generate = len(project.business_problem) > 5 and len(project.desired_outcomes) > 5

    return FactReviewResponse(
        confirmed_facts=confirmed_facts,
        client_goals=client_goals,
        package_derived_deliverables=package_deliverables,
        package_derived_activities=package_activities,
        package_exclusions=package_exclusions,
        explicitly_agreed_decisions=explicitly_agreed_decisions,
        unconfirmed_assumptions=unconfirmed_assumptions,
        missing_information=missing_information,
        contradictions=contradictions,
        scope_ambiguities=scope_ambiguities,
        commercial_status=commercial_status,
        can_generate=can_generate,
        readiness_score=readiness_score
    )

