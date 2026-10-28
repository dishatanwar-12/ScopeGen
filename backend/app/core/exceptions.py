from fastapi import HTTPException, status

class ProposalCraftException(HTTPException):
    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)

class CommercialIntegrityViolation(ProposalCraftException):
    def __init__(self, detail: str = "Commercial integrity violation detected. Prices or payment terms cannot be invented."):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

class PromptInjectionDetected(ProposalCraftException):
    def __init__(self, detail: str = "Security warning: Potential prompt injection or policy bypass detected in input documents."):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

class NvidiaServiceError(ProposalCraftException):
    def __init__(self, detail: str = "NVIDIA inference service failed. Please check network connectivity and credentials."):
        super().__init__(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail)

class ResourceNotFound(ProposalCraftException):
    def __init__(self, resource: str, resource_id: str):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=f"{resource} with ID '{resource_id}' was not found.")

class UnauthorizedAccess(ProposalCraftException):
    def __init__(self, detail: str = "You do not have permission to access or modify this resource."):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)

