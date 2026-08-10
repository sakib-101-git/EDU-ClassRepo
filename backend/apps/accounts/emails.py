"""OTP verification email, sent in a background thread so requests stay fast."""
import logging
import threading

from django.conf import settings
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger(__name__)

OTP_HTML = """\
<div style="background:#f6f3f1;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;
              border:1px solid #e8e0dc;">
    <div style="background:#5d1725;padding:24px;text-align:center;">
      <span style="color:#ffffff;font-size:20px;font-weight:bold;">EDU <span style="color:#d4a643;">ClassRepo</span></span>
    </div>
    <div style="padding:32px 28px;color:#3a2e2a;">
      <p style="margin:0 0 8px;font-size:16px;font-weight:bold;">Verify your email</p>
      <p style="margin:0 0 24px;font-size:14px;color:#6b5d57;">
        Use this code to finish creating your EDU ClassRepo account. It expires in {ttl} minutes.
      </p>
      <div style="background:#f6f3f1;border-radius:8px;padding:18px;text-align:center;
                  font-size:32px;font-weight:bold;letter-spacing:8px;color:#5d1725;">{otp}</div>
      <p style="margin:24px 0 0;font-size:12px;color:#9b8d87;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  </div>
</div>
"""


def send_otp_email(to_email, otp):
    """Fire-and-forget, like the old backend's @Async email sender."""
    threading.Thread(target=_send, args=(to_email, otp), daemon=True).start()


def _send(to_email, otp):
    try:
        message = EmailMultiAlternatives(
            subject=f"{otp} is your EDU ClassRepo verification code",
            body=f"Your EDU ClassRepo verification code is {otp}. "
                 f"It expires in {settings.OTP_TTL_MINUTES} minutes.",
            to=[to_email],
        )
        message.attach_alternative(OTP_HTML.format(otp=otp, ttl=settings.OTP_TTL_MINUTES), "text/html")
        message.send()
    except Exception:
        logger.exception("Failed to send OTP email to %s", to_email)
