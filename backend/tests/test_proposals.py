import json
import pytest
from unittest.mock import patch, MagicMock
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_proposal_lifecycle_and_optimistic_locking(client: AsyncClient, auth_headers_a, auth_headers_admin):
    # 1. Create client and project
    c_res = await client.post("/api/v1/clients", json={
        "company_name": "Apex Innovations",
        "primary_contact_name": "Marcus Vance",
        "contact_email": "marcus@apex.example.com",
        "industry": "Enterprise Software"
    }, headers=auth_headers_a)
    client_id = c_res.json()["id"]

    p_res = await client.post("/api/v1/projects", json={
        "client_id": client_id,
        "title": "Cloud Scale Optimization SOW",
        "project_type": "Cloud Infrastructure",
        "business_problem": "System crashes under high concurrent load during product launches.",
        "desired_outcomes": "Zero outages during 10x traffic spikes with auto-scaling."
    }, headers=auth_headers_a)
    project_id = p_res.json()["id"]

    # 2. Admin creates approved package
    pkg_res = await client.post("/api/v1/packages", json={
        "name": "Cloud Resiliency Suite",
        "category": "Cloud Infrastructure",
        "description": "Auto-scaling infrastructure with Kubernetes.",
        "intended_use": "High traffic websites",
        "pricing_model": "fixed_fee",
        "currency": "USD",
        "fixed_fee_amount": 42000.0,
        "payment_schedule": "50% upfront, 50% signoff",
        "included_deliverables": [{"name": "Autoscaling Architecture", "description": "K8s HPA specs"}],
        "included_activities": ["Load testing", "Cluster setup"],
        "excluded_activities": ["Code refactoring"]
    }, headers=auth_headers_admin)
    pkg_id = pkg_res.json()["id"]
    await client.post(f"/api/v1/packages/{pkg_id}/approve", headers=auth_headers_admin)

    # 3. Add discovery note
    await client.post(f"/api/v1/projects/{project_id}/notes", json={
        "note_type": "technical",
        "content": "Peak traffic reaches 50,000 requests per second."
    }, headers=auth_headers_a)

    # 4. Review facts (Step 7)
    review_res = await client.post("/api/v1/proposals/review-facts", json={
        "project_id": project_id,
        "service_package_id": pkg_id
    }, headers=auth_headers_a)
    assert review_res.status_code == 200
    review_data = review_res.json()
    assert review_data["can_generate"] is True
    assert review_data["commercial_status"]["has_pricing"] is True

    # 5. Mock NVIDIA NIM proposal generation and generate proposal (Step 8)
    mock_llm_json = {
        "proposal_title": "Apex Innovations Cloud Resiliency SOW",
        "executive_summary": "Comprehensive architecture proposal for high scale.",
        "client_background": "Apex is an enterprise software leader.",
        "business_problem": "System crashes during peak product launches.",
        "objectives_and_outcomes": "Zero downtime at 50,000 req/sec.",
        "proposed_solution": "Deploy multi-region Kubernetes with HPA and Redis caching.",
        "in_scope_deliverables": [
            {"name": "Autoscaling Cluster", "description": "EKS setup", "acceptance_criteria": "Pass 50k req/sec load test"}
        ],
        "out_of_scope_exclusions": ["Application code rewrite"],
        "assumptions": ["AWS account access provided"],
        "dependencies": ["DNS delegations"],
        "client_responsibilities": ["Participate in weekly sync"],
        "milestones_and_sequencing": [
            {"milestone": "Phase 1: Architecture", "order": "Week 1-2", "activities": "Design"}
        ],
        "risks_and_mitigations": [
            {"risk": "AWS quota limits", "mitigation": "Request limit increase early"}
        ],
        "unresolved_questions": [
            {
                "question": "Which AWS region is preferred for primary failover?",
                "category": "technical",
                "rationale": "Latency depends on region choice",
                "impact": "Architectural delay",
                "suggested_role": "Lead Architect"
            }
        ],
        "internal_review_warnings": []
    }

    with patch("backend.app.services.nvidia_llm.nvidia_service.generate_chat_completion") as mock_chat:
        mock_chat.return_value = (json.dumps(mock_llm_json), {"model": "meta/llama-3.3-70b-instruct", "total_tokens": 1200})

        gen_res = await client.post("/api/v1/proposals/generate", json={
            "project_id": project_id,
            "service_package_id": pkg_id
        }, headers=auth_headers_a)
        if gen_res.status_code != 201:
            print("GEN_RES ERROR:", gen_res.status_code, gen_res.text)
        assert gen_res.status_code == 201
        proposal = gen_res.json()
        assert proposal["title"] == "Apex Innovations Cloud Resiliency SOW"
        assert len(proposal["sections"]) >= 8
        assert len(proposal["questions"]) >= 1

        # Check commercial section matches trusted package ($42,000 USD)
        comm_sec = next(s for s in proposal["sections"] if s["section_key"] == "commercial_terms")
        assert "42,000.00" in comm_sec["content_markdown"]

        # 6. Test Optimistic Concurrency Locking on Section Edit
        exec_sec = next(s for s in proposal["sections"] if s["section_key"] == "executive_summary")
        
        # Valid edit with correct version_lock (1)
        up_res = await client.put(f"/api/v1/proposals/{proposal['id']}/sections/{exec_sec['id']}", json={
            "content_markdown": "Updated executive summary with consultant approved revisions.",
            "version_lock": exec_sec["version_lock"]
        }, headers=auth_headers_a)
        assert up_res.status_code == 200
        assert up_res.json()["version_lock"] == 2

        # Stale edit with old version_lock (1 instead of 2) -> 409 Conflict
        conflict_res = await client.put(f"/api/v1/proposals/{proposal['id']}/sections/{exec_sec['id']}", json={
            "content_markdown": "Conflicting concurrent edit.",
            "version_lock": 1
        }, headers=auth_headers_a)
        assert conflict_res.status_code == 409
        assert "modified by another session" in conflict_res.json()["detail"]

        # 7. Create Snapshot Version
        snap_res = await client.post(f"/api/v1/proposals/{proposal['id']}/versions?summary=Client+review+completed", headers=auth_headers_a)
        assert snap_res.status_code == 200
        assert snap_res.json()["version_number"] == 2
