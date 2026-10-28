import json
import pytest
from unittest.mock import MagicMock, patch
from openai import RateLimitError, APIError
from backend.app.services.nvidia_llm import NvidiaLLMService
from backend.app.core.exceptions import NvidiaServiceError

def test_nvidia_client_missing_key_reports_status():
    service = NvidiaLLMService(api_key="", base_url="https://integrate.api.nvidia.com/v1")
    health = service.check_health()
    assert health["configured"] is False
    assert health["status"] == "unconfigured"

def test_nvidia_chat_completion_mock_success():
    service = NvidiaLLMService(api_key="nvapi-mock-key-123", max_retries=2)

    mock_response = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps({
        "proposal_title": "AI SOW Proposal",
        "executive_summary": "Summary text",
        "client_background": "Background",
        "business_problem": "Problem",
        "objectives_and_outcomes": "Outcomes",
        "proposed_solution": "Solution",
        "in_scope_deliverables": [
            {"name": "Architecture Doc", "description": "Spec", "acceptance_criteria": "Signoff"}
        ],
        "out_of_scope_exclusions": ["No hardware support"],
        "assumptions": ["Client provides credentials"],
        "dependencies": ["DNS records"],
        "client_responsibilities": ["Attend weekly syncs"],
        "milestones_and_sequencing": [
            {"milestone": "Phase 1", "order": "1", "activities": "Setup"}
        ],
        "risks_and_mitigations": [
            {"risk": "Data delay", "mitigation": "Buffer period"}
        ],
        "unresolved_questions": [
            {
                "question": "What is the confirmed cutoff date?",
                "category": "timeline",
                "rationale": "Timeline unclear",
                "impact": "Milestone shift",
                "suggested_role": "PM"
            }
        ],
        "internal_review_warnings": []
    })
    mock_response.choices = [mock_choice]
    mock_response.usage.prompt_tokens = 500
    mock_response.usage.completion_tokens = 600
    mock_response.usage.total_tokens = 1100

    with patch.object(service, '_get_client') as mock_get_client:
        mock_client_instance = MagicMock()
        mock_client_instance.chat.completions.create.return_value = mock_response
        mock_get_client.return_value = mock_client_instance

        proposal_model, meta = service.generate_structured_proposal("sys prompt", "user prompt")
        assert proposal_model.proposal_title == "AI SOW Proposal"
        assert len(proposal_model.in_scope_deliverables) == 1
        assert meta["total_tokens"] == 1100

def test_nvidia_rate_limit_retry():
    service = NvidiaLLMService(api_key="nvapi-mock-key-123", max_retries=2)

    with patch.object(service, '_get_client') as mock_get_client:
        mock_client_instance = MagicMock()
        mock_client_instance.chat.completions.create.side_effect = RateLimitError(
            message="Rate limit exceeded",
            response=MagicMock(status_code=429),
            body=None
        )
        mock_get_client.return_value = mock_client_instance

        with pytest.raises(NvidiaServiceError) as exc_info:
            service.generate_chat_completion("sys", "user")

        assert "Failed to complete proposal generation after 2 attempts" in str(exc_info.value)
