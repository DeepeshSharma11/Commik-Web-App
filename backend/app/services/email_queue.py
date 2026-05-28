"""
Async Email Queue — asyncio-based, no external deps (no Redis/Celery)
- Emails are enqueued and processed by a background worker
- Max queue size: 500 (drops oldest if full)
- Retry: 2 retries per email with 5s delay
"""
import asyncio
import logging
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger("email_queue")

@dataclass
class EmailJob:
    to_email: str
    subject: str
    html: str
    retries: int = 0

MAX_RETRIES = 2
RETRY_DELAY = 5  # seconds
MAX_QUEUE_SIZE = 500

# Global queue instance
_queue: asyncio.Queue = asyncio.Queue(maxsize=MAX_QUEUE_SIZE)
_worker_task: Optional[asyncio.Task] = None


async def _worker():
    """Background worker: processes emails serially."""
    from app.services.email import send_email
    logger.info("[EmailQueue] Worker started")

    while True:
        job: EmailJob = await _queue.get()
        try:
            logger.info(f"[EmailQueue] Sending to={job.to_email} (attempt {job.retries + 1})")
            sent = await asyncio.to_thread(send_email, job.to_email, job.subject, job.html)
            if sent:
                logger.info(f"[EmailQueue] SUCCESS → {job.to_email}")
            else:
                raise RuntimeError("All email providers failed")
        except Exception as e:
            logger.warning(f"[EmailQueue] FAILED → {job.to_email}: {e}")
            if job.retries < MAX_RETRIES:
                job.retries += 1
                logger.info(f"[EmailQueue] Retrying in {RETRY_DELAY}s (attempt {job.retries + 1})")
                await asyncio.sleep(RETRY_DELAY)
                await _queue.put(job)
            else:
                logger.error(f"[EmailQueue] Gave up on {job.to_email} after {MAX_RETRIES} retries")
        finally:
            _queue.task_done()


async def start_worker():
    """Call on FastAPI startup."""
    global _worker_task
    _worker_task = asyncio.create_task(_worker())
    logger.info("[EmailQueue] Worker task created")


async def stop_worker():
    """Call on FastAPI shutdown — drains queue gracefully."""
    global _worker_task
    if _worker_task:
        logger.info("[EmailQueue] Draining queue before shutdown...")
        await _queue.join()
        _worker_task.cancel()
        logger.info("[EmailQueue] Worker stopped")


async def enqueue_email(to_email: str, subject: str, html: str):
    """
    Non-blocking: add email to queue and return immediately.
    Drops silently if queue is full (prevents crash under load).
    """
    job = EmailJob(to_email=to_email, subject=subject, html=html)
    try:
        _queue.put_nowait(job)
        logger.info(f"[EmailQueue] Queued email for {to_email} (queue size: {_queue.qsize()})")
    except asyncio.QueueFull:
        logger.error(f"[EmailQueue] Queue full! Dropped email to {to_email}")


async def enqueue_password_reset(to_email: str, reset_token: str):
    """Convenience wrapper for password reset emails."""
    from app.core.config import settings
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;">
      <h2 style="color:#1d4ed8;">🐃 CommilK — Password Reset</h2>
      <p style="color:#475569;">You requested a password reset. Click the button below to set a new password.</p>
      <a href="{reset_url}" style="display:inline-block;margin-top:16px;padding:12px 28px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
        Reset My Password
      </a>
      <p style="margin-top:24px;font-size:12px;color:#94a3b8;">This link expires in 30 minutes. If you didn't request this, ignore the email.</p>
      <hr style="margin-top:24px;border-color:#e2e8f0;" />
      <p style="font-size:11px;color:#cbd5e1;">Sent by CommilK Dairy Management System</p>
    </div>
    """
    await enqueue_email(to_email, "Reset your CommilK password", html)


async def enqueue_signup_otp(to_email: str, otp: str):
    """Convenience wrapper for signup verification OTP emails."""
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;">
      <h2 style="color:#10b981;">🐃 CommilK — Email Verification</h2>
      <p style="color:#475569;">Welcome to CommilK! Please verify your email address to complete your registration.</p>
      <div style="margin:24px 0;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;text-align:center;">
        <span style="font-size:32px;font-weight:800;letter-spacing:6px;color:#0f766e;">{otp}</span>
      </div>
      <p style="font-size:12px;color:#94a3b8;">This OTP is valid for 10 minutes. If you did not sign up for an account, please ignore this email.</p>
      <hr style="margin-top:24px;border-color:#e2e8f0;" />
      <p style="font-size:11px;color:#cbd5e1;">Sent by CommilK Dairy Management System</p>
    </div>
    """
    await enqueue_email(to_email, "Verify your CommilK Account", html)

