import re
import os
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

def parse_markdown(text: str) -> List[Dict[str, Any]]:
    """
    Parses Markdown text into structured sections.
    Preserves section headings and hierarchy.
    """
    lines = text.split("\n")
    sections = []
    current_heading = "Overview"
    current_lines = []
    
    heading_pattern = re.compile(r"^(#{1,4})\s+(.+)$")
    
    for line in lines:
        match = heading_pattern.match(line.strip())
        if match:
            if current_lines:
                content = "\n".join(current_lines).strip()
                if content:
                    sections.append({
                        "section": current_heading,
                        "content": content,
                        "page": 1
                    })
                current_lines = []
            current_heading = match.group(2).strip()
        else:
            current_lines.append(line)
            
    if current_lines:
        content = "\n".join(current_lines).strip()
        if content:
            sections.append({
                "section": current_heading,
                "content": content,
                "page": 1
            })
            
    return sections

def parse_pdf(file_input: Any) -> List[Dict[str, Any]]:
    """Parse PDF file path or bytes with page tracking."""
    try:
        from pypdf import PdfReader
        import io
        if isinstance(file_input, bytes):
            reader = PdfReader(io.BytesIO(file_input))
        else:
            reader = PdfReader(file_input)
        sections = []
        for idx, page in enumerate(reader.pages):
            text = page.extract_text()
            if text and text.strip():
                # Split page text into markdown-like sections or whole page
                page_sections = parse_markdown(text)
                for sec in page_sections:
                    sec["page"] = idx + 1
                    sections.append(sec)
        return sections
    except Exception as e:
        logger.error(f"Error parsing PDF: {e}")
        return []

def parse_docx(file_path: str) -> List[Dict[str, Any]]:
    """Parse DOCX file using python-docx."""
    try:
        import docx
        doc = docx.Document(file_path)
        sections = []
        current_heading = "Overview"
        current_paras = []
        
        for p in doc.paragraphs:
            text = p.text.strip()
            if not text:
                continue
            if p.style and p.style.name and p.style.name.startswith("Heading"):
                if current_paras:
                    sections.append({
                        "section": current_heading,
                        "content": "\n".join(current_paras),
                        "page": 1
                    })
                    current_paras = []
                current_heading = text
            else:
                current_paras.append(text)
                
        if current_paras:
            sections.append({
                "section": current_heading,
                "content": "\n".join(current_paras),
                "page": 1
            })
        return sections
    except Exception as e:
        logger.error(f"Error parsing DOCX {file_path}: {e}")
        return []

def parse_document(file_path: str = "", raw_content: str = None, raw_bytes: bytes = None, filename: str = "") -> List[Dict[str, Any]]:
    """Generic parser based on extension, raw text, or raw bytes."""
    if raw_content:
        return parse_markdown(raw_content)
        
    name = filename or file_path
    ext = os.path.splitext(name)[1].lower()
    
    if raw_bytes is not None:
        if ext == ".pdf":
            return parse_pdf(raw_bytes)
        else:
            return parse_markdown(raw_bytes.decode("utf-8", errors="ignore"))
            
    if not file_path:
        return []
        
    if ext in [".md", ".txt"]:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return parse_markdown(f.read())
    elif ext == ".pdf":
        return parse_pdf(file_path)
    elif ext in [".docx", ".doc"]:
        return parse_docx(file_path)
    else:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return parse_markdown(f.read())

