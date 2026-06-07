/// <reference types="jest" />

import { checkTruthfulness } from "@/lib/truthfulness";
import type { ResumeProfile, TailoredResume, TailoredBullet } from "@/lib/types";

const mockResume: ResumeProfile = {
  contact: {
    name: "Alex Chen",
    email: "alex@example.com",
    phone: undefined,
    linkedin: undefined,
    website: undefined,
    location: undefined,
  },
  summary: "Full stack developer with 5 years experience",
  skills: ["JavaScript", "TypeScript", "React", "Node.js", "Python"],
  experience: [
    {
      company: "TechCorp",
      title: "Senior Developer",
      startDate: "2020-01",
      endDate: "2023-12",
      bullets: [
        "Built REST APIs using Node.js and Express",
        "Developed React components for customer dashboard",
        "Managed a team of 3 junior developers",
      ],
    },
    {
      company: "StartupXYZ",
      title: "Developer",
      startDate: "2018-03",
      endDate: "2019-12",
      bullets: [
        "Created Python scripts for data processing",
        "Maintained MySQL database",
      ],
    },
  ],
  education: [
    {
      institution: "MIT",
      degree: "B.S.",
      field: "Computer Science",
      graduationDate: "2018",
    },
  ],
  certifications: [{ name: "AWS Developer", issuer: "Amazon", date: undefined }],
  projects: [],
};

