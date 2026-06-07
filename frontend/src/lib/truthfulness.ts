import type { ResumeProfile, TailoredResume, TailoredBullet } from "./types";

export interface RiskFlag {
  type:
    | "new_employer"
    | "new_credential"
    | "new_technology"
    | "inflated_metric"
    | "inflated_scope"
    | "expert_claim_unsupported";
  bulletIndex: number;
  experienceIndex: number;
  description: string;
}

export interface AnnotatedTailoredResume extends TailoredResume {
  riskFlags: RiskFlag[];
}

/**
 * Extract all original bullet texts and skill/technology mentions from a resume.
 */
function extractOriginalText(resume: ResumeProfile): {
  allBullets: string[];
  allSkills: string[];
  allCompanies: string[];
  allCredentials: string[];
} {
  const allBullets: string[] = [];
  const allCompanies: string[] = [];
  const allCredentials: string[] = [];

  for (const exp of resume.experience) {
    allBullets.push(...exp.bullets);
    allCompanies.push(exp.company.toLowerCase().trim());
  }

  // Collect skills & technologies from resume
  const allSkills = resume.skills.map((s) => s.toLowerCase().trim());

  // Collect degree/certification info
  for (const edu of resume.education) {
    if (edu.degree) allCredentials.push(edu.degree.toLowerCase().trim());
    if (edu.field) allCredentials.push(edu.field.toLowerCase().trim());
  }
  for (const cert of resume.certifications) {
    if (cert.name) allCredentials.push(cert.name.toLowerCase().trim());
    if (cert.issuer) allCredentials.push(cert.issuer.toLowerCase().trim());
  }

  return { allBullets, allSkills, allCompanies, allCredentials };
}

/**
 * Check if a tailored bullet introduces a new technology not present in the original.
 */
