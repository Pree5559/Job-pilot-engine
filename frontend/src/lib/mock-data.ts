import type {
  ResumeProfile,
  JobDescriptionProfile,
  MatchScore,
  TailoredResume,
  GapAnalysis,
} from "./types";

export const mockResumeProfile: ResumeProfile = {
  contact: {
    name: "Alex Chen",
    email: "alex.chen@email.com",
    phone: "(555) 123-4567",
    linkedin: "linkedin.com/in/alexchen",
    website: "alexchen.dev",
    location: "San Francisco, CA",
  },
  summary:
    "Full-stack developer with 5+ years of experience building scalable web applications. Proficient in React, TypeScript, Node.js, and cloud services. Passionate about creating intuitive user interfaces and robust backend systems.",
  skills: [
    "JavaScript",
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Express",
    "Python",
    "PostgreSQL",
    "MongoDB",
    "AWS",
    "Docker",
    "Git",
    "REST APIs",
    "GraphQL",
    "Tailwind CSS",
  ],
  experience: [
    {
      company: "TechFlow Inc.",
      title: "Senior Full-Stack Developer",
      startDate: "Jan 2022",
      endDate: "Present",
      bullets: [
        "Built and maintained React-based dashboard serving 50K+ daily active users",
        "Designed and implemented RESTful APIs using Node.js and Express, reducing response times by 40%",
        "Led migration from monolith to microservices architecture, improving deployment frequency by 3x",
        "Mentored 4 junior developers through code reviews and pair programming sessions",
        "Optimized PostgreSQL queries resulting in 60% reduction in database load",
      ],
    },
    {
      company: "DataStream Solutions",
      title: "Full-Stack Developer",
      startDate: "Jun 2019",
      endDate: "Dec 2021",
      bullets: [
        "Developed real-time data visualization tools using React and D3.js",
        "Implemented CI/CD pipelines using GitHub Actions and Docker, reducing release cycle from 2 weeks to 3 days",
        "Built authentication and authorization system supporting 10K+ concurrent users",
        "Collaborated with UX team to redesign core product interface, improving user satisfaction scores by 25%",
      ],
    },
    {
      company: "WebCraft Agency",
      title: "Junior Developer",
      startDate: "Aug 2017",
      endDate: "May 2019",
      bullets: [
        "Developed responsive web applications for 15+ clients using React and Node.js",
        "Created reusable component library reducing development time by 30%",
        "Wrote unit and integration tests achieving 85% code coverage",
      ],
    },
  ],
  projects: [
    {
      name: "Open Source Contribution: React-Form-Builder",
      description: "A drag-and-drop form builder library for React applications",
      technologies: ["React", "TypeScript", "Rollup"],
      bullets: [
        "Added support for conditional field visibility, adopted by 200+ projects",
        "Reduced bundle size by 45% through code splitting and tree shaking",
      ],
    },
  ],
  education: [
    {
      institution: "University of California, Berkeley",
      degree: "Bachelor of Science",
      field: "Computer Science",
      graduationDate: "May 2017",
    },
  ],
  certifications: [
    {
      name: "AWS Certified Solutions Architect",
      issuer: "Amazon Web Services",
      date: "2023",
    },
  ],
};

export const mockJobDescriptionProfile: JobDescriptionProfile = {
  jobTitle: "Senior Full Stack Engineer",
  company: "NexGen Technologies",
  requiredSkills: [
    "React",
    "TypeScript",
    "Node.js",
    "PostgreSQL",
    "AWS",
    "Docker",
    "REST APIs",
    "Git",
  ],
  preferredSkills: [
    "GraphQL",
    "Kubernetes",
    "Python",
    "Next.js",
    "CI/CD",
    "Microservices",
  ],
  responsibilities: [
    "Design and build scalable full-stack web applications",
    "Collaborate with cross-functional teams to define and implement new features",
    "Mentor junior engineers and conduct code reviews",
    "Participate in architectural decisions and system design discussions",
    "Write comprehensive unit and integration tests",
    "Optimize application performance and database queries",
    "Deploy and monitor applications on cloud infrastructure",
  ],
  qualifications: [
    "5+ years of professional software engineering experience",
    "Strong proficiency in React, TypeScript, and Node.js",
    "Experience with cloud services (AWS preferred)",
    "Excellent problem-solving and communication skills",
  ],
  tools: [
    "React",
    "TypeScript",
    "Node.js",
    "AWS",
    "Docker",
    "PostgreSQL",
    "GitHub Actions",
    "Terraform",
  ],
  keywords: [
    "full-stack",
    "scalable",
    "microservices",
    "cloud",
    "CI/CD",
    "mentoring",
    "code review",
    "performance optimization",
    "agile",
    "REST",
  ],
  seniorityLevel: "Senior",
  domainSignals: ["SaaS", "Cloud Infrastructure", "Enterprise Software"],
};

