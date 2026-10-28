import pytest
from backend.app.services.export_pdf import generate_proposal_pdf
from backend.app.services.export_docx import generate_proposal_docx

def test_pdf_export_structure():
    sections = [
        {
            "title": "Executive Summary",
            "content_markdown": "This is a **high-priority** enterprise proposal.\n\n- Deliverable 1\n- Deliverable 2",
            "sort_order": 1
        },
        {
            "title": "Commercial Terms & Investment",
            "content_markdown": "| Item | Rate | Total |\n| :--- | :--- | :--- |\n| Phase 1 | $150/hr | $15,000 |\n\n> Note: Approved rates.",
            "sort_order": 2
        }
    ]

    pdf_bytes = generate_proposal_pdf(
        proposal_title="Cloud Transformation SOW",
        client_name="Acme Corp",
        project_title="Cloud Migration 2026",
        status="approved",
        sections=sections
    )

    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 1000
    # Standard PDF header check
    assert pdf_bytes.startswith(b"%PDF-")

def test_docx_export_structure():
    sections = [
        {
            "title": "Project Scope & Milestones",
            "content_markdown": "### Delivery Milestones\n\n| Phase | Timeline | Deliverable |\n| :--- | :--- | :--- |\n| Phase 1 | Week 1-2 | Architecture Doc |",
            "sort_order": 1
        }
    ]

    docx_bytes = generate_proposal_docx(
        proposal_title="AI Dispatch Optimization SOW",
        client_name="Global Logistics",
        project_title="AI Dispatch",
        status="draft",
        sections=sections
    )

    assert isinstance(docx_bytes, bytes)
    assert len(docx_bytes) > 2000
    # Standard DOCX (Zip archive) header check: PK\x03\x04
    assert docx_bytes.startswith(b"PK\x03\x04")

