import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type {
  ResumeProfile,
  TailoredResume,
  MatchScore,
  JobDescriptionProfile,
  GapAnalysis,
} from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.4,
    color: "#333",
  },
  header: {
    marginBottom: 14,
    borderBottom: "2 solid #2563EB",
    paddingBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: "#666",
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#2563EB",
    marginTop: 10,
    marginBottom: 5,
    borderBottom: "1 solid #ddd",
    paddingBottom: 2,
  },
  subSectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#444",
    marginTop: 6,
    marginBottom: 4,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  scoreLabel: {
    width: 60,
    fontSize: 8,
    color: "#555",
  },
  scoreBarContainer: {
    flex: 1,
    height: 14,
    backgroundColor: "#eee",
    borderRadius: 3,
    marginHorizontal: 8,
    position: "relative",
  },
  scoreBar: {
    height: 14,
    borderRadius: 3,
  },
  scoreValue: {
    width: 24,
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "right",
  },
  scoreLegend: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
    fontSize: 7,
    color: "#666",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 3,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    marginBottom: 4,
  },
  badge: {
    fontSize: 7,
    backgroundColor: "#EFF6FF",
    color: "#1E40AF",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  listItem: {
    fontSize: 8,
    marginBottom: 1,
    paddingLeft: 8,
    textIndent: -5,
  },
  comparisonRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  column: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 3,
    padding: 6,
  },
  columnHeader: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 4,
    borderBottom: "1 solid #eee",
    paddingBottom: 2,
    textAlign: "center",
  },
  companyHeaderComp: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 1,
    marginTop: 3,
  },
  bulletText: {
    fontSize: 7,
    lineHeight: 1.4,
    marginBottom: 1,
    paddingLeft: 4,
  },
  changedBullet: {
    backgroundColor: "#F0FDF4",
    padding: 1,
    borderRadius: 2,
    fontSize: 7,
    lineHeight: 1.4,
    marginBottom: 1,
    paddingLeft: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8f8f8",
    borderBottom: "1 solid #ddd",
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #eee",
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  tableColGap: { width: "35%", fontSize: 8 },
  tableColImportance: { width: "20%", fontSize: 8 },
  tableColAction: { width: "45%", fontSize: 8 },
  importanceHigh: { color: "#DC2626", fontWeight: "bold" },
  importanceMedium: { color: "#D97706", fontWeight: "bold" },
  importanceLow: { color: "#6B7280" },
  footer: {
    marginTop: 30,
    borderTop: "1 solid #ddd",
    paddingTop: 6,
  },
});

interface ComparisonPDFProps {
  original: ResumeProfile;
  tailored: TailoredResume;
  originalScore: MatchScore;
  tailoredScore: MatchScore;
  jd: JobDescriptionProfile;
  gaps: GapAnalysis;
}