function detectNewTechnology(
  tailoredText: string,
  originalText: string,
  originalSkills: string[]
): string | null {
  // Extract potential technology/capitalized terms from tailored text
  const techPattern = /\b([A-Z][A-Za-z0-9+#.]+(?:\s[A-Z][A-Za-z0-9+#.]+)?)\b/g;
  const matchedTechs = new Set(
    [...tailoredText.matchAll(techPattern)].map((m) => m[1].toLowerCase().trim())
  );

  const originalLower = originalText.toLowerCase();
  for (const tech of matchedTechs) {
    const isInOriginal =
      originalLower.includes(tech) ||
      originalSkills.some((s) => s.toLowerCase() === tech);
    if (!isInOriginal) {
      return tech;
    }
  }
  return null;
}

/**
 * Check for inflated metrics (numbers/percentages in tailored but not in original).
 */
function detectInflatedMetric(
  tailoredText: string,
  originalText: string
): string | null {
  const metricPattern = /\b(\d+[\.,]?\d*%?)\b/g;
  const tailoredMetrics = [...tailoredText.matchAll(metricPattern)].map(
    (m) => m[1]
  );
  const originalLower = originalText.toLowerCase();

  for (const metric of tailoredMetrics) {
    if (!originalLower.includes(metric.toLowerCase())) {
      return metric;
    }
  }
  return null;
}

/**
 * Check for inflated scope (leadership language added).
 */
function detectInflatedScope(
  tailoredText: string,
  originalText: string
): string | null {
  const leadershipTerms = [
    "led",
    "managed",
    "headed",
    "directed",
    "oversaw",
    "spearheaded",
    "orchestrated",
    "pioneered",
    "chaired",
    "supervised",
  ];
  const tailoredLower = tailoredText.toLowerCase();
  const originalLower = originalText.toLowerCase();

  for (const term of leadershipTerms) {
    if (tailoredLower.includes(term) && !originalLower.includes(term)) {
      return term;
    }
  }
  return null;
}

/**
 * Check for unsupported expert claims.
 */
function detectExpertClaim(
  tailoredText: string,
  originalText: string
): string | null {
  const expertPatterns = [
    /\bexpert\b/i,
    /\bmastery\b/i,
    /\bdeep\s+expertise\b/i,
    /\bworld-class\b/i,
    /\bindustry-leading\b/i,
    /\bproficient\s+in\s+all\b/i,
  ];
  const tailoredLower = tailoredText.toLowerCase();
  const originalLower = originalText.toLowerCase();

  for (const pattern of expertPatterns) {
    if (pattern.test(tailoredLower) && !pattern.test(originalLower)) {
      const match = tailoredLower.match(pattern);
      return match ? match[0] : "expert claim";
    }
  }
  return null;
}

/**
 * Check truthfulness of tailored resume against original resume.
 * Returns the tailored resume annotated with risk flags.
 */
export async function checkTruthfulness(
  original: ResumeProfile,
  tailored: TailoredResume
): Promise<AnnotatedTailoredResume> {
  const { allBullets, allSkills, allCompanies, allCredentials } =
    extractOriginalText(original);
  const originalCombinedText = allBullets.join(" ").toLowerCase();
  const riskFlags: RiskFlag[] = [];

  const annotatedExperience = tailored.tailoredExperience.map(
    (exp, experienceIndex) => {
      const annotatedBullets = exp.bullets.map((bullet, bulletIndex) => {
        const tailoredText = bullet.tailored;
        const originalText = bullet.original;

        // Check new employer
        if (experienceIndex < original.experience.length) {
          const origCompany = original.experience[experienceIndex].company.toLowerCase().trim();
          if (origCompany !== exp.company.toLowerCase().trim()) {
            riskFlags.push({
              type: "new_employer",
              bulletIndex,
              experienceIndex,
              description: `Company name changed from "${original.experience[experienceIndex].company}" to "${exp.company}"`,
            });
          }
        }

        // Check new credential (degree/cert)
        const credential = allCredentials.find((c) =>
          tailoredText.toLowerCase().includes(c)
        );
        if (
          credential &&
          !originalCombinedText.includes(credential)
        ) {
          riskFlags.push({
            type: "new_credential",
            bulletIndex,
            experienceIndex,
            description: `New credential "${credential}" appears in tailored text but not in original`,
          });
        }

        // Check new technology
        const newTech = detectNewTechnology(
          tailoredText,
          originalCombinedText,
          allSkills
        );
        if (newTech) {
          riskFlags.push({
            type: "new_technology",
            bulletIndex,
            experienceIndex,
            description: `New technology "${newTech}" introduced in tailored text`,
          });
        }

        // Check inflated metric
        const inflatedMetric = detectInflatedMetric(
          tailoredText,
          originalCombinedText
        );
        if (inflatedMetric) {
          riskFlags.push({
            type: "inflated_metric",
            bulletIndex,
            experienceIndex,
            description: `Metric "${inflatedMetric}" added in tailored version`,
          });
        }

        // Check inflated scope
        const inflatedScope = detectInflatedScope(tailoredText, originalText);
        if (inflatedScope) {
          riskFlags.push({
            type: "inflated_scope",
            bulletIndex,
            experienceIndex,
            description: `Leadership term "${inflatedScope}" added in tailored version`,
          });
        }

        // Check expert claim
        const expertClaim = detectExpertClaim(tailoredText, originalText);
        if (expertClaim) {
          riskFlags.push({
            type: "expert_claim_unsupported",
            bulletIndex,
            experienceIndex,
            description: `Expert-level claim "${expertClaim}" not supported in original`,
          });
        }

        // Adjust confidence based on risk flags
        const bulletRiskFlags = riskFlags.filter(
          (rf) =>
            rf.bulletIndex === bulletIndex &&
            rf.experienceIndex === experienceIndex
        );
        let adjustedConfidence = bullet.confidence;
        let adjustedRiskFlag = bullet.riskFlag;

        if (bulletRiskFlags.length > 0) {
          adjustedConfidence = "low";
          adjustedRiskFlag = bulletRiskFlags
            .map((rf) => rf.description)
            .join("; ");
        } else if (bullet.tailored !== bullet.original) {
          // Substantially rewritten but no risk flags → medium confidence
          adjustedConfidence = "medium";
        }

        const updatedBullet: TailoredBullet = {
          ...bullet,
          confidence: adjustedConfidence,
          riskFlag: adjustedRiskFlag,
        };
        return updatedBullet;
      });

      return {
        ...exp,
        bullets: annotatedBullets,
      };
    }
  );

  return {
    ...tailored,
    tailoredExperience: annotatedExperience,
    riskFlags,
  };
}