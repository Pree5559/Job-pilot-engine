import logging
import os
import re
from typing import List, Optional
from app.core.models import Job

# Centralized scraper logger channel (Section 7A)
logger = logging.getLogger("jobflow.scrapers")


class WellfoundScraper:
    """Firecrawl-based scraper for Wellfound (formerly AngelList) job board
    
    This scraper uses Firecrawl to handle JavaScript-rendered content and complex
    web scraping requirements. It accepts direct job role and location inputs.
    """
    
    BASE_URL = "https://wellfound.com"
    
    def __init__(self, api_key: str = None):
        """Initialize Wellfound scraper with Firecrawl
        
        Args:
            api_key: Firecrawl API key (defaults to FIRECRAWL_API_KEY env var)
        """
        self.api_key = api_key or os.getenv('FIRECRAWL_API_KEY')
        
        if not self.api_key:
            logger.warning("FIRECRAWL_API_KEY not set. Wellfound scraper will not function.")
            logger.warning("Set FIRECRAWL_API_KEY environment variable or pass api_key parameter.")
        
        self.firecrawl = self._initialize_firecrawl()
    
    def _initialize_firecrawl(self):
        """Initialize Firecrawl client with error handling"""
        if not self.api_key:
            return None
            
        try:
            from firecrawl import FirecrawlApp
            firecrawl = FirecrawlApp(api_key=self.api_key)
            logger.info("WellfoundScraper initialized with Firecrawl")
            return firecrawl
        except ImportError:
            logger.error("firecrawl-py not installed. Install with: pip install firecrawl-py")
            return None
        except Exception as e:
            logger.error(f"Error initializing Firecrawl: {e}")
            return None
    
    def fetch_jobs(self, job_role: str = "", location: str = "") -> List[Job]:
        """Fetch jobs from Wellfound using Firecrawl with direct job role and location inputs
        
        Args:
            job_role: Direct job role/title to search (e.g., "software engineer", "data scientist")
            location: Direct location to search (e.g., "San Francisco", "Remote", "New York")
            
        Returns:
            List of Job objects
        """
        if not self.firecrawl:
            logger.error("Firecrawl not initialized. Cannot fetch Wellfound jobs.")
            logger.error("Please set FIRECRAWL_API_KEY environment variable.")
            return []
        
        try:
            # Build search URL with direct job role and location
            search_url = self._build_search_url(job_role, location)
            
            logger.info(f"Fetching Wellfound jobs - Role: '{job_role}', Location: '{location}'")
            logger.info(f"Search URL: {search_url}")
            
            # Use Firecrawl to scrape the page
            scrape_result = self.firecrawl.scrape(
                url=search_url,
                formats=['markdown', 'html'],
                only_main_content=True,
                wait_for=2000
            )
            
            if not scrape_result:
                logger.warning("No content returned from Firecrawl")
                return []
            
            # Parse the content to extract job information
            jobs = self._parse_scrape_result(scrape_result, job_role, location)
            
            logger.info(f"Successfully parsed {len(jobs)} jobs from Wellfound")
            return jobs
            
        except Exception as e:
            logger.error(f"Error fetching Wellfound jobs with Firecrawl: {e}")
            return []
    
    def _build_search_url(self, job_role: str, location: str) -> str:
        """Build Wellfound search URL with job role and location
        
        Args:
            job_role: Job role/title
            location: Location filter
            
        Returns:
            Complete search URL
        """
        search_url = f"{self.BASE_URL}/roles"
        
        params = []
        if job_role:
            # Convert job role to URL-friendly format
            formatted_role = job_role.lower().replace(' ', '-')
            params.append(f"q={formatted_role}")
        
        if location:
            # Convert location to URL-friendly format
            formatted_location = location.lower().replace(' ', '-')
            params.append(f"l={formatted_location}")
        
        if params:
            search_url += "?" + "&".join(params)
        
        return search_url
    
    def _parse_scrape_result(self, scrape_result: dict, job_role: str, location: str) -> List[Job]:
        """Parse Firecrawl response to extract job data
        
        Args:
            scrape_result: Firecrawl scrape response
            job_role: Original job role search term
            location: Original location search term
            
        Returns:
            List of Job objects
        """
        jobs = []
        
        try:
            # Try markdown first, fallback to HTML
            content = scrape_result.get('markdown', '') or scrape_result.get('html', '')
            
            if not content:
                logger.warning("No markdown or HTML content in Firecrawl response")
                return []
            
            # Parse content based on format
            if 'markdown' in scrape_result:
                jobs = self._parse_markdown(content, job_role, location)
            else:
                jobs = self._parse_html(content, job_role, location)
            
            return jobs
            
        except Exception as e:
            logger.error(f"Error parsing Firecrawl response: {e}")
            return []
    
    def _parse_markdown(self, markdown_content: str, job_role: str, location: str) -> List[Job]:
        """Parse markdown content to extract job listings
        
        Args:
            markdown_content: Markdown content from Firecrawl
            job_role: Original job role search term
            location: Original location search term
            
        Returns:
            List of Job objects
        """
        jobs = []
        lines = markdown_content.split('\n')
        
        current_job = {}
        job_count = 0
        
        for line in lines:
            line = line.strip()
            
            # Detect job listings - look for patterns that indicate job titles
            # Job titles often appear as headings or bold text
            if self._is_job_title_line(line):
                # Save previous job if exists
                if current_job and self._has_required_fields(current_job):
                    job = self._create_job_from_dict(current_job, job_role, location)
                    if job:
                        jobs.append(job)
                        job_count += 1
                
                # Start new job
                current_job = {'title': self._clean_title(line)}
            
            # Extract company information
            elif self._is_company_line(line):
                current_job['company'] = self._extract_company(line)
            
            # Extract location information
            elif self._is_location_line(line):
                current_job['location'] = self._extract_location(line)
            
            # Extract salary information
            elif self._is_salary_line(line):
                current_job['salary'] = self._extract_salary(line)
            
            # Extract description (longer lines)
            elif len(line) > 50 and not line.startswith('#'):
                if 'description' not in current_job:
                    current_job['description'] = line[:500]
                else:
                    current_job['description'] += ' ' + line[:500]
        
        # Don't forget the last job
        if current_job and self._has_required_fields(current_job):
            job = self._create_job_from_dict(current_job, job_role, location)
            if job:
                jobs.append(job)
                job_count += 1
        
        logger.info(f"Parsed {job_count} jobs from markdown content")
        return jobs
    
    def _parse_html(self, html_content: str, job_role: str, location: str) -> List[Job]:
        """Parse HTML content to extract job listings
        
        Args:
            html_content: HTML content from Firecrawl
            job_role: Original job role search term
            location: Original location search term
            
        Returns:
            List of Job objects
        """
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html_content, 'html.parser')
            jobs = []
            
            # Look for common job listing patterns in HTML
            # This is a basic implementation - may need adjustment based on actual Wellfound HTML structure
            job_elements = soup.find_all(['div', 'article'], class_=re.compile(r'job|role|position', re.I))
            
            for element in job_elements:
                job_data = self._extract_job_from_html_element(element)
                if job_data:
                    job = self._create_job_from_dict(job_data, job_role, location)
                    if job:
                        jobs.append(job)
            
            logger.info(f"Parsed {len(jobs)} jobs from HTML content")
            return jobs
            
        except ImportError:
            logger.error("BeautifulSoup not available for HTML parsing")
            return []
        except Exception as e:
            logger.error(f"Error parsing HTML content: {e}")
            return []
    
    def _extract_job_from_html_element(self, element) -> Optional[dict]:
        """Extract job data from HTML element
        
        Args:
            element: BeautifulSoup element
            
        Returns:
            Dictionary with job data or None
        """
        try:
            job_data = {}
            
            # Try to extract title
            title_elem = element.find(['h1', 'h2', 'h3', 'h4'])
            if title_elem:
                job_data['title'] = title_elem.get_text().strip()
            
            # Try to extract company
            company_elem = element.find(class_=re.compile(r'company|startup', re.I))
            if company_elem:
                job_data['company'] = company_elem.get_text().strip()
            
            # Try to extract location
            location_elem = element.find(class_=re.compile(r'location|remote|city', re.I))
            if location_elem:
                job_data['location'] = location_elem.get_text().strip()
            
            # Try to extract description
            desc_elem = element.find(['p', 'div'], class_=re.compile(r'description|summary', re.I))
            if desc_elem:
                job_data['description'] = desc_elem.get_text().strip()[:500]
            
            return job_data if job_data else None
            
        except Exception as e:
            logger.warning(f"Error extracting job from HTML element: {e}")
            return None
    
    def _is_job_title_line(self, line: str) -> bool:
        """Check if line appears to be a job title
        
        Args:
            line: Text line to check
            
        Returns:
            True if line looks like a job title
        """
        # Job titles often appear as headings or bold text
        if line.startswith('##') or line.startswith('###'):
            return True
        
        if line.startswith('**') and line.endswith('**'):
            return True
        
        # Check for common job title keywords
        job_keywords = ['engineer', 'developer', 'manager', 'director', 'analyst', 
                       'scientist', 'designer', 'product', 'marketing', 'sales']
        if any(keyword in line.lower() for keyword in job_keywords):
            return True
        
        return False
    
    def _is_company_line(self, line: str) -> bool:
        """Check if line contains company information"""
        return any(keyword in line.lower() for keyword in ['company', 'startup', 'at ', 'team'])
    
    def _is_location_line(self, line: str) -> bool:
        """Check if line contains location information"""
        return any(keyword in line.lower() for keyword in ['location', 'remote', 'san francisco', 
                                                           'new york', 'london', 'berlin', 'remote'])
    
    def _is_salary_line(self, line: str) -> bool:
        """Check if line contains salary information"""
        return '$' in line or 'salary' in line.lower() or 'k' in line.lower()
    
    def _clean_title(self, title: str) -> str:
        """Clean job title by removing markdown formatting
        
        Args:
            title: Raw title string
            
        Returns:
            Cleaned title
        """
        # Remove markdown formatting
        title = re.sub(r'^#+\s*', '', title)  # Remove heading markers
        title = re.sub(r'\*\*', '', title)     # Remove bold markers
        title = re.sub(r'\*', '', title)       # Remove italic markers
        return title.strip()
    
    def _extract_company(self, line: str) -> str:
        """Extract company name from line"""
        return line.strip()
    
    def _extract_location(self, line: str) -> str:
        """Extract location from line"""
        return line.strip()
    
    def _extract_salary(self, line: str) -> str:
        """Extract salary information from line"""
        return line.strip()
    
    def _has_required_fields(self, job_dict: dict) -> bool:
        """Check if job dictionary has required fields
        
        Args:
            job_dict: Job data dictionary
            
        Returns:
            True if required fields are present
        """
        return 'title' in job_dict and len(job_dict['title']) > 0
    
    def _create_job_from_dict(self, job_dict: dict, job_role: str, location: str) -> Optional[Job]:
        """Create Job object from parsed dictionary
        
        Args:
            job_dict: Dictionary containing job data
            job_role: Original job role search term (for fallback)
            location: Original location search term (for fallback)
            
        Returns:
            Job object or None if required fields missing
        """
        try:
            return Job(
                title=job_dict.get('title', job_role or 'N/A'),
                company=job_dict.get('company', 'N/A'),
                location=job_dict.get('location', location or 'Remote'),
                url=self.BASE_URL + '/roles',  # Generic URL since individual URLs may not be available
                salary=job_dict.get('salary', ''),
                description=job_dict.get('description', ''),
                source='Wellfound'
            )
        except Exception as e:
            logger.warning(f"Error creating job from dict: {e}")
            return None
