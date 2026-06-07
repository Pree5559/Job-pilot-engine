"""Spam risk checker module."""


class SpamChecker:
    """Check emails for spam indicators."""
    
    # Spam trigger words
    SPAM_WORDS = [
        "free", "guarantee", "amazing", "incredible", "unbelievable",
        "limited time", "act now", "don't miss", "exclusive", "special offer",
        "winner", "congratulations", "you've been selected", "cash prize",
        "risk-free", "no obligation", "click here", "subscribe now", "buy now"
    ]
    
    def __init__(self):
        """Initialize the spam checker."""
        pass
    
    def check_spam_risk(self, email: dict) -> dict:
        """
        Check email for spam risk indicators.
        
        Args:
            email: Dictionary with 'subject' and 'body' keys
            
        Returns:
            Dictionary with spam risk assessment
        """
        subject = email.get('subject', '')
        body = email.get('body', '')
        combined = (subject + ' ' + body).lower()
        
        issues = []
        risk_score = 0
        
        # Check for spam words
        spam_words_found = self._check_spam_words(combined)
        if spam_words_found:
            issues.append(f"Spam trigger words: {', '.join(spam_words_found)}")
            risk_score += len(spam_words_found) * 10
        
        # Check for excessive caps
        caps_ratio = self._check_caps_ratio(subject + ' ' + body)
        if caps_ratio > 0.3:
            issues.append(f"Excessive capitalization: {caps_ratio:.1%}")
            risk_score += 15
        
        # Check for excessive exclamation marks
        exclamation_count = (subject + ' ' + body).count('!')
        if exclamation_count > 2:
            issues.append(f"Excessive exclamation marks: {exclamation_count}")
            risk_score += exclamation_count * 5
        
        # Check for excessive links
        link_count = combined.count('http')
        if link_count > 2:
            issues.append(f"Excessive links: {link_count}")
            risk_score += link_count * 10
        
        # Determine risk level
        if risk_score == 0:
            risk_level = "Low"
        elif risk_score <= 20:
            risk_level = "Medium"
        else:
            risk_level = "High"
        
        return {
            "risk_level": risk_level,
            "risk_score": risk_score,
            "issues": issues,
            "is_safe": risk_score <= 20
        }
    
    def _check_spam_words(self, text: str) -> list:
        """Check for spam trigger words in text."""
        found = []
        for word in self.SPAM_WORDS:
            if word in text:
                found.append(word)
        return found
    
    def _check_caps_ratio(self, text: str) -> float:
        """Calculate ratio of uppercase letters."""
        if not text:
            return 0.0
        
        letters = [c for c in text if c.isalpha()]
        if not letters:
            return 0.0
        
        caps = sum(1 for c in letters if c.isupper())
        return caps / len(letters)
