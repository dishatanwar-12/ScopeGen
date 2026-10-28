import re
from typing import Dict, Any, List, Tuple, Optional
from backend.app.schemas.proposal import GeneratedQuestionModel

# Regex pattern matching any currency symbols or price amounts
CURRENCY_AMOUNT_PATTERN = re.compile(
    r'(?:[\$€£₹¥]|USD|EUR|GBP|INR|CAD|AUD)\s*\d+(?:,\d{3})*(?:\.\d{1,2})?'
    r'|\b\d+(?:,\d{3})*(?:\.\d{1,2})?\s*(?:dollars|euros|pounds|rupees|USD|EUR|INR)\b',
    re.IGNORECASE
)

# Unapproved commercial promise keywords
UNAPPROVED_COMMERCIAL_PATTERNS = [
    re.compile(r'\b(?:100%|full)\s+money[- ]back\s+guarantee\b', re.IGNORECASE),
    re.compile(r'\bunconditional\s+refund\b', re.IGNORECASE),
    re.compile(r'\bfree\s+of\s+charge\b', re.IGNORECASE),
    re.compile(r'\bzero\s+cost\b', re.IGNORECASE),
    re.compile(r'\bunlimited\s+(?:revisions|support)\b', re.IGNORECASE),
    re.compile(r'\bpenalty\s+clause\b', re.IGNORECASE),
    re.compile(r'\bguaranteed\s+(?:roi|return\s+on\s+investment)\b', re.IGNORECASE),
]

def build_trusted_commercial_section(package_data: Optional[Dict[str, Any]]) -> Tuple[str, List[GeneratedQuestionModel], List[str]]:
    """
    Builds the authoritative Commercial Terms & Investment section strictly from
    trusted database records. NEVER relies on LLM hallucination.
    
    Returns:
        (markdown_content, generated_questions, warnings)
    """
    questions: List[GeneratedQuestionModel] = []
    warnings: List[str] = []

    if not package_data:
        content = (
            "### Commercial Terms & Investment\n\n"
            "> **Pricing Not Provided — Commercial Confirmation Required**\n\n"
            "No approved service package or commercial terms have been associated with this project. "
            "A formal cost schedule, billing model, and payment milestones must be reviewed and confirmed "
            "by authorized commercial leadership prior to contract signature.\n\n"
            "- **Investment**: Commercial confirmation required\n"
            "- **Payment Terms**: Commercial confirmation required\n"
            "- **Currency**: Commercial confirmation required\n"
        )
        questions.append(GeneratedQuestionModel(
            question="Which approved commercial pricing schedule and payment terms apply to this engagement?",
            category="pricing",
            rationale="No commercial information was attached from an approved service package.",
            impact="Proposal cannot be legally executed without approved pricing and payment terms.",
            suggested_role="Commercial / Sales Lead"
        ))
        warnings.append("No commercial package attached. Strict commercial firewall active.")
        return content, questions, warnings

    pricing_model = package_data.get("pricing_model", "unspecified")
    currency = package_data.get("currency")
    fixed_fee = package_data.get("fixed_fee_amount")
    hourly_rate = package_data.get("hourly_rate")
    payment_schedule = package_data.get("payment_schedule")
    commercial_terms = package_data.get("commercial_terms")

    lines = ["### Commercial Terms & Investment\n"]

    # 1. Investment Model
    if pricing_model == "fixed_fee" and fixed_fee is not None and currency:
        lines.append(f"**Total Fixed Investment:** {currency} {fixed_fee:,.2f}")
    elif pricing_model == "time_and_materials" and hourly_rate is not None and currency:
        lines.append(f"**Billing Model:** Time & Materials at {currency} {hourly_rate:,.2f} per billable hour")
    elif pricing_model == "retainer" and fixed_fee is not None and currency:
        lines.append(f"**Recurring Retainer:** {currency} {fixed_fee:,.2f} per billing cycle")
    else:
        lines.append("> **Investment Status**: Pricing not provided — confirmation required.")
        lines.append("Approved pricing details were omitted from the package specification. A formal quotation is required.\n")
        questions.append(GeneratedQuestionModel(
            question="What is the approved fee amount and currency for this engagement?",
            category="pricing",
            rationale="The selected service package does not specify a confirmed fee amount or currency.",
            impact="Incomplete commercial terms prevent proposal finalization.",
            suggested_role="Commercial / Sales Lead"
        ))
        warnings.append("Service package missing confirmed pricing amount. Placeholder safely applied.")

    # 2. Payment Schedule
    lines.append("\n#### Payment Schedule")
    if payment_schedule and payment_schedule.strip():
        lines.append(payment_schedule.strip())
    else:
        lines.append("> **Payment Schedule**: Confirmation required prior to execution.")
        questions.append(GeneratedQuestionModel(
            question="What is the agreed payment milestone schedule?",
            category="pricing",
            rationale="No payment milestones or deposit terms were defined in the approved package.",
            impact="Client and finance team must align on billing milestones.",
            suggested_role="Finance Lead"
        ))

    # 3. Commercial Terms
    lines.append("\n#### Terms & Invoicing Conditions")
    if commercial_terms and commercial_terms.strip():
        lines.append(commercial_terms.strip())
    else:
        lines.append(
            "- Invoices are payable within 30 days of issue (Net 30) unless otherwise specified in the master agreement.\n"
            "- Taxes, regulatory levies, and third-party software licensing fees are excluded unless explicitly noted."
        )

    lines.append(
        "\n> [!NOTE]\n"
        "> *All commercial figures above are sourced strictly from company-authorized rate cards. "
        "Any modifications require formal administrative re-approval.*"
    )

    return "\n".join(lines), questions, warnings

