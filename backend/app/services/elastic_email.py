import logging
import json
import urllib.request
import ssl
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.config import settings

logger = logging.getLogger(__name__)

def send_elastic_connector_email(
    to_email: str,
    subject: str,
    message: str,
    connector_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Sends an email using Elasticsearch / Kibana Actions & Connectors execute API.
    Uses connector ID and ApiKey from environment settings.
    """
    cid = connector_id or settings.ELASTIC_EMAIL_CONNECTOR_ID
    kibana_url = settings.ELASTIC_KIBANA_URL.rstrip("/")
    api_key = settings.ELASTIC_API_KEY
    
    endpoint = f"{kibana_url}/api/actions/connector/{cid}/_execute"
    
    headers = {
        "Authorization": f"ApiKey {api_key}",
        "kbn-xsrf": "true",
        "Content-Type": "application/json"
    }
    
    payload = {
        "params": {
            "to": [to_email],
            "subject": subject,
            "message": message
        }
    }
    
    data = json.dumps(payload).encode("utf-8")
    ctx = ssl.create_default_context()
    
    logger.info(f"Dispatching Elastic Email Connector [{cid}] to {to_email} with subject: '{subject}'")
    
    try:
        req = urllib.request.Request(endpoint, data=data, headers=headers, method="POST")
        with urllib.request.urlopen(req, context=ctx, timeout=15) as res:
            resp_body = res.read().decode("utf-8")
            resp_data = json.loads(resp_body) if resp_body else {}
            logger.info(f"Elastic Email Connector successful: {resp_data}")
            return {
                "status": "success",
                "connector_id": cid,
                "recipient": to_email,
                "message_id": resp_data.get("data", {}).get("messageId") or resp_data.get("status"),
                "raw": resp_data
            }
    except urllib.error.HTTPError as he:
        err_msg = he.read().decode("utf-8", errors="ignore")
        logger.error(f"Elastic Email Connector HTTP error {he.code}: {err_msg}")
        raise RuntimeError(f"Elastic Connector error ({he.code}): {err_msg}")
    except Exception as e:
        logger.error(f"Failed to execute Elastic Email Connector: {e}")
        raise e

def generate_joiner_email_templates(
    joiner_name: str,
    role: str,
    department: str,
    location: str,
    joining_date: str,
    pending_docs: List[str] = None,
    correction_docs: List[str] = None,
    pending_policies: List[str] = None
) -> List[Dict[str, Any]]:
    """
    Generates intelligent, pre-filled follow-up email templates personalized for a joiner.
    """
    pending_docs = pending_docs or ["Government Photo ID (PAN / Passport)", "Degree Certificate"]
    pending_doc_str = "\n".join([f"  • {d}" for d in pending_docs])
    
    correction_doc_str = "\n".join([f"  • {d}" for d in (correction_docs or ["Identity Proof"])])
    
    policies_str = "\n".join([f"  • {p}" for p in (pending_policies or ["SEC-POL-001 Information Security Policy"])])
    
    templates = [
        {
            "id": "doc_reminder",
            "name": "Document Submission Reminder",
            "category": "Documentation",
            "subject": f"Action Required: Complete Document Submission for {joiner_name} ({role})",
            "message": f"""Dear {joiner_name},

We are excited to welcome you to our {department} team as {role} starting on {joining_date}!

As part of our pre-onboarding compliance requirements, please ensure you submit the following outstanding documents through your Onboarding Portal:

{pending_doc_str}

Please upload these documents before {joining_date} to ensure timely background verification and account provisioning.

Access your portal: https://hr-onboarding-frontend-621277707617.us-east1.run.app/me

If you have any questions or require extensions, please reply to this email.

Warm regards,
People & Culture Operations Team
Aurelia Technologies"""
        },
        {
            "id": "doc_correction",
            "name": "Document Correction Notice",
            "category": "Verification",
            "subject": f"Action Required: Re-upload Document for Verification - {joiner_name}",
            "message": f"""Dear {joiner_name},

During the review of your onboarding documents, our verification team identified an item that requires your attention:

{correction_doc_str}

Reason / Feedback:
Please ensure the re-uploaded copy is fully clear, uncropped, shows all 4 corners, and matches the legal name on your offer letter.

Please log in to your Onboarding Portal and upload the updated document under the Documents tab:
https://hr-onboarding-frontend-621277707617.us-east1.run.app/me

Thank you for your prompt cooperation.

Sincerely,
HR Review & Verification Desk
Aurelia Technologies"""
        },
        {
            "id": "policy_ack",
            "name": "Policy Acknowledgement Follow-Up",
            "category": "Compliance",
            "subject": f"Reminder: Mandatory Policy Sign-Off for {joiner_name}",
            "message": f"""Dear {joiner_name},

Before your first day on {joining_date}, company compliance policies must be reviewed and electronically acknowledged:

{policies_str}

Please complete these acknowledgements by visiting the Policies section in your portal:
https://hr-onboarding-frontend-621277707617.us-east1.run.app/me

Best regards,
Information Security & Compliance Desk
Aurelia Technologies"""
        },
        {
            "id": "day1_welcome",
            "name": "Day 1 Office Arrival & Orientation Guide",
            "category": "First Day",
            "subject": f"Welcome to the Team, {joiner_name}! Day 1 Arrival & Orientation Details",
            "message": f"""Dear {joiner_name},

Your first day at Aurelia Technologies is coming up on {joining_date}!

Arrival Logistics:
• Office Location: {location} Campus (Reception Floor 3)
• Reporting Time: 9:30 AM IST
• What to Bring: Government Photo ID for security building pass
• IT Equipment: Your engineering laptop & access badge will be handed over during IT induction at 11:00 AM.

Please review your Day 1 schedule in the portal:
https://hr-onboarding-frontend-621277707617.us-east1.run.app/me

We look forward to meeting you!

Warm regards,
People Operations & Workplace Experience
Aurelia Technologies"""
        },
        {
            "id": "custom",
            "name": "Custom Follow-Up Email",
            "category": "Custom",
            "subject": f"Follow-up regarding your onboarding with Aurelia - {joiner_name}",
            "message": f"""Dear {joiner_name},

I hope you are doing well.

I am reaching out regarding your upcoming joining as {role} on {joining_date}. 

[Enter your custom message here]

Please let us know if you need any assistance prior to your joining date.

Best regards,
People & Culture Team"""
        }
    ]
    return templates

