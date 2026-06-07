"""Question-focused email template."""


def generate_email(record: dict) -> dict:
    """Generate a question-focused email."""
    recipient_name = record.get('recipient_name', 'there')
    company = record['company']
    role = record['role']
    personalization_note = record.get('personalization_note', '')
    candidate_name = record['candidate_name']
    candidate_background = record['candidate_background']
    portfolio_url = record.get('portfolio_url', '')
    
    subject = f"Question about {role} at {company}"
    
    body = f"""Hi {recipient_name},

I came across the {role} opening at {company} and had a question. {personalization_note}

I'm {candidate_name}, and I've been working on projects involving {candidate_background}. I'm curious about how your team approaches [specific aspect related to the role/company].

Would you be open to a brief conversation to learn more about the team's approach to this challenge?

Best,
{candidate_name}
{portfolio_url}"""
    
    return {"subject": subject, "body": body}
