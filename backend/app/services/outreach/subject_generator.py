"""Subject line variations generator."""


class SubjectGenerator:
    """Generate multiple subject line options for emails."""
    
    # Subject line templates
    SUBJECT_TEMPLATES = [
        "Quick note on the {role} role",
        "Regarding {company}'s {role} position",
        "Question about {role} at {company}",
        "{role} opportunity at {company}",
        "Inquiry about {role} position",
        "Following up on {role} at {company}",
        "Interest in {role} - {candidate_name}",
        "{role} application - {candidate_name}"
    ]
    
    def __init__(self):
        """Initialize the subject generator."""
        pass
    
    def generate_subjects(self, record: dict, count: int = 4) -> list:
        """
        Generate multiple subject line options.
        
        Args:
            record: Contact record with company, role, candidate_name
            count: Number of subject lines to generate
            
        Returns:
            List of subject line strings
        """
        subjects = []
        
        for i, template in enumerate(self.SUBJECT_TEMPLATES):
            if i >= count:
                break
            
            subject = template.format(
                role=record.get('role', 'position'),
                company=record.get('company', 'your company'),
                candidate_name=record.get('candidate_name', 'Your Name')
            )
            subjects.append(subject)
        
        return subjects
    
    def get_default_subject(self, record: dict) -> str:
        """Get the default subject line."""
        return self.SUBJECT_TEMPLATES[0].format(
            role=record.get('role', 'position'),
            company=record.get('company', 'your company'),
            candidate_name=record.get('candidate_name', 'Your Name')
        )