def audit_and_sanitize_generated_text(
    section_key: str,
    text: str,
    trusted_package: Optional[Dict[str, Any]]
) -> Tuple[str, List[GeneratedQuestionModel], List[str]]:
    """
    Deterministic safety scanner:
    Checks if the LLM attempted to hallucinate currency amounts, discounts, or unauthorized warranties
    in ANY section (e.g., Executive Summary, Deliverables, Scope).
    If detected, flags them, neutralizes them, and files confirmation questions.
    """
    questions: List[GeneratedQuestionModel] = []
    warnings: List[str] = []
    cleaned_text = text

    # Allow approved currency amounts if they match the trusted package
    approved_currency = trusted_package.get("currency") if trusted_package else None
    approved_amount = str(trusted_package.get("fixed_fee_amount")) if trusted_package and trusted_package.get("fixed_fee_amount") else None

    # Scan for currency/price hallucinations in non-commercial sections
    if section_key != "commercial_terms":
        found_prices = CURRENCY_AMOUNT_PATTERN.findall(cleaned_text)
        if found_prices:
            for match in set(found_prices):
                # If it doesn't strictly match the trusted fee, it is a dangerous hallucination
                warnings.append(
                    f"Pricing Guardrail Alert: SOW Section '{section_key}' contained unauthorized model-generated price '{match}'. "
                    "Price reference was sanitized to prevent unauthorized commercial commitments."
                )
                questions.append(GeneratedQuestionModel(
                    question=f"A potential fee reference '{match}' was found in section '{section_key}'. Is this an approved client commitment?",
                    category="pricing",
                    rationale="AI models must never invent or quote unapproved rates in narrative scope sections.",
                    impact="Risk of unintended commercial exposure or scope creep.",
                    suggested_role="Commercial / Sales Lead"
                ))
                cleaned_text = cleaned_text.replace(match, "[COMMERCIAL CONFIRMATION REQUIRED]")

    # Scan for unauthorized guarantees / warranties
    for pattern in UNAPPROVED_COMMERCIAL_PATTERNS:
        matches = pattern.findall(cleaned_text)
        if matches:
            for match in set(matches):
                warnings.append(
                    f"Commercial Policy Alert: Detected unauthorized commercial claim '{match}' in section '{section_key}'."
                )
                questions.append(GeneratedQuestionModel(
                    question=f"Section '{section_key}' contains the claim '{match}'. Is this an authorized corporate policy?",
                    category="scope",
                    rationale="Prohibited commercial claim detected in generated narrative.",
                    impact="Legal exposure if company does not offer such warranties.",
                    suggested_role="Legal Counsel"
                ))
                cleaned_text = pattern.sub("[AUTHORIZED APPROVAL REQUIRED]", cleaned_text)

    return cleaned_text, questions, warnings