export const mockOriginalScore: MatchScore = {
  overallScore: 68,
  skillCoverageScore: 75,
  responsibilityAlignmentScore: 65,
  keywordScore: 70,
  seniorityScore: 80,
  experienceYearsScore: 60,
  criticalMissingRequirements: [
    "Experience with Kubernetes is not mentioned",
    "CI/CD pipeline expertise could be stronger",
    "No mention of Terraform or infrastructure-as-code",
  ],
  explanation:
    "The resume shows strong alignment with required skills (React, TypeScript, Node.js, PostgreSQL, AWS). However, preferred skills like Kubernetes and CI/CD tooling are underrepresented. The seniority level matches well. Experience years are at the lower end of the 5+ year requirement.",
};

export const mockTailoredScore: MatchScore = {
  overallScore: 84,
  skillCoverageScore: 88,
  responsibilityAlignmentScore: 82,
  keywordScore: 85,
  seniorityScore: 80,
  experienceYearsScore: 60,
  criticalMissingRequirements: [
    "Kubernetes experience is still not mentioned",
    "Terraform experience not added (not present in original resume)",
  ],
  explanation:
    "After tailoring, skill coverage improved from 75 to 88 as rewrites better highlighted existing skills. Responsibility alignment improved significantly as bullet rewrites now use JD-specific terminology. Keyword alignment improved from 70 to 85. The remaining gaps are for skills not present in the original resume that cannot be fabricated.",
};

export const mockTailoredResume: TailoredResume = {
  tailoredSummary:
    "Senior Full-Stack Engineer with 5+ years of experience designing and building scalable web applications using React, TypeScript, and Node.js. Proven track record of leading microservices migrations, optimizing cloud infrastructure on AWS, and mentoring engineering teams.",
  tailoredSkills: [
    "React",
    "TypeScript",
    "Node.js",
    "Express",
    "PostgreSQL",
    "AWS",
    "Docker",
    "REST APIs",
    "GraphQL",
    "Next.js",
    "Python",
    "CI/CD",
    "Microservices",
    "Git",
    "Tailwind CSS",
  ],
  tailoredExperience: [
    {
      company: "TechFlow Inc.",
      title: "Senior Full-Stack Developer",
      bullets: [
        {
          original:
            "Built and maintained React-based dashboard serving 50K+ daily active users",
          tailored:
            "Designed and maintained a React-based dashboard serving 50K+ daily active users, ensuring high availability and performance on AWS infrastructure",
          changeReason:
            "Added AWS infrastructure context to better align with JD's cloud requirements",
          keywordsAddressed: ["React", "AWS", "scalable"],
          confidence: "high",
        },
        {
          original:
            "Designed and implemented RESTful APIs using Node.js and Express, reducing response times by 40%",
          tailored:
            "Designed and implemented RESTful APIs using Node.js and Express, reducing response times by 40% through query optimization and caching strategies",
          changeReason:
            "Added performance optimization detail to align with JD's optimization responsibilities",
          keywordsAddressed: [
            "REST APIs",
            "Node.js",
            "performance optimization",
          ],
          confidence: "high",
        },
        {
          original:
            "Led migration from monolith to microservices architecture, improving deployment frequency by 3x",
          tailored:
            "Led migration from monolith to microservices architecture on AWS, improving deployment frequency by 3x and enabling CI/CD pipeline integration",
          changeReason:
            "Added AWS and CI/CD context to better align with JD requirements",
          keywordsAddressed: [
            "microservices",
            "AWS",
            "CI/CD",
            "cloud",
          ],
          confidence: "high",
        },
        {
          original:
            "Mentored 4 junior developers through code reviews and pair programming sessions",
          tailored:
            "Mentored 4 junior engineers through code reviews and pair programming sessions, contributing to team velocity and code quality standards",
          changeReason:
            "Rephrased to emphasize mentoring impact, aligning with JD's mentoring responsibility",
          keywordsAddressed: ["mentoring", "code review"],
          confidence: "medium",
        },
        {
          original:
            "Optimized PostgreSQL queries resulting in 60% reduction in database load",
          tailored:
            "Optimized PostgreSQL queries and database schema design, resulting in 60% reduction in database load and improved application response times",
          changeReason:
            "Added database design context to strengthen alignment",
          keywordsAddressed: ["PostgreSQL", "performance optimization"],
          confidence: "high",
        },
      ],
    },
    {
      company: "DataStream Solutions",
      title: "Full-Stack Developer",
      bullets: [
        {
          original:
            "Developed real-time data visualization tools using React and D3.js",
          tailored:
            "Developed real-time data visualization tools using React and D3.js, deployed on AWS with automated CI/CD pipelines",
          changeReason:
            "Added deployment context to highlight cloud and CI/CD experience",
          keywordsAddressed: ["React", "AWS", "CI/CD"],
          confidence: "medium",
        },
        {
          original:
            "Implemented CI/CD pipelines using GitHub Actions and Docker, reducing release cycle from 2 weeks to 3 days",
          tailored:
            "Implemented CI/CD pipelines using GitHub Actions, Docker, and AWS, reducing release cycle from 2 weeks to 3 days",
          changeReason:
            "Added AWS to emphasize cloud infrastructure experience",
          keywordsAddressed: ["CI/CD", "Docker", "AWS"],
          confidence: "high",
        },
        {
          original:
            "Built authentication and authorization system supporting 10K+ concurrent users",
          tailored:
            "Designed and built a scalable authentication and authorization system supporting 10K+ concurrent users on AWS infrastructure",
          changeReason:
            "Added 'scalable' and AWS context to better match JD language",
          keywordsAddressed: ["scalable", "AWS"],
          confidence: "medium",
        },
        {
          original:
            "Collaborated with UX team to redesign core product interface, improving user satisfaction scores by 25%",
          tailored:
            "Collaborated with cross-functional teams to redesign core product interface, improving user satisfaction scores by 25%",
          changeReason:
            "Replaced UX team with cross-functional to align with JD's cross-functional collaboration requirement",
          keywordsAddressed: ["cross-functional"],
          confidence: "medium",
        },
      ],
    },
    {
      company: "WebCraft Agency",
      title: "Junior Developer",
      bullets: [
        {
          original:
            "Developed responsive web applications for 15+ clients using React and Node.js",
          tailored:
            "Developed scalable responsive web applications for 15+ clients using React and Node.js, delivering projects on time and within scope",
          changeReason:
            "Added 'scalable' keyword and delivery context",
          keywordsAddressed: ["scalable"],
          confidence: "medium",
        },
        {
          original:
            "Created reusable component library reducing development time by 30%",
          tailored:
            "Created reusable component library reducing development time by 30%, improving consistency across multiple client projects",
          changeReason: "Minor rephrase emphasizing impact",
          keywordsAddressed: [],
          confidence: "high",
        },
        {
          original:
            "Wrote unit and integration tests achieving 85% code coverage",
          tailored:
            "Wrote comprehensive unit and integration tests achieving 85% code coverage, ensuring code quality and reducing production defects",
          changeReason:
            "Emphasized alignment with JD's testing responsibility",
          keywordsAddressed: ["code review"],
          confidence: "high",
        },
      ],
    },
  ],
};

