"""Gmail SMTP 발송 (무료, 앱 비밀번호 사용)."""

from __future__ import annotations

import smtplib
import ssl
from email.message import EmailMessage

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 465


def send(*, user: str, app_password: str, to: str, subject: str, text: str, html: str) -> None:
    """실패하면 예외를 그대로 올린다. 호출 쪽은 성공했을 때만 state를 갱신한다."""
    msg = EmailMessage()
    msg["From"] = user
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(text)
    msg.add_alternative(html, subtype="html")
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=ssl.create_default_context(), timeout=30) as smtp:
        smtp.login(user, app_password.replace(" ", ""))
        refused = smtp.send_message(msg)
    if refused:
        raise smtplib.SMTPRecipientsRefused(refused)
