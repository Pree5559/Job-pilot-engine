"""Gmail API integration for draft creation (optional)."""

import base64
import os
from typing import Optional

try:
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    GOOGLE_API_AVAILABLE = True
except ImportError:
    GOOGLE_API_AVAILABLE = False


class GmailSender:
    """Gmail API integration for creating drafts."""
    
    SCOPES = ['https://www.googleapis.com/auth/gmail.modify']
    
    def __init__(self, credentials_path: Optional[str] = None, token_path: Optional[str] = None):
        """
        Initialize Gmail sender.
        
        Args:
            credentials_path: Path to OAuth2 credentials JSON file
            token_path: Path to save/load token JSON file
        """
        if not GOOGLE_API_AVAILABLE:
            raise ImportError(
                "Google API libraries not installed. "
                "Install with: pip install google-api-python-client google-auth-oauthlib"
            )
        
        self.credentials_path = credentials_path or "credentials.json"
        self.token_path = token_path or "token.json"
        self.service = None
        self._authenticate()
    
    def _authenticate(self) -> None:
        """Authenticate with Gmail API using OAuth2."""
        creds = None
        
        # Load existing token if available
        if os.path.exists(self.token_path):
            creds = Credentials.from_authorized_user_file(self.token_path, self.SCOPES)
        
        # If no valid credentials, get new ones
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                if not os.path.exists(self.credentials_path):
                    raise FileNotFoundError(
                        f"Credentials file not found: {self.credentials_path}\n"
                        "Please follow OAuth2 setup instructions to create credentials.json"
                    )
                
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.credentials_path, self.SCOPES
                )
                creds = flow.run_local_server(port=0)
            
            # Save credentials for future use
            with open(self.token_path, 'w') as token:
                token.write(creds.to_json())
        
        # Build Gmail service
        self.service = build('gmail', 'v1', credentials=creds)
    
    def create_draft(self, to: str, subject: str, body: str) -> dict:
        """
        Create a Gmail draft.
        
        Args:
            to: Recipient email address
            subject: Email subject
            body: Email body
            
        Returns:
            Draft response from Gmail API
        """
        if not self.service:
            raise RuntimeError("Gmail service not initialized")
        
        # Create message
        message_text = f"To: {to}\nSubject: {subject}\n\n{body}"
        message = {'raw': base64.urlsafe_b64encode(message_text.encode()).decode()}
        
        # Create draft
        draft = self.service.users().drafts().create(
            userId='me', 
            body={'message': message}
        ).execute()
        
        return draft
    
    def send_email(self, to: str, subject: str, body: str) -> dict:
        """
        Send an email directly via Gmail API.
        
        Args:
            to: Recipient email address
            subject: Email subject
            body: Email body
            
        Returns:
            Message response from Gmail API
        """
        if not self.service:
            raise RuntimeError("Gmail service not initialized")
        
        # Create message
        message_text = f"To: {to}\nSubject: {subject}\n\n{body}"
        message = {'raw': base64.urlsafe_b64encode(message_text.encode()).decode()}
        
        # Send message
        sent = self.service.users().messages().send(
            userId='me',
            body=message
        ).execute()
        
        return sent