function ScoreBar({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: string;
}) {
  return (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <View style={styles.scoreBarContainer}>
        <View
          style={[
            styles.scoreBar,
            {
              width: `${score}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
      <Text style={styles.scoreValue}>{score}</Text>
    </View>
  );
}

export function ComparisonPDF({
  original,
  tailored,
  originalScore,
  tailoredScore,
  jd,
  gaps,
}: ComparisonPDFProps) {
  return (
    <Document>
      {/* Page 1: Header + Score Comparison + JD Summary */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Resume Shapeshifter — Comparison Report
          </Text>
          <Text style={styles.subtitle}>
            {jd.jobTitle}{jd.company ? ` at ${jd.company}` : ""}
          </Text>
          <Text style={styles.subtitle}>
            Generated: {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Score Comparison</Text>
        <View style={{ marginBottom: 6 }}>
          <ScoreBar
            label="Original"
            score={originalScore.overallScore}
            color="#9CA3AF"
          />
          <ScoreBar
            label="Tailored"
            score={tailoredScore.overallScore}
            color="#2563EB"
          />
        </View>
        <View style={styles.scoreLegend}>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: "#9CA3AF" }]} />
            <Text>Original Resume</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: "#2563EB" }]} />
            <Text>Tailored Resume</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Job Description Summary</Text>
        <Text style={styles.subSectionTitle}>Required Skills</Text>
        <View style={styles.badgeContainer}>
          {jd.requiredSkills.map((skill, i) => (
            <Text key={i} style={styles.badge}>
              {skill}
            </Text>
          ))}
          {jd.requiredSkills.length === 0 && (
            <Text style={{ fontSize: 8, color: "#999" }}>None listed</Text>
          )}
        </View>

        {jd.preferredSkills.length > 0 && (
          <>
            <Text style={styles.subSectionTitle}>Preferred Skills</Text>
            <View style={styles.badgeContainer}>
              {jd.preferredSkills.map((skill, i) => (
                <Text key={i} style={styles.badge}>
                  {skill}
                </Text>
              ))}
            </View>
          </>
        )}

        <Text style={styles.subSectionTitle}>Responsibilities</Text>
        {jd.responsibilities.map((resp, i) => (
          <Text key={i} style={styles.listItem}>
            {"• "}{resp}
          </Text>
        ))}

        {originalScore.explanation && (
          <>
            <Text style={styles.sectionTitle}>Scoring Explanation</Text>
            <Text style={{ fontSize: 8, lineHeight: 1.5, color: "#555" }}>
              {originalScore.explanation}
            </Text>
          </>
        )}
      </Page>

      {/* Page 2+: Side-by-Side Comparison */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Side-by-Side Comparison</Text>
        {tailored.tailoredExperience.map((exp, expIdx) => {
          const origExp = original.experience[expIdx];
          return (
            <View key={expIdx} style={{ marginBottom: 10 }}>
              <Text style={styles.companyHeaderComp}>
                {exp.company} — {exp.title}
              </Text>
              <View style={styles.comparisonRow}>
                <View style={styles.column}>
                  <Text style={styles.columnHeader}>Original</Text>
                  {origExp?.bullets.map((bullet, bIdx) => {
                    const tailoredBullet = exp.bullets[bIdx];
                    const isChanged =
                      tailoredBullet && tailoredBullet.tailored !== bullet;
                    return (
                      <Text
                        key={bIdx}
                        style={isChanged ? styles.changedBullet : styles.bulletText}
                      >
                        {"• "}{bullet}
                      </Text>
                    );
                  })}
                </View>
                <View style={styles.column}>
                  <Text style={styles.columnHeader}>Tailored</Text>
                  {exp.bullets.map((bullet, bIdx) => {
                    const origBullet = origExp?.bullets[bIdx] ?? "";
                    const isChanged = bullet.tailored !== origBullet;
                    return (
                      <Text
                        key={bIdx}
                        style={isChanged ? styles.changedBullet : styles.bulletText}
                      >
                        {"• "}{bullet.tailored}
                      </Text>
                    );
                  })}
                </View>
              </View>
            </View>
          );
        })}
      </Page>

      {/* Last Page: Gap Analysis */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Gap Analysis</Text>
        {gaps.gaps.length === 0 ? (
          <Text style={{ fontSize: 8, color: "#666" }}>
            No significant gaps identified.
          </Text>
        ) : (
          <>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableColGap, { fontWeight: "bold" }]}>Gap</Text>
              <Text style={[styles.tableColImportance, { fontWeight: "bold" }]}>Importance</Text>
              <Text style={[styles.tableColAction, { fontWeight: "bold" }]}>Suggested Action</Text>
            </View>
            {gaps.gaps.map((gap, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.tableColGap}>{gap.name}</Text>
                <Text
                  style={[
                    styles.tableColImportance,
                    gap.importance === "high"
                      ? styles.importanceHigh
                      : gap.importance === "medium"
                      ? styles.importanceMedium
                      : styles.importanceLow,
                  ]}
                >
                  {gap.importance}
                </Text>
                <Text style={styles.tableColAction}>{gap.suggestedAction}</Text>
              </View>
            ))}
          </>
        )}
      </Page>

      <View style={styles.footer}>
        <Text style={{ fontSize: 6, color: "#999", textAlign: "center" }}>
          Resume Shapeshifter — Comparison Report — AI-generated content, verify before use.
        </Text>
      </View>
    </Document>
  );
}