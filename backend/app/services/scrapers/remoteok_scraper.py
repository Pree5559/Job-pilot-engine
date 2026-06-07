import logging
import requests
from typing import List
from app.core.models import Job

# Centralized scraper logger channel (Section 7A)
logger = logging.getLogger("jobflow.scrapers")


class RemoteOkScraper:
    """Scraper for RemoteOk job board using public API"""
    
    BASE_URL = "https://remoteok.com/api"
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
        })
        logger.info("RemoteOkScraper initialized")
    
    def fetch_jobs(self, keywords: str = "") -> List[Job]:
        """Fetch jobs from RemoteOk API
        
        Args:
            keywords: Search keywords to filter jobs
            
        Returns:
            List of Job objects
        """
        try:
            params = {}
            if keywords:
                params['search'] = keywords
                logger.info(f"Fetching RemoteOk jobs with keywords: {keywords}")
            else:
                logger.info("Fetching all RemoteOk jobs")
            
            response = self.session.get(self.BASE_URL, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            jobs = []
            
            # Skip first element (it's metadata)
            for item in data[1:]:
                if not item or not isinstance(item, dict):
                    continue
                
                job = self._parse_job(item)
                if job:
                    jobs.append(job)
            
            logger.info(f"Successfully fetched {len(jobs)} jobs from RemoteOk")
            return jobs
            
        except requests.Timeout as e:
            logger.error(f"Timeout error fetching RemoteOk jobs: {e}")
            return []
        except requests.RequestException as e:
            logger.error(f"Request error fetching RemoteOk jobs: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error fetching RemoteOk jobs: {e}")
            return []
    
    def _parse_job(self, item: dict) -> Job:
        """Parse job data from API response
        
        Args:
            item: Dictionary containing job data from API
            
        Returns:
            Job object or None if parsing fails
        """
        try:
            # Extract and clean description
            description = item.get('description', '')
            if description:
                # Remove HTML tags and truncate
                import re
                description = re.sub('<[^<]+?>', '', description)
                description = description[:500]
            
            return Job(
                title=item.get('position', 'N/A'),
                company=item.get('company', 'N/A'),
                location=item.get('location', 'Remote'),
                url=item.get('url', ''),
                salary=item.get('salary', ''),
                description=description,
                source='RemoteOk'
            )
        except Exception as e:
            logger.warning(f"Error parsing job item: {e}")
            return None
