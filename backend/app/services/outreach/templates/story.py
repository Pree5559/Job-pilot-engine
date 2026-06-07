"""Story-based email template."""


def generate_email(record: dict) -> dict:
    """Generate a story-based email."""
    recipient_name = record.get('recipient_name', 'there')
    company = record['company']
    role = record['role']
    personalization_note = record.get('personalization_note', '')
    candidate_name = record['candidate_name']
    candidate_background = record['candidate_background']
    portfolio_url = record.get('portfolio_url', '')
    
    subject = f"Regarding {company}'s {role} position"
    
    body = f"""Hi {recipient_name},

I've been following {company}'s journey and was excited to see you're hiring for {role}. {personalization_note}

My path to this role started when I began building projects around {candidate_background}. What started as curiosity turned into a passion for creating practical solutions that solve real problems.

The {role} position at {company} stood out because it combines technical challenges with the opportunity to build products that genuinely help people.

I'd love to share more about my journey and learn more about the team's vision.

Best,
{candidate_name}
{portfolio_url}"""
    
    return {"subject": subject, "body": body}
