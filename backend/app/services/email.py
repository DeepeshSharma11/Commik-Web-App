"""
Email Service: Resend only
"""
import logging
import resend
from app.core.config import settings

logger = logging.getLogger("commilk.email")


def send_email(to_email: str, subject: str, html: str) -> bool:
    """Send email via Resend. Returns True on success."""
    if not settings.RESEND_API_KEY:
        logger.error("[Email] RESEND_API_KEY not configured")
        return False
    try:
        resend.api_key = settings.RESEND_API_KEY
        params: resend.Emails.SendParams = {
            "from": f"CommilK <{settings.EMAIL_FROM}>",
            "to": [to_email],
            "subject": subject,
            "html": html,
        }
        resend.Emails.send(params)
        logger.info(f"[Email] Sent via Resend to {to_email}")
        return True
    except Exception as e:
        error_msg = str(e)
        logger.warning(f"[Resend] Failed: {error_msg}")
        # Sandbox fallback: retry with onboarding@resend.dev if domain not verified
        if "not verified" in error_msg.lower() or "verify your domain" in error_msg.lower():
            try:
                logger.info("[Resend] Retrying with sandbox sender 'onboarding@resend.dev'")
                params["from"] = "CommilK <onboarding@resend.dev>"
                resend.Emails.send(params)
                logger.info(f"[Email] Sent via Resend sandbox to {to_email}")
                return True
            except Exception as retry_err:
                logger.warning(f"[Resend] Sandbox retry failed: {retry_err}")
        logger.error(f"[Email] Failed for {to_email}")
        return False


def send_password_reset_email(to_email: str, reset_token: str):
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;">
      <h2 style="color:#1d4ed8;">🐃 CommilK — Password Reset</h2>
      <p style="color:#475569;">You requested a password reset. Click the button below to set a new password.</p>
      <a href="{reset_url}" style="display:inline-block;margin-top:16px;padding:12px 28px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
        Reset My Password
      </a>
      <p style="margin-top:24px;font-size:12px;color:#94a3b8;">This link expires in 30 minutes. If you didn't request this, ignore the email.</p>
    </div>
    """
    return send_email(to_email, "Reset your CommilK password", html)
