import sys
import os
from typing import Dict

# Add phase3 to path for template imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'phase3'))


class EmailGenerator:
    """Generate personalized cold emails from contact data."""
    
    # Available templates
    TEMPLATES = {
        "default": None,  # Use original template
        "direct": "app.services.outreach.templates.direct",
        "story": "app.services.outreach.templates.story",
        "question": "app.services.outreach.templates.question",
        "value": "app.services.outreach.templates.value"
    }
    
    def __init__(self, template: str = "default"):
        """Initialize the email generator.
        
        Args:
            template: Template name to use (default, direct, story, question, value)
        """
        self.template = template
        self.template_module = None
        
        if template != "default" and template in self.TEMPLATES:
            try:
                module_path = self.TEMPLATES[template]
                module = __import__(module_path, fromlist=['generate_email'])
                self.template_module = module
            except ImportError:
                print(f"Warning: Could not load template '{template}', using default")
                self.template = "default"
    
    def generate_email(self, record: Dict) -> Dict:
        """
        Generate a personalized email from a contact record.
        
        Args:
            record: Dictionary containing contact information
            
        Returns:
            Dictionary with 'subject' and 'body' keys
        """
        # Use template if available
        if self.template_module:
            return self.template_module.generate_email(record)
        
        # Use default template
        # Generate subject line
        subject = self._generate_subject(record)
        
        # Generate email body
        body = self._generate_body(record)
        
        return {"subject": subject, "body": body}
    
    def _generate_subject(self, record: Dict) -> str:
        """Generate email subject line."""
        role = record.get('role', 'position')
        company = record.get('company', 'your company')
        
        subject = f"Quick note on the {role} role"
        return subject
    
    def _generate_body(self, record: Dict) -> str:
        """Generate email body using template."""
        recipient_name = record.get('recipient_name', 'there')
        company = record['company']
        role = record['role']
        personalization_note = record.get('personalization_note', '')
        candidate_name = record['candidate_name']
        candidate_background = record['candidate_background']
        portfolio_url = record.get('portfolio_url', '')
        
        body = f"""Hi {recipient_name},

I noticed {company} is hiring for {role}. {personalization_note}

I'm {candidate_name}, and I've been building projects around {candidate_background}.
The role stood out because it connects closely with my interest in practical automation and product-focused engineering.

Would you be open to a quick look at my profile or pointing me to the right person?

Best,
{candidate_name}
{portfolio_url}"""
        
        return body
    
    def validate_email(self, email: Dict) -> tuple[bool, str]:
        """
        Validate generated email.
        
        Args:
            email: Dictionary with 'subject' and 'body' keys
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check subject
        if not email.get('subject'):
            return False, "Email subject is missing"
        
        # Check body
        if not email.get('body'):
            return False, "Email body is missing"
        
        # Check word count (should be under 150 words)
        word_count = len(email['body'].split())
        if word_count > 150:
            return False, f"Email is too long ({word_count} words, max 150)"
        
        # Check minimum length (at least 50 words)
        if word_count < 50:
            return False, f"Email is too short ({word_count} words, min 50)"
        
        return True, ""
    
    def get_word_count(self, email: Dict) -> int:
        """Get word count of email body."""
        return len(email['body'].split())
    
    def set_template(self, template: str) -> None:
        """Change the email template.
        
        Args:
            template: Template name to use
        """
        if template not in self.TEMPLATES:
            raise ValueError(f"Unknown template: {template}. Available: {list(self.TEMPLATES.keys())}")
        
        self.template = template
        
        if template != "default":
            try:
                module_path = self.TEMPLATES[template]
                module = __import__(module_path, fromlist=['generate_email'])
                self.template_module = module
            except ImportError:
                print(f"Warning: Could not load template '{template}', using default")
                self.template = "default"
                self.template_module = None
        else:
            self.template_module = None
