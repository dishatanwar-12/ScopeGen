import os
import re
import io
from typing import Tuple, List
from pypdf import PdfReader
import docx

# Potential prompt injection pattern heuristics
INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions",
    r"you\s+are\s+now\s+in\s+developer\s+mode",
    r"system\s*prompt\s*override",
    r"reveal\s+(the\s+)?(system|hidden|internal)\s+(prompt|key|token)",
    r"set\s+price\s+to\s+0",
    r"bypass\s+commercial\s+rules",
    r"free\s+of\s+charge",
]

def sanitize_text(raw_text: str) -> Tuple[str, List[str]]:
    """
    Sanitize text extracted from uploaded documents and discovery notes.
    Neutralizes attempt markers and flags security warnings without dropping valid domain text.
    """
    warnings = []
    sanitized = raw_text

    for pattern in INJECTION_PATTERNS:
        matches = re.findall(pattern, sanitized, re.IGNORECASE)
        if matches:
            warnings.append(f"Security Alert: Suspected prompt injection or policy override attempt detected: '{pattern}'")
            # Defang the pattern by wrapping it in quote tags
            sanitized = re.sub(pattern, "[UNTRUSTED INSTRUCTION DEFANGED]", sanitized, flags=re.IGNORECASE)

    # Normalize excessive whitespaces and control characters
    sanitized = re.sub(r'[\r\f\v]', '\n', sanitized)
    sanitized = re.sub(r'\n{3,}', '\n\n', sanitized)
    sanitized = sanitized.strip()

    return sanitized, warnings

def extract_text_from_file(file_bytes: bytes, filename: str) -> Tuple[str, str, List[str]]:
    """
    Extracts text from TXT, PDF, and DOCX files safely.
    Returns: (raw_extracted_text, sanitized_text, warnings)
    """
    ext = filename.lower().split('.')[-1]
    raw_text = ""
    warnings = []

    if ext == "txt":
        try:
            raw_text = file_bytes.decode('utf-8', errors='replace')
        except Exception as e:
            warnings.append(f"TXT decode warning: {str(e)}")
            raw_text = file_bytes.decode('latin-1', errors='replace')

    elif ext == "pdf":
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            extracted_pages = []
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                if page_text.strip():
                    extracted_pages.append(f"--- Page {i+1} ---\n{page_text}")
            
            if not extracted_pages:
                warnings.append("Notice: No selectable text found in PDF. Scanned or image-only PDFs require OCR preprocessing.")
                raw_text = "[Notice: Scanned or image-only PDF with no machine-readable text found.]"
            else:
                raw_text = "\n\n".join(extracted_pages)
        except Exception as e:
            warnings.append(f"Failed to read PDF structure: {str(e)}")
            raw_text = f"[Error reading PDF: {str(e)}]"

    elif ext == "docx":
        try:
            doc = docx.Document(io.BytesIO(file_bytes))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            tables_text = []
            for table in doc.tables:
                for row in table.rows:
                    row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                    if row_cells:
                        tables_text.append(" | ".join(row_cells))
            
            combined = paragraphs
            if tables_text:
                combined.append("\n--- Tables Content ---\n" + "\n".join(tables_text))
            raw_text = "\n\n".join(combined)
        except Exception as e:
            warnings.append(f"Failed to read DOCX structure: {str(e)}")
            raw_text = f"[Error reading DOCX: {str(e)}]"

    else:
        raise ValueError(f"Unsupported file extension: .{ext}")

    sanitized_text, safety_warnings = sanitize_text(raw_text)
    warnings.extend(safety_warnings)

    return raw_text, sanitized_text, warnings
