import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Optional

from jinja2 import Environment, FileSystemLoader

from app.config.settings import settings
from app.core.logging_config import security_logger

# Setup Jinja2 for email templates
template_dir = Path(__file__).parent.parent / "templates" / "emails"
template_dir.mkdir(parents=True, exist_ok=True)
jinja_env = Environment(loader=FileSystemLoader(str(template_dir)))


class EmailService:
    """Reusable email service for all email operations"""

    @staticmethod
    def send_email(to_email: str, subject: str, html_content: str, text_content: Optional[str] = None) -> bool:

        try:
            msg = MIMEMultipart("alternative")
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            msg["To"] = to_email
            msg["Subject"] = subject

            # Add plain text version (fallback)
            if text_content:
                part1 = MIMEText(text_content, "plain")
                msg.attach(part1)

            # Add HTML version
            part2 = MIMEText(html_content, "html")
            msg.attach(part2)

            # Send email
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)

            security_logger.info(f"Email sent successfully to {to_email}")
            return True

        except Exception as e:
            security_logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False

    @staticmethod
    def send_team_invitation(
        to_email: str,
        inviter_name: str,
        project_name: str,
        role: str,
        token: str,
        frontend_url: str = "http://localhost:5173",
        expires_days: int = 7,
    ) -> bool:
        """Send team invitation email"""
        try:
            template = jinja_env.get_template("team_invitation.html")
        except Exception:
            # Fallback to simple HTML if template not found
            html_content = EmailService._get_fallback_invitation_html(
                inviter_name, project_name, role, token, frontend_url, expires_days
            )
        else:
            accept_url = f"{frontend_url}/invitations/accept?token={token}"
            decline_url = f"{frontend_url}/invitations/decline?token={token}"

            html_content = template.render(
                inviter_name=inviter_name,
                project_name=project_name,
                role=role,
                accept_url=accept_url,
                decline_url=decline_url,
                expires_days=expires_days,
            )

        subject = f"{inviter_name} invited you to join {project_name}"

        return EmailService.send_email(to_email, subject, html_content)

    @staticmethod
    def send_password_reset(
        to_email: str,
        username: str,
        reset_token: str,
        frontend_url: str = "http://localhost:3000",
        expires_minutes: int = 30,
    ) -> bool:
        """Send password reset email"""
        try:
            template = jinja_env.get_template("password_reset.html")
        except Exception:
            html_content = EmailService._get_fallback_password_reset_html(
                username, reset_token, frontend_url, expires_minutes
            )
        else:
            reset_url = f"{frontend_url}/reset-password?token={reset_token}"

            html_content = template.render(username=username, reset_url=reset_url, expires_minutes=expires_minutes)

        subject = "Reset Your Password - CodeReview"

        return EmailService.send_email(to_email, subject, html_content)

    @staticmethod
    def send_password_reset_code(
        to_email: str,
        username: str,
        code: str,
        expires_minutes: int = 15,
    ) -> bool:
        """Send password reset code email (6-digit code)"""
        try:
            template = jinja_env.get_template("password_reset.html")
            html_content = template.render(username=username, code=code, expires_minutes=expires_minutes)
        except Exception:
            html_content = EmailService._get_fallback_password_reset_code_html(username, code, expires_minutes)

        text_content = f"""
Hi {username},

We received a request to reset your password.

Your reset code is: {code}

This code will expire in {expires_minutes} minutes.

If you didn't request a password reset, you can safely ignore this email.

- The Reviewly Team
        """

        subject = "Reset Your Password - Reviewly"

        return EmailService.send_email(to_email, subject, html_content, text_content)

    @staticmethod
    def send_email_verification(
        to_email: str, username: str, verification_token: str, frontend_url: str = "http://localhost:3000"
    ) -> bool:
        """Send email verification"""
        try:
            template = jinja_env.get_template("email_verification.html")
        except Exception:
            html_content = EmailService._get_fallback_verification_html(username, verification_token, frontend_url)
        else:
            verify_url = f"{frontend_url}/verify-email?token={verification_token}"

            html_content = template.render(username=username, verify_url=verify_url)

        subject = "Verify Your Email Address - CodeReview"

        return EmailService.send_email(to_email, subject, html_content)

    @staticmethod
    def send_welcome_email(to_email: str, username: str, frontend_url: str = "http://localhost:3000") -> bool:
        """Send welcome email after registration"""
        try:
            template = jinja_env.get_template("welcome.html")
        except Exception:
            html_content = EmailService._get_fallback_welcome_html(username, frontend_url)
        else:
            html_content = template.render(username=username, dashboard_url=f"{frontend_url}/dashboard")

        subject = "Welcome to CodeReview! 🎉"

        return EmailService.send_email(to_email, subject, html_content)

    # Fallback HTML methods (if templates don't exist)
    @staticmethod
    def _get_fallback_invitation_html(inviter_name, project_name, role, token, frontend_url, expires_days):
        return f"""
        <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>Team Invitation</h2>
            <p><strong>{inviter_name}</strong> invited you to join <strong>{project_name}</strong> as a
               <strong>{role}</strong>.</p>
            <p><a href="{frontend_url}/invitations/accept?token={token}">Accept Invitation</a></p>
            <p><a href="{frontend_url}/invitations/decline?token={token}">Decline</a></p>
            <p style="color: red;">Expires in {expires_days} days</p>
        </body>
        </html>
        """

    @staticmethod
    def _get_fallback_password_reset_html(username, reset_token, frontend_url, expires_minutes):
        return f"""
        <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>Reset Your Password</h2>
            <p>Hi {username},</p>
            <p><a href="{frontend_url}/reset-password?token={reset_token}">Reset Password</a></p>
            <p style="color: red;">Expires in {expires_minutes} minutes</p>
        </body>
        </html>
        """

    @staticmethod
    def _get_fallback_password_reset_code_html(username, code, expires_minutes):
        return f"""
        <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>Reset Your Password</h2>
            <p>Hi {username},</p>
            <p>Your password reset code is:</p>
            <h1 style="letter-spacing: 8px; color: #6366f1;">{code}</h1>
            <p style="color: #f59e0b;">Expires in {expires_minutes} minutes</p>
        </body>
        </html>
        """

    @staticmethod
    def _get_fallback_verification_html(username, verification_token, frontend_url):
        return f"""
        <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>Verify Your Email</h2>
            <p>Hi {username},</p>
            <p><a href="{frontend_url}/verify-email?token={verification_token}">Verify Email</a></p>
        </body>
        </html>
        """

    @staticmethod
    def _get_fallback_welcome_html(username, frontend_url):
        return f"""
        <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>Welcome to CodeReview!</h2>
            <p>Hi {username},</p>
            <p>Thanks for joining us!</p>
            <p><a href="{frontend_url}/dashboard">Go to Dashboard</a></p>
        </body>
        </html>
        """


# Singleton instance
email_service = EmailService()
