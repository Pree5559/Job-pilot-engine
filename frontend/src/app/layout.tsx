import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/components/AppHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JobFlow AI",
  description:
    "Unified Career Automation Platform: Scrape jobs, tailor resumes, and manage outreach.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          <AppHeader />
          <main className="flex-1">{children}</main>
          <footer className="border-t py-4 text-center text-xs text-muted-foreground">
            <p>
              JobFlow AI &mdash; Unified Job Discovery, Resume Customization, and Automated Outreach.
              Always verify generated content before use.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}