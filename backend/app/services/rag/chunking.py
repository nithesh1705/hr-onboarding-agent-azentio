import hashlib
from typing import List, Dict, Any

def compute_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]

def chunk_sections(
    policy_code: str,
    policy_version: str,
    sections: List[Dict[str, Any]],
    target_words: int = 250,
    overlap_words: int = 40
) -> List[Dict[str, Any]]:
    """
    Chunks structured sections with heading prepended for embeddings.
    """
    chunks = []
    
    for sec_idx, sec in enumerate(sections):
        section_name = sec.get("section", "General")
        content = sec.get("content", "").strip()
        page = sec.get("page", 1)
        
        words = content.split()
        if not words:
            continue
            
        if len(words) <= target_words:
            chunk_text = content
            embed_text = f"Policy: {policy_code} | Section: {section_name}\n\n{chunk_text}"
            c_hash = compute_hash(chunk_text)
            chunk_id = f"{policy_code}:{policy_version}:sec{sec_idx}:c0"
            chunks.append({
                "chunk_id": chunk_id,
                "section": section_name,
                "page": page,
                "text": chunk_text,
                "embed_text": embed_text,
                "content_hash": c_hash,
                "token_count": len(words)
            })
        else:
            step = target_words - overlap_words
            c_idx = 0
            for i in range(0, len(words), step):
                chunk_slice = words[i:i + target_words]
                chunk_text = " ".join(chunk_slice)
                embed_text = f"Policy: {policy_code} | Section: {section_name}\n\n{chunk_text}"
                c_hash = compute_hash(chunk_text)
                chunk_id = f"{policy_code}:{policy_version}:sec{sec_idx}:c{c_idx}"
                chunks.append({
                    "chunk_id": chunk_id,
                    "section": section_name,
                    "page": page,
                    "text": chunk_text,
                    "embed_text": embed_text,
                    "content_hash": c_hash,
                    "token_count": len(chunk_slice)
                })
                c_idx += 1
                if i + target_words >= len(words):
                    break
                    
    return chunks

