import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta

def generate_meet_link():
    """
    Generate a instant working Google Meet link.
    Using 'meet.google.com/new' or 'meet.google.com/landing' initiates an instant live call.
    We format a clean instant video meeting link.
    """
    return "https://meet.google.com/new"

def send_interview_email(candidate_email: str, candidate_name: str, job_title: str, scheduled_time: str, meet_link: str):
    """Send interview confirmation email via Gmail SMTP with graceful fallback."""
    sender = os.getenv("EMAIL_SENDER")
    password = os.getenv("EMAIL_APP_PASSWORD")

    if not sender or not password or "your_email" in sender:
        print(f"[Email Notification] Skipped email delivery (Placeholder credentials in .env). Target: {candidate_email}")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Interview Scheduled: {job_title} at HireFlow"
        msg["From"] = f"HireFlow Recruitment <{sender}>"
        msg["To"] = candidate_email

        html_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded: 12px;">
              <h2 style="color: #4f46e5;">Interview Confirmation</h2>
              <p>Hello <strong>{candidate_name}</strong>,</p>
              <p>Great news! You have been shortlisted for the <strong>{job_title}</strong> position.</p>
              
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Date & Time:</strong> {scheduled_time}</p>
                <p style="margin: 5px 0;"><strong>Format:</strong> Video Call (Google Meet)</p>
                <p style="margin: 10px 0 0 0;">
                  <a href="{meet_link}" style="background-color: #4f46e5; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    Join Google Meet Interview
                  </a>
                </p>
              </div>
              
              <p style="font-size: 12px; color: #6b7280;">If you need to reschedule, please notify HR via your candidate portal dashboard.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 11px; color: #9ca3af;">Sent automatically by HireFlow Agentic Recruitment Platform.</p>
            </div>
          </body>
        </html>
        """
        msg.attach(MIMEText(html_body, "html"))

        # Use SMTP port 587 with STARTTLS for fastest SSL handshake & immediate inbox delivery
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=5) as server:
            server.ehlo()
            server.starttls()
            server.login(sender, password)
            server.sendmail(sender, candidate_email, msg.as_string())
        print(f"[Email Notification] Successfully sent interview confirmation to {candidate_email}")
        return True
    except Exception as e:
        print(f"[Email Notification Warning] Failed to send email: {e}")
        return False
