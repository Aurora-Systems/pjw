import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PocketJobs — Find the Right Talent, Right in Your Pocket",
  description:
    "PocketJobs connects businesses with top freelance talent worldwide. Post jobs, hire experts, and get work done — all from one powerful platform.",
  keywords: [
    "freelance",
    "hire freelancers",
    "find work",
    "remote jobs",
    "PocketJobs",
    "job marketplace",
  ],
  openGraph: {
    title: "PocketJobs — Find the Right Talent, Right in Your Pocket",
    description:
      "Connect with top freelancers worldwide. Post jobs, hire experts, and get work done.",
    url: "https://pocketjobs.co",
    siteName: "PocketJobs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PocketJobs — Freelance Talent Marketplace",
    description:
      "Connect with top freelancers worldwide. Post jobs, hire experts, and get work done.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
