"""Email quality scoring module."""


class QualityScorer:
    """Score email quality based on various criteria."""
    
    # Spam trigger words to avoid
    SPAM_WORDS = [
        "free", "guarantee", "amazing", "incredible", "unbelievable",
        "limited time", "act now", "don't miss", "exclusive", "special offer",
        "winner", "congratulations", "you've been selected", "cash prize"
    ]
    
    def __init__(self):
        """Initialize the quality scorer."""
        pass
    
    def score_email(self, email: dict) -> dict:
        """
        Score an email based on quality criteria.
        
        Args:
            email: Dictionary with 'subject' and 'body' keys
            
        Returns:
            Dictionary with score and breakdown
        """
        body = email.get('body', '')
        subject = email.get('subject', '')
        
        scores = {
            "word_count": self._score_word_count(body),
            "personalization": self._score_personalization(body),
            "clarity": self._score_clarity(body),
            "tone": self._score_tone(body),
            "spam_risk": self._score_spam_risk(body, subject)
        }
        
        # Calculate overall score (weighted average)
        weights = {
            "word_count": 0.25,
            "personalization": 0.25,
            "clarity": 0.25,
            "tone": 0.15,
            "spam_risk": 0.10
        }
        
        overall_score = sum(scores[key] * weights[key] for key in scores)
        
        return {
            "overall_score": round(overall_score, 2),
            "breakdown": scores,
            "word_count": len(body.split()),
            "recommendations": self._get_recommendations(scores)
        }
    
    def _score_word_count(self, body: str) -> float:
        """Score based on word count (target: 100-150 words)."""
        word_count = len(body.split())
        
        if 100 <= word_count <= 150:
            return 1.0
        elif 80 <= word_count < 100 or 150 < word_count <= 170:
            return 0.8
        elif 50 <= word_count < 80 or 170 < word_count <= 200:
            return 0.5
        else:
            return 0.2
    
    def _score_personalization(self, body: str) -> float:
        """Score based on personalization indicators."""
        personalization_indicators = [
            "i noticed", "i've been", "my background", "my experience",
            "i'm excited", "i believe", "i'd love", "i'm curious"
        ]
        
        body_lower = body.lower()
        count = sum(1 for indicator in personalization_indicators if indicator in body_lower)
        
        if count >= 3:
            return 1.0
        elif count >= 2:
            return 0.8
        elif count >= 1:
            return 0.5
        else:
            return 0.2
    
    def _score_clarity(self, body: str) -> float:
        """Score based on clarity (sentence length, readability)."""
        sentences = body.split('.')
        if not sentences:
            return 0.5
        
        avg_sentence_length = sum(len(s.split()) for s in sentences) / len(sentences)
        
        # Ideal average sentence length is 15-20 words
        if 15 <= avg_sentence_length <= 20:
            return 1.0
        elif 10 <= avg_sentence_length < 15 or 20 < avg_sentence_length <= 25:
            return 0.8
        elif 5 <= avg_sentence_length < 10 or 25 < avg_sentence_length <= 30:
            return 0.5
        else:
            return 0.3
    
    def _score_tone(self, body: str) -> float:
        """Score based on professional tone."""
        professional_indicators = [
            "would you be open", "would you be interested", "best regards",
            "sincerely", "thank you", "appreciate", "looking forward"
        ]
        
        unprofessional_indicators = [
            "!!!", "urgent", "immediately", "must have", "asap"
        ]
        
        body_lower = body.lower()
        prof_count = sum(1 for indicator in professional_indicators if indicator in body_lower)
        unprof_count = sum(1 for indicator in unprofessional_indicators if indicator in body_lower)
        
        if prof_count >= 1 and unprof_count == 0:
            return 1.0
        elif prof_count >= 1:
            return 0.7
        elif unprof_count == 0:
            return 0.5
        else:
            return 0.2
    
    def _score_spam_risk(self, body: str, subject: str) -> float:
        """Score based on spam indicators (higher is better, lower risk)."""
        combined = (body + ' ' + subject).lower()
        
        spam_count = sum(1 for word in self.SPAM_WORDS if word in combined)
        
        # Check for excessive caps
        caps_ratio = sum(1 for c in combined if c.isupper()) / len(combined) if combined else 0
        
        # Check for excessive exclamation marks
        exclamation_count = combined.count('!')
        
        if spam_count == 0 and caps_ratio < 0.1 and exclamation_count <= 1:
            return 1.0
        elif spam_count <= 1 and caps_ratio < 0.2 and exclamation_count <= 2:
            return 0.7
        elif spam_count <= 2 and caps_ratio < 0.3 and exclamation_count <= 3:
            return 0.4
        else:
            return 0.1
    
    def _get_recommendations(self, scores: dict) -> list:
        """Get recommendations based on scores."""
        recommendations = []
        
        if scores["word_count"] < 0.8:
            recommendations.append("Adjust word count to 100-150 words for optimal length")
        
        if scores["personalization"] < 0.8:
            recommendations.append("Add more personalization to make the email more engaging")
        
        if scores["clarity"] < 0.8:
            recommendations.append("Break up long sentences for better readability")
        
        if scores["tone"] < 0.7:
            recommendations.append("Use more professional language and tone")
        
        if scores["spam_risk"] < 0.7:
            recommendations.append("Reduce spam-like language and excessive punctuation")
        
        return recommendations