describe("checkTruthfulness", () => {
  it("should detect new employer names", async () => {
    const tailored: TailoredResume = {
      tailoredSummary: mockResume.summary,
      tailoredSkills: mockResume.skills,
      tailoredExperience: [
        {
          company: "NewCompany",
          title: "Senior Developer",
          bullets: [
            {
              original: "Built REST APIs using Node.js and Express",
              tailored: "Built REST APIs using Node.js and Express",
              changeReason: "No change",
              keywordsAddressed: ["Node.js"],
              confidence: "high",
            },
          ],
        },
      ],
    };

    const result = await checkTruthfulness(mockResume, tailored);
    expect(result.riskFlags.length).toBeGreaterThan(0);
    expect(result.riskFlags[0].type).toBe("new_employer");
  });

  it("should detect new technologies introduced", async () => {
    const tailored: TailoredResume = {
      tailoredSummary: mockResume.summary,
      tailoredSkills: mockResume.skills,
      tailoredExperience: [
        {
          company: "TechCorp",
          title: "Senior Developer",
          bullets: [
            {
              original: "Built REST APIs using Node.js and Express",
              tailored: "Built REST APIs using Node.js and Express and Apache Kafka",
              changeReason: "Added Kafka",
              keywordsAddressed: ["Kafka", "streaming"],
              confidence: "medium",
            },
          ],
        },
      ],
    };

    const result = await checkTruthfulness(mockResume, tailored);
    expect(result.riskFlags.length).toBeGreaterThan(0);
    expect(result.riskFlags.some((rf) => rf.type === "new_technology")).toBe(true);
  });

  it("should detect inflated metrics", async () => {
    const tailored: TailoredResume = {
      tailoredSummary: mockResume.summary,
      tailoredSkills: mockResume.skills,
      tailoredExperience: [
        {
          company: "TechCorp",
          title: "Senior Developer",
          bullets: [
            {
              original: "Built REST APIs using Node.js and Express",
              tailored: "Built REST APIs using Node.js and Express serving 10,000+ requests per minute",
              changeReason: "Added metric",
              keywordsAddressed: ["performance"],
              confidence: "low",
              riskFlag: undefined,
            },
          ],
        },
      ],
    };

    const result = await checkTruthfulness(mockResume, tailored);
    const metricFlag = result.riskFlags.find((rf) => rf.type === "inflated_metric");
    expect(metricFlag).toBeDefined();
    expect(metricFlag!.description).toContain("10,000");
  });

  it("should detect inflated scope (leadership language added)", async () => {
    const tailored: TailoredResume = {
      tailoredSummary: mockResume.summary,
      tailoredSkills: mockResume.skills,
      tailoredExperience: [
        {
          company: "TechCorp",
          title: "Senior Developer",
          bullets: [
            {
              original: "Built REST APIs using Node.js and Express",
              tailored: "Spearheaded development of REST APIs using Node.js and Express",
              changeReason: "Stronger verb",
              keywordsAddressed: ["leadership"],
              confidence: "medium",
            },
          ],
        },
      ],
    };

    const result = await checkTruthfulness(mockResume, tailored);
    const scopeFlag = result.riskFlags.find((rf) => rf.type === "inflated_scope");
    expect(scopeFlag).toBeDefined();
    expect(scopeFlag!.description).toContain("spearheaded");
  });

  it("should detect unsupported expert claims", async () => {
    const tailored: TailoredResume = {
      tailoredSummary: mockResume.summary,
      tailoredSkills: mockResume.skills,
      tailoredExperience: [
        {
          company: "TechCorp",
          title: "Senior Developer",
          bullets: [
            {
              original: "Built REST APIs using Node.js and Express",
              tailored: "Expert in building REST APIs using Node.js and Express with deep expertise",
              changeReason: "Emphasized expertise",
              keywordsAddressed: ["expert"],
              confidence: "low",
            },
          ],
        },
      ],
    };

    const result = await checkTruthfulness(mockResume, tailored);
    const expertFlag = result.riskFlags.find(
      (rf) => rf.type === "expert_claim_unsupported"
    );
    expect(expertFlag).toBeDefined();
  });

  it("should set confidence to low when risk flags exist", async () => {
    const tailored: TailoredResume = {
      tailoredSummary: mockResume.summary,
      tailoredSkills: mockResume.skills,
      tailoredExperience: [
        {
          company: "TechCorp",
          title: "Senior Developer",
          bullets: [
            {
              original: "Built REST APIs using Node.js and Express",
              tailored: "Spearheaded building REST APIs using Node.js, Express, and Apache Kafka",
              changeReason: "Enhanced description",
              keywordsAddressed: ["Kafka"],
              confidence: "high",
            },
          ],
        },
      ],
    };

    const result = await checkTruthfulness(mockResume, tailored);
    expect(result.tailoredExperience[0].bullets[0].confidence).toBe("low");
    expect(result.tailoredExperience[0].bullets[0].riskFlag).toBeDefined();
  });

  it("should set confidence to medium for substantially rewritten bullets without risk flags", async () => {
    const tailored: TailoredResume = {
      tailoredSummary: mockResume.summary,
      tailoredSkills: mockResume.skills,
      tailoredExperience: [
        {
          company: "TechCorp",
          title: "Senior Developer",
          bullets: [
            {
              original: "Built REST APIs using Node.js and Express",
              tailored: "Developed and maintained RESTful microservices using Node.js and Express framework",
              changeReason: "More detailed description",
              keywordsAddressed: ["microservices", "Node.js"],
              confidence: "high",
            },
          ],
        },
      ],
    };

    const result = await checkTruthfulness(mockResume, tailored);
    expect(result.tailoredExperience[0].bullets[0].confidence).toBe("medium");
  });

  it("should keep high confidence for unchanged bullets", async () => {
    const tailored: TailoredResume = {
      tailoredSummary: mockResume.summary,
      tailoredSkills: mockResume.skills,
      tailoredExperience: [
        {
          company: "TechCorp",
          title: "Senior Developer",
          bullets: [
            {
              original: "Built REST APIs using Node.js and Express",
              tailored: "Built REST APIs using Node.js and Express",
              changeReason: "No change needed",
              keywordsAddressed: ["Node.js"],
              confidence: "high",
            },
          ],
        },
      ],
    };

    const result = await checkTruthfulness(mockResume, tailored);
    expect(result.tailoredExperience[0].bullets[0].confidence).toBe("high");
    expect(result.riskFlags.length).toBe(0);
  });

  it("should handle no changes case", async () => {
    const tailored: TailoredResume = {
      tailoredSummary: mockResume.summary,
      tailoredSkills: mockResume.skills,
      tailoredExperience: mockResume.experience.map((exp) => ({
        company: exp.company,
        title: exp.title,
        bullets: exp.bullets.map(
          (b) =>
            ({
              original: b,
              tailored: b,
              changeReason: "No change",
              keywordsAddressed: [],
              confidence: "high",
            } as TailoredBullet)
        ),
      })),
    };

    const result = await checkTruthfulness(mockResume, tailored);
    expect(result.riskFlags.length).toBe(0);
    expect(result.tailoredExperience.length).toBe(mockResume.experience.length);
  });

  it("should detect new credentials", async () => {
    const tailored: TailoredResume = {
      tailoredSummary: mockResume.summary,
      tailoredSkills: mockResume.skills,
      tailoredExperience: [
        {
          company: "TechCorp",
          title: "Senior Developer",
          bullets: [
            {
              original: "Built REST APIs using Node.js and Express",
              tailored: "Built REST APIs using Node.js and Express with PhD in Machine Learning",
              changeReason: "Added credential",
              keywordsAddressed: ["ML"],
              confidence: "low",
            },
          ],
        },
      ],
    };

    const result = await checkTruthfulness(mockResume, tailored);
    const credentialFlag = result.riskFlags.find(
      (rf) => rf.type === "new_credential"
    );
    expect(credentialFlag).toBeDefined();
  });
});