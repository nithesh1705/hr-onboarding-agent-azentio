import logging
from typing import Optional, List, Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)

_vertex_initialized = False

def init_vertex_ai():
    global _vertex_initialized
    if _vertex_initialized:
        return
    try:
        import vertexai
        vertexai.init(project=settings.GCP_PROJECT_ID, location=settings.VERTEX_LOCATION)
        _vertex_initialized = True
        logger.info(f"Initialized Vertex AI with project={settings.GCP_PROJECT_ID}, location={settings.VERTEX_LOCATION}")
    except Exception as e:
        logger.warning(f"Could not initialize Vertex AI: {e}")

def call_vertex_gemini(system_prompt: str, user_prompt: str) -> Optional[str]:
    """
    Invokes Gemini on Google Cloud Vertex AI with prompt grounding.
    """
    init_vertex_ai()
    try:
        from vertexai.generative_models import GenerativeModel
        
        # Try configured model, fallback to 1.5-flash if model name is preview/custom
        candidate_models = [settings.VERTEX_GEMINI_MODEL, "gemini-1.5-flash", "gemini-2.0-flash-exp"]
        
        for model_name in candidate_models:
            try:
                model = GenerativeModel(
                    model_name=model_name,
                    system_instruction=[system_prompt]
                )
                response = model.generate_content(
                    user_prompt,
                    generation_config={
                        "temperature": 0.2,
                        "max_output_tokens": 1024,
                    }
                )
                if response and response.text:
                    return response.text
            except Exception as model_err:
                logger.warning(f"Vertex model {model_name} failed: {model_err}, trying next...")
                continue
                
    except Exception as e:
        logger.error(f"Vertex AI Gemini invocation error: {e}")
        
    return None

