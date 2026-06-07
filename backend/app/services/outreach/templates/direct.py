"""Direct and concise email template."""


def generate_email(record: dict) -> dict:
    """Generate a direct and concise email."""
    recipient_name = record.get('recipient_name', 'there')
    company = record['company']
    role = record['role']
    personalization_note = record.get('personalization_note', '')
    candidate_name = record['candidate_name']
    candidate_background = record['candidate_background']
    portfolio_url = record.get('portfolio_url', '')
    
    subject = f"Quick note on the {role} role"
    
    body = f"""Hi {recipient_name},

I noticed {company} is hiring for {role}. {personalization_note}

I'm {candidate_name}, with experience in {candidate_background}. The role aligns with my background in practical automation and product-focused engineering.

Would you be open to a quick chat about the position?

Best,
{candidate_name}
{portfolio_url}"""
    
    return {"subject": subject, "body": body}
