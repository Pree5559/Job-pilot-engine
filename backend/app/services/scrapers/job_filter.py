import logging
from typing import List
from app.core.models import Job

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class JobFilter:
    """Filter jobs based on criteria"""
    
    @staticmethod
    def filter_by_title(jobs: List[Job], keywords: List[str]) -> List[Job]:
        """Filter jobs by title keywords (case-insensitive)"""
        try:
            if not jobs:
                logger.warning("No jobs to filter by title")
                return []
            
            if not keywords:
                logger.warning("No keywords provided for title filtering")
                return jobs
            
            filtered = []
            keywords_lower = [k.lower() for k in keywords]
            
            for job in jobs:
                title_lower = job.title.lower()
                if any(keyword in title_lower for keyword in keywords_lower):
                    filtered.append(job)
            
            logger.info(f"Filtered {len(jobs)} jobs by title keywords {keywords}: {len(filtered)} matches")
            return filtered
            
        except Exception as e:
            logger.error(f"Error filtering jobs by title: {e}")
            raise
    
    @staticmethod
    def filter_by_location(jobs: List[Job], locations: List[str]) -> List[Job]:
        """Filter jobs by location (case-insensitive)"""
        try:
            if not jobs:
                logger.warning("No jobs to filter by location")
                return []
            
            if not locations:
                logger.warning("No locations provided for location filtering")
                return jobs
            
            filtered = []
            locations_lower = [l.lower() for l in locations]
            
            for job in jobs:
                location_lower = job.location.lower()
                if any(loc in location_lower for loc in locations_lower):
                    filtered.append(job)
            
            logger.info(f"Filtered {len(jobs)} jobs by locations {locations}: {len(filtered)} matches")
            return filtered
            
        except Exception as e:
            logger.error(f"Error filtering jobs by location: {e}")
            raise
    
    @staticmethod
    def remove_duplicates(jobs: List[Job]) -> List[Job]:
        """Remove duplicate jobs based on URL"""
        try:
            if not jobs:
                logger.warning("No jobs to deduplicate")
                return []
            
            seen_urls = set()
            unique_jobs = []
            duplicate_count = 0
            
            for job in jobs:
                if job.url not in seen_urls:
                    seen_urls.add(job.url)
                    unique_jobs.append(job)
                else:
                    duplicate_count += 1
            
            logger.info(f"Removed {duplicate_count} duplicate jobs from {len(jobs)} total jobs")
            return unique_jobs
            
        except Exception as e:
            logger.error(f"Error removing duplicates: {e}")
            raise