export const mockGapAnalysis: GapAnalysis = {
  gaps: [
    {
      name: "Kubernetes",
      importance: "medium",
      jdEvidence: "Preferred skill listed in job description",
      resumeEvidence: "Not mentioned anywhere in the resume",
      suggestedAction:
        "Prepare to address this in interview if you have any container orchestration experience",
      canSafelyAdd: false,
    },
    {
      name: "Terraform / Infrastructure as Code",
      importance: "medium",
      jdEvidence: "Tools section includes Terraform",
      resumeEvidence: "AWS and Docker mentioned, but no IaC tools",
      suggestedAction:
        "Add if you have experience with Terraform, CloudFormation, or similar tools",
      canSafelyAdd: false,
    },
    {
      name: "CI/CD Pipeline Expertise",
      importance: "high",
      jdEvidence: "Required for deployment and DevOps responsibilities",
      resumeEvidence:
        "CI/CD mentioned in 2nd role, could be more prominently featured",
      suggestedAction:
        "Add a CI/CD bullet to your most recent role if applicable",
      canSafelyAdd: true,
    },
    {
      name: "GraphQL",
      importance: "low",
      jdEvidence: "Listed as preferred skill",
      resumeEvidence: "Not mentioned in skills or experience",
      suggestedAction:
        "Mention in skills section if you have basic familiarity",
      canSafelyAdd: false,
    },
    {
      name: "System Design Experience",
      importance: "medium",
      jdEvidence: "Key responsibility: Participate in architectural decisions",
      resumeEvidence:
        "Mentioned microservices migration, but system design not explicitly stated",
      suggestedAction:
        "Add system design context to existing experience bullets if you participated in architecture discussions",
      canSafelyAdd: true,
    },
  ],
};