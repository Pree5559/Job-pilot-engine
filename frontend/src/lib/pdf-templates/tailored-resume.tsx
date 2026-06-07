import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ResumeProfile, TailoredResume, JobDescriptionProfile } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.4,
    color: "#333",
  },
  header: {
    marginBottom: 16,
    borderBottom: "2 solid #2563EB",
    paddingBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: "row",
    fontSize: 9,
    color: "#555",
    gap: 12,
    flexWrap: "wrap",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2563EB",
    marginTop: 12,
    marginBottom: 6,
    borderBottom: "1 solid #ddd",
    paddingBottom: 2,
  },
  summaryText: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 8,
    color: "#444",
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 8,
  },
  skillBadge: {
    fontSize: 8,
    backgroundColor: "#EFF6FF",
    color: "#1E40AF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  experienceEntry: {
    marginBottom: 10,
  },
  companyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  companyName: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  title: {
    fontSize: 9,
    color: "#444",
    fontStyle: "italic",
    marginBottom: 2,
  },
  date: {
    fontSize: 9,
    color: "#666",
  },
  bullet: {
    fontSize: 9,
    lineHeight: 1.5,
    marginBottom: 1,
    paddingLeft: 12,
    textIndent: -8,
  },
  educationEntry: {
    marginBottom: 4,
    fontSize: 9,
  },
  educationDegree: {
    fontWeight: "bold",
    fontSize: 9,
  },
  disclaimer: {
    marginTop: 20,
    padding: 8,
    fontSize: 7,
    color: "#888",
    borderTop: "1 solid #ddd",
    textAlign: "center",
  },
});

interface TailoredResumePDFProps {
  resume: ResumeProfile;
  tailored: TailoredResume;
  jd: JobDescriptionProfile;
}

export function TailoredResumePDF({ resume, tailored, jd }: TailoredResumePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>
            {resume.contact?.name ?? "Candidate"}
          </Text>
          <View style={styles.contactRow}>
            {resume.contact?.email && <Text>{resume.contact.email}</Text>}
            {resume.contact?.phone && <Text>{resume.contact.phone}</Text>}
            {resume.contact?.linkedin && (
              <Text>{resume.contact.linkedin}</Text>
            )}
            {resume.contact?.location && (
              <Text>{resume.contact.location}</Text>
            )}
          </View>
        </View>

        {tailored.tailoredSummary && (
          <>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.summaryText}>{tailored.tailoredSummary}</Text>
          </>
        )}

        <Text style={styles.sectionTitle}>Skills</Text>
        <View style={styles.skillsContainer}>
          {tailored.tailoredSkills.map((skill, i) => (
            <Text key={i} style={styles.skillBadge}>
              {skill}
            </Text>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Experience</Text>
        {tailored.tailoredExperience.map((exp, i) => (
          <View key={i} style={styles.experienceEntry}>
            <View style={styles.companyHeader}>
              <Text style={styles.companyName}>{exp.company}</Text>
              <Text style={styles.date}>{exp.title}</Text>
            </View>
            {exp.bullets.map((bullet, j) => (
              <Text key={j} style={styles.bullet}>
                {"• "}{bullet.tailored}
              </Text>
            ))}
          </View>
        ))}

        {resume.education && resume.education.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Education</Text>
            {resume.education.map((edu, i) => (
              <View key={i} style={styles.educationEntry}>
                <Text style={styles.educationDegree}>
                  {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                </Text>
                <Text>
                  {edu.institution}{edu.graduationDate ? ` — ${edu.graduationDate}` : ""}
                </Text>
              </View>
            ))}
          </>
        )}

        {resume.certifications && resume.certifications.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {resume.certifications.map((cert, i) => (
              <Text key={i} style={styles.bullet}>
                {"• "}{cert.name}
              </Text>
            ))}
          </>
        )}

        <Text style={styles.disclaimer}>
          This tailored resume was generated by Resume Shapeshifter AI for the
          position of {jd.jobTitle}{jd.company ? ` at ${jd.company}` : ""}.
          {"\n"}The content is based on the original resume with AI-suggested
          improvements. Verify all information before use.
        </Text>
      </Page>
    </Document>
  );
}