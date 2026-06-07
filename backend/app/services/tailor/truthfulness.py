import re
from typing import List, Dict, Any, Optional

class RiskFlagType:
    NEW_EMPLOYER = "new_employer"
    NEW_CREDENTIAL = "new_credential"
    NEW_TECHNOLOGY = "new_technology"
    INFLATED_METRIC = "inflated_metric"
    INFLATED_SCOPE = "inflated_scope"
    EXPERT_CLAIM_UNSUPPORTED = "expert_claim_unsupported"

class RiskFlag:
    def __init__(self, flag_type: str, bullet_index: int, experience_index: int, description: str):
        self.type = flag_type
        self.bulletIndex = bullet_index
        self.experienceIndex = experience_index
        self.description = description

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "bulletIndex": self.bulletIndex,
            "experienceIndex": self.experienceIndex,
            "description": self.description
        }

def extract_original_text(resume: Dict[str, Any]) -> Dict[str, List[str]]:
    all_bullets = []
    all_companies = []
    all_credentials = []

    # Get experience details
    for exp in resume.get("experience", []):
        all_bullets.extend(exp.get("bullets", []))
        company = (exp.get("company") or "").strip().lower()
        if company:
            all_companies.append(company)

    # Collect skills & technologies
    all_skills = [s.strip().lower() for s in resume.get("skills", []) if s]

    # Collect degree/certification info
    for edu in resume.get("education", []):
        degree = (edu.get("degree") or "").strip().lower()
        field = (edu.get("field") or "").strip().lower()
        if degree:
            all_credentials.append(degree)
        if field:
            all_credentials.append(field)

    for cert in resume.get("certifications", []):
        name = (cert.get("name") or "").strip().lower()
        issuer = (cert.get("issuer") or "").strip().lower()
        if name:
            all_credentials.append(name)
        if issuer:
            all_credentials.append(issuer)

    return {
        "allBullets": all_bullets,
        "allSkills": all_skills,
        "allCompanies": all_companies,
        "allCredentials": all_credentials
    }

def detect_new_technology(tailored_text: str, original_text: str, original_skills: List[str]) -> Optional[str]:
    # Extract potential technology/capitalized terms from tailored text
    tech_pattern = re.compile(r'\b([A-Z][A-Za-z0-9+#.]+(?:\s[A-Z][A-Za-z0-9+#.]+)?)\b')
    matched_techs = set(tech_pattern.findall(tailored_text))

    original_lower = original_text.lower()
    for tech in matched_techs:
        tech_lower = tech.strip().lower()
        if not tech_lower:
            continue
        # Check if present in original text or skills list
        is_in_original = (tech_lower in original_lower) or any(s == tech_lower for s in original_skills)
        if not is_in_original:
            return tech
    return None

def detect_inflated_metric(tailored_text: str, original_text: str) -> Optional[str]:
    # Extract numbers/percentages
    metric_pattern = re.compile(r'\b(\d+[\.,]?\d*%?)\b')
    tailored_metrics = metric_pattern.findall(tailored_text)
    original_lower = original_text.lower()

    for metric in tailored_metrics:
        if metric.strip().lower() not in original_lower:
            return metric
    return None

def detect_inflated_scope(tailored_text: str, original_text: str) -> Optional[str]:
    leadership_terms = [
        "led", "managed", "headed", "directed", "oversaw",
        "spearheaded", "orchestrated", "pioneered", "chaired", "supervised"
    ]
    tailored_lower = tailored_text.lower()
    original_lower = original_text.lower()

    for term in leadership_terms:
        if term in tailored_lower and term not in original_lower:
            return term
    return None

def detect_expert_claim(tailored_text: str, original_text: str) -> Optional[str]:
    expert_patterns = [
        (re.compile(r'\bexpert\b', re.IGNORECASE), "expert"),
        (re.compile(r'\bmastery\b', re.IGNORECASE), "mastery"),
        (re.compile(r'\bdeep\s+expertise\b', re.IGNORECASE), "deep expertise"),
        (re.compile(r'\bworld-class\b', re.IGNORECASE), "world-class"),
        (re.compile(r'\bindustry-leading\b', re.IGNORECASE), "industry-leading"),
        (re.compile(r'\bproficient\s+in\s+all\b', re.IGNORECASE), "proficient in all")
    ]
    tailored_lower = tailored_text.lower()
    original_lower = original_text.lower()

    for pattern, term in expert_patterns:
        if pattern.search(tailored_lower) and not pattern.search(original_lower):
            return term
    return None

def evaluate_truthfulness(resume: Dict[str, Any], tailored_text: str, original_experience_index: int, original_bullet_index: int) -> List[RiskFlag]:
    risk_flags = []
    
    # Try to find corresponding original bullet point text
    experience = resume.get("experience", [])
    if original_experience_index >= len(experience):
        return risk_flags
    
    exp = experience[original_experience_index]
    bullets = exp.get("bullets", [])
    if original_bullet_index >= len(bullets):
        return risk_flags

    original_bullet = bullets[original_bullet_index]
    original_extracts = extract_original_text(resume)
    
    # Run detectors
    new_tech = detect_new_technology(tailored_text, original_bullet, original_extracts["allSkills"])
    if new_tech:
        risk_flags.append(RiskFlag(
            RiskFlagType.NEW_TECHNOLOGY,
            original_bullet_index,
            original_experience_index,
            f"Introduced new technology: '{new_tech}' not found in original bullet point."
        ))

    inflated_metric = detect_inflated_metric(tailored_text, original_bullet)
    if inflated_metric:
        risk_flags.append(RiskFlag(
            RiskFlagType.INFLATED_METRIC,
            original_bullet_index,
            original_experience_index,
            f"Introduced numerical metric: '{inflated_metric}' not found in original bullet point."
        ))

    inflated_scope = detect_inflated_scope(tailored_text, original_bullet)
    if inflated_scope:
        risk_flags.append(RiskFlag(
            RiskFlagType.INFLATED_SCOPE,
            original_bullet_index,
            original_experience_index,
            f"Introduced leadership/management scope term: '{inflated_scope}' not found in original bullet point."
        ))

    expert_claim = detect_expert_claim(tailored_text, original_bullet)
    if expert_claim:
        risk_flags.append(RiskFlag(
            RiskFlagType.EXPERT_CLAIM_UNSUPPORTED,
            original_bullet_index,
            original_experience_index,
            f"Introduced expert claim: '{expert_claim}' not found in original bullet point."
        ))

    return risk_flags
