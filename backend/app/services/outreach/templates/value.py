"""Value proposition focused email template."""


def generate_email(record: dict) -> dict:
    """Generate a value proposition focused email."""
    recipient_name = record.get('recipient_name', 'there')
    company = record['company']
    role = record['role']
    personalization_note = record.get('personalization_note', '')
    candidate_name = record['candidate_name']
    candidate_background = record['candidate_background']
    portfolio_url = record.get('portfolio_url', '')
    
    subject = f"{role} opportunity at {company}"
    
    body = f"""Hi {recipient_name},

I'm reaching out about the {role} position at {company}. {personalization_note}

Here's what I can bring to the team:
- Experience in {candidate_background}
- A track record of delivering practical, user-focused solutions
- Strong problem-solving skills and attention to detail

I believe my background aligns well with what you're looking for, and I'm excited about the opportunity to contribute to {company}'s mission.

Would you be interested in reviewing my portfolio or having a quick call?

Best,
{candidate_name}
{portfolio_url}"""
    
    return {"subject": subject, "body": body}
