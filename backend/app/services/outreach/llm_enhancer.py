"""LLM integration for email enhancement (optional)."""

from typing import Optional

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False


class LLMEmailEnhancer:
    """LLM-powered email enhancement using Groq API."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize LLM email enhancer.
        
        Args:
            api_key: Groq API key (if None, will use GROQ_API_KEY env var)
        """
        if not GROQ_AVAILABLE:
            raise ImportError(
                "Groq library not installed. "
                "Install with: pip install groq"
            )
        
        import os
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        
        if not self.api_key:
            raise ValueError(
                "Groq API key not provided. "
                "Set GROQ_API_KEY environment variable or pass api_key parameter."
            )
        
        self.client = Groq(api_key=self.api_key)
    
    def enhance_email(
        self, 
        subject: str, 
        body: str, 
        tone: str = "professional",
        max_words: int = 150
    ) -> dict:
        """
        Enhance email using LLM.
        
        Args:
            subject: Original email subject
            body: Original email body
            tone: Desired tone (professional, casual, friendly, formal)
            max_words: Maximum word count for enhanced email
            
        Returns:
            Dictionary with enhanced subject and body
        """
        prompt = f"""Improve this cold email for a {tone} tone.
Keep it under {max_words} words.
Make it more engaging and personalized while maintaining the core message.

Original Subject: {subject}
Original Body: {body}

Please provide:
1. An improved subject line
2. An improved email body

Format your response as:
SUBJECT: [improved subject]
BODY: [improved body]"""
        
        try:
            response = self.client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[
                    {"role": "system", "content": "You are an expert at writing professional cold emails."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            content = response.choices[0].message.content
            
            # Parse response
            enhanced_subject = subject
            enhanced_body = body
            
            lines = content.split('\n')
            current_section = None
            
            for line in lines:
                line = line.strip()
                if line.startswith('SUBJECT:'):
                    enhanced_subject = line.replace('SUBJECT:', '').strip()
                elif line.startswith('BODY:'):
                    enhanced_body = line.replace('BODY:', '').strip()
                elif current_section == 'body':
                    enhanced_body += '\n' + line
            
            return {
                "subject": enhanced_subject,
                "body": enhanced_body,
                "original_subject": subject,
                "original_body": body
            }
        
        except Exception as e:
            print(f"LLM enhancement failed: {e}")
            # Return original if enhancement fails
            return {
                "subject": subject,
                "body": body,
                "original_subject": subject,
                "original_body": body,
                "error": str(e)
            }
    
    def generate_subject_variations(self, subject: str, count: int = 5) -> list:
        """
        Generate subject line variations using LLM.
        
        Args:
            subject: Original subject line
            count: Number of variations to generate
            
        Returns:
            List of subject line variations
        """
        prompt = f"""Generate {count} alternative subject lines for this cold email subject.
Make them engaging but professional.
Keep them under 50 characters each.

Original Subject: {subject}

Provide only the subject lines, one per line."""
        
        try:
            response = self.client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[
                    {"role": "system", "content": "You are an expert at writing email subject lines."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8,
                max_tokens=300
            )
            
            content = response.choices[0].message.content
            variations = [line.strip() for line in content.split('\n') if line.strip()]
            
            return variations[:count]
        
        except Exception as e:
            print(f"Subject generation failed: {e}")
            return [subject]
