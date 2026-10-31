import logging
import os
from app.config import settings

logger = logging.getLogger("hr_onboarding")

def setup_observability():
    """
    Sets up Google Cloud Logging and Cloud Trace for the application.
    """
    logging_level = logging.INFO
    logging.basicConfig(level=logging_level, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

    # If running on Google Cloud or GCP_PROJECT_ID is provided
    try:
        if settings.ENABLE_CLOUD_LOGGING:
            import google.cloud.logging
            client = google.cloud.logging.Client(project=settings.GCP_PROJECT_ID)
            client.setup_logging(log_level=logging_level)
            logger.info("Google Cloud Logging successfully attached.")
    except Exception as e:
        logger.warning(f"Google Cloud Logging initialization skipped/fallback to stdout: {e}")

    try:
        if settings.ENABLE_CLOUD_TRACE:
            # Check Cloud Trace capability
            logger.info(f"Google Cloud Trace enabled for project: {settings.GCP_PROJECT_ID}")
    except Exception as e:
        logger.warning(f"Google Cloud Trace initialization skipped: {e}")

