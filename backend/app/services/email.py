"""
Email Service: Resend (primary) → Google SMTP (fallback)
"""
import smtplib
import logging
import resend
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger("commilk.email")


def _send_via_resend(to_email: str, subject: str, html: str) -> bool:
    if not settings.RESEND_API_KEY:
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
        return True
    except Exception as e:
        logger.warning(f"[Resend] Failed: {e}")
        return False


def _send_via_smtp(to_email: str, subject: str, html: str) -> bool:
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.debug("[SMTP] Skipped: credentials not configured")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"CommilK <{settings.SMTP_USER}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
        logger.info(f"[SMTP] Sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"[SMTP] Failed: {type(e).__name__}: {e}")
        return False


def send_email(to_email: str, subject: str, html: str) -> bool:
    """Try Resend first, fall back to SMTP."""
    if _send_via_resend(to_email, subject, html):
        logger.info(f"[Email] Sent via Resend to {to_email}")
        return True
    if _send_via_smtp(to_email, subject, html):
        logger.info(f"[Email] Sent via SMTP to {to_email}")
        return True
    logger.error(f"[Email] All providers failed for {to_email}")
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
