import json
import logging
import time
import httpx
from typing import Dict, Any, Optional, Tuple
from openai import OpenAI, APIError, RateLimitError, APITimeoutError
from backend.app.core.config import settings
from backend.app.core.exceptions import NvidiaServiceError
from backend.app.schemas.proposal import GeneratedProposalModel

logger = logging.getLogger(__name__)

class NvidiaLLMService:
    """
    Dedicated client for real NVIDIA NIM hosted inference.
    Communicates via OpenAI-compatible API at https://integrate.api.nvidia.com/v1.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        timeout: Optional[int] = None,
        max_retries: Optional[int] = None
    ):
        self.api_key = api_key or settings.NVIDIA_API_KEY
        self.base_url = base_url or settings.NVIDIA_BASE_URL
        self.model = model or settings.NVIDIA_MODEL
        self.timeout = timeout or settings.NVIDIA_TIMEOUT_SECONDS
        self.max_retries = max_retries or settings.NVIDIA_MAX_RETRIES

    def _get_client(self) -> OpenAI:
        """Instantiate official OpenAI client pointed to NVIDIA NIM."""
        if not self.api_key:
            raise NvidiaServiceError(
                "NVIDIA API Key is missing. Please set NVIDIA_API_KEY in your environment (.env) to enable AI drafting."
            )
        return OpenAI(
            base_url=self.base_url,
            api_key=self.api_key,
            timeout=float(self.timeout)
        )

    def check_health(self) -> Dict[str, Any]:
        """
        Verify connectivity and authentication with NVIDIA NIM without exposing the secret key.
        """
        if not self.api_key:
            return {
                "configured": False,
                "status": "unconfigured",
                "model": self.model,
                "base_url": self.base_url,
                "message": "NVIDIA_API_KEY is not configured in backend environment."
            }

        try:
            # Query models endpoint to test token validity
            client = self._get_client()
            models_page = client.models.list()
            available_models = [m.id for m in models_page.data][:10]
            return {
                "configured": True,
                "status": "connected",
                "model": self.model,
                "base_url": self.base_url,
                "sample_available_models": available_models,
                "message": "Successfully verified connectivity with NVIDIA NIM API Catalog."
            }
        except RateLimitError as e:
            return {
                "configured": True,
                "status": "rate_limited",
                "model": self.model,
                "message": f"NVIDIA NIM Rate Limit reached: {str(e)}"
            }
        except APIError as e:
            return {
                "configured": True,
                "status": "auth_error",
                "model": self.model,
                "message": f"NVIDIA NIM API error: {e.message or str(e)}"
            }
        except Exception as e:
            return {
                "configured": True,
                "status": "error",
                "model": self.model,
                "message": f"Connection check failed: {str(e)}"
            }

    def generate_chat_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        json_mode: bool = True
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Executes a real chat completion against NVIDIA NIM with automatic retries,
        exponential backoff, and latency tracking.
        """
        client = self._get_client()
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        attempt = 0
        last_error = None
        start_time = time.time()

        while attempt < self.max_retries:
            attempt += 1
            try:
                kwargs: Dict[str, Any] = {
                    "model": self.model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": 4096,
                }
                if json_mode:
                    kwargs["response_format"] = {"type": "json_object"}

                response = client.chat.completions.create(**kwargs)
                latency_ms = int((time.time() - start_time) * 1000)

                raw_content = response.choices[0].message.content or ""
                metadata = {
                    "model": self.model,
                    "latency_ms": latency_ms,
                    "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                    "completion_tokens": response.usage.completion_tokens if response.usage else 0,
                    "total_tokens": response.usage.total_tokens if response.usage else 0,
                    "attempts": attempt
                }
                return raw_content, metadata

            except RateLimitError as e:
                last_error = e
                wait_time = 2 ** attempt
                logger.warning(f"NVIDIA rate limit on attempt {attempt}. Retrying in {wait_time}s...")
                time.sleep(wait_time)
            except APITimeoutError as e:
                last_error = e
                wait_time = 2 ** attempt
                logger.warning(f"NVIDIA timeout on attempt {attempt}. Retrying in {wait_time}s...")
                time.sleep(wait_time)
            except APIError as e:
                # Terminal API error, e.g. 401 unauthorized or invalid model
                logger.error(f"NVIDIA API Error: {str(e)}")
                raise NvidiaServiceError(f"NVIDIA NIM rejected request: {e.message or str(e)}")
            except Exception as e:
                last_error = e
                wait_time = 1.5 ** attempt
                logger.warning(f"Unexpected error calling NVIDIA NIM on attempt {attempt}: {str(e)}")
                time.sleep(wait_time)

        raise NvidiaServiceError(
            f"Failed to complete proposal generation after {self.max_retries} attempts: {str(last_error)}"
        )

    def generate_structured_proposal(
        self,
        system_prompt: str,
        user_prompt: str
    ) -> Tuple[GeneratedProposalModel, Dict[str, Any]]:
        """
        Generates and parses a strictly validated structured proposal.
        """
        raw_text, metadata = self.generate_chat_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.2,
            json_mode=True
        )

        try:
            # Parse JSON
            parsed_data = json.loads(raw_text)
            validated_proposal = GeneratedProposalModel.model_validate(parsed_data)
            return validated_proposal, metadata
        except (json.JSONDecodeError, Exception) as parse_err:
            logger.warning(f"First JSON parse attempt failed: {str(parse_err)}. Attempting regex markdown extraction...")
            # Attempt to extract JSON from markdown fence ```json ... ```
            import re
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', raw_text, re.DOTALL)
            if json_match:
                try:
                    parsed_data = json.loads(json_match.group(1))
                    validated_proposal = GeneratedProposalModel.model_validate(parsed_data)
                    return validated_proposal, metadata
                except Exception as inner_err:
                    raise NvidiaServiceError(
                        f"NVIDIA NIM returned unparseable proposal structure: {str(inner_err)}"
                    )
            raise NvidiaServiceError(
                f"NVIDIA model output did not adhere to required proposal schema: {str(parse_err)}"
            )

nvidia_service = NvidiaLLMService()
