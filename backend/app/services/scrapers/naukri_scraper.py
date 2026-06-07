import logging
import time
import requests
from bs4 import BeautifulSoup
from typing import List
from app.core.models import Job

# Centralized scraper logger channel (Section 7A)
logger = logging.getLogger("jobflow.scrapers")


class NaukriScraper:
    """HTML scraper for Naukri job board using requests and BeautifulSoup"""
    
    BASE_URL = "https://www.naukri.com"
    
    # Rate limiting: delay between requests in seconds
    REQUEST_DELAY = 2
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })
        logger.info("NaukriScraper initialized with rate limiting")
    
    def fetch_jobs(self, keywords: str = "", location: str = "") -> List[Job]:
        """Fetch jobs from Naukri using HTML scraping
        
        Args:
            keywords: Job title keywords to search
            location: Location filter for jobs
            
        Returns:
            List of Job objects
        """
        try:
            # Build search URL
            if location:
                search_url = f"{self.BASE_URL}/{keywords}-jobs-in-{location}"
                logger.info(f"Fetching Naukri jobs with keywords '{keywords}' in location '{location}'")
            else:
                search_url = f"{self.BASE_URL}/{keywords}-jobs"
                logger.info(f"Fetching Naukri jobs with keywords '{keywords}'")
            
            # Add rate limiting delay
            time.sleep(self.REQUEST_DELAY)
            
            response = self.session.get(search_url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            jobs = []
            
            # Find job cards - Naukri uses specific CSS classes
            # Note: CSS classes may change, need to monitor website structure
            job_elements = soup.find_all('div', class_='srp-jobtuple')
            
            if not job_elements:
                logger.warning("No job elements found with class 'srp-jobtuple'. Trying alternative selectors...")
                # Try alternative selectors
                job_elements = soup.find_all('div', class_='jobTuple')
            
            if not job_elements:
                logger.warning("No job elements found with class 'jobTuple'. Trying more generic selectors...")
                # Try more generic selectors
                job_elements = soup.find_all('div', class_=lambda x: x and ('job' in x.lower() or 'card' in x.lower()))
            
            if not job_elements:
                logger.warning("No job elements found with generic selectors. Trying article tags...")
                # Try article tags
                job_elements = soup.find_all('article')
            
            logger.info(f"Found {len(job_elements)} job elements on page")
            
            for element in job_elements:
                job = self._parse_job(element)
                if job:
                    jobs.append(job)
            
            logger.info(f"Successfully parsed {len(jobs)} jobs from Naukri")
            return jobs
            
        except requests.Timeout as e:
            logger.error(f"Timeout error fetching Naukri jobs: {e}")
            return []
        except requests.RequestException as e:
            logger.error(f"Request error fetching Naukri jobs: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error fetching Naukri jobs: {e}")
            return []
    
    def _parse_job(self, element):
        """Parse job details from a job card element
        
        Args:
            element: BeautifulSoup element containing job information
            
        Returns:
            Job object or None if parsing fails
        """
        try:
            # Try multiple selectors for title
            title_elem = (element.find('a', class_='title') or 
                         element.find('a', class_='job-title') or
                         element.find('h3') or
                         element.find('a'))
            title = title_elem.get_text(strip=True) if title_elem else "N/A"
            
            # Try multiple selectors for company
            company_elem = (element.find('a', class_='subTitle') or
                           element.find('span', class_='company') or
                           element.find('div', class_='company'))
            company = company_elem.get_text(strip=True) if company_elem else "N/A"
            
            # Try multiple selectors for location
            location_elem = (element.find('span', class_='loc') or
                           element.find('div', class_='location') or
                           element.find('span', class_='locWrd'))
            location = location_elem.get_text(strip=True) if location_elem else "N/A"
            
            # Try multiple selectors for URL
            url_elem = element.find('a')
            url = url_elem.get('href') if url_elem else ""
            if url and not url.startswith('http'):
                url = "https://www.naukri.com" + url
            
            # Try multiple selectors for experience
            exp_elem = (element.find('span', class_='expwd') or
                       element.find('div', class_='experience'))
            experience = exp_elem.get_text(strip=True) if exp_elem else ""
            
            # Try multiple selectors for salary
            salary_elem = (element.find('span', class_='sal') or
                          element.find('div', class_='salary'))
            salary = salary_elem.get_text(strip=True) if salary_elem else ""
            
            # Try multiple selectors for posting date
            date_elem = (element.find('span', class_='job-post-day') or
                        element.find('div', class_='date'))
            posting_date = date_elem.get_text(strip=True) if date_elem else ""
            
            # Try multiple selectors for description
            desc_elem = (element.find('div', class_='job-description') or
                        element.find('span', class_='desc') or
                        element.find('div', class_='job-desc'))
            description = desc_elem.get_text(strip=True)[:500] if desc_elem else ""
            
            # Only create job if we have at least a title
            if title and title != "N/A":
                return Job(
                    title=title,
                    company=company,
                    location=location,
                    url=url,
                    salary=salary,
                    description=description,
                    source="Naukri"
                )
            
            return None
            
        except Exception as e:
            logger.warning(f"Error parsing job element: {e}")
            return None
