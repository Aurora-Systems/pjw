import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

// Poppins is self-hosted by next/font at build time (downloaded once, then served from our
// own origin), so there's no runtime dependency on Google Fonts.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const SITE_URL = process.env.APP_PUBLIC_URL || "https://pocketjobs.co";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "PocketJobs — Hire trusted hands, fast",
    template: "%s · PocketJobs",
  },
  description:
    "PocketJobs connects Zimbabweans with verified local service providers — cleaners, plumbers, electricians, movers, tutors and more. Book trusted help near you, pay in cash.",
  keywords: [
    "services Zimbabwe",
    "hire near me Harare",
    "cleaners plumbers electricians",
    "handyman Zimbabwe",
    "gig work Zimbabwe",
    "PocketJobs",
  ],
  openGraph: {
    title: "PocketJobs — Hire trusted hands, fast",
    description:
      "Find verified local service providers across Zimbabwe. Book trusted help near you, pay in cash.",
    url: SITE_URL,
    siteName: "PocketJobs",
    type: "website",
    locale: "en_ZW",
  },
  twitter: {
    card: "summary_large_image",
    title: "PocketJobs — Hire trusted hands, fast",
    description: "Find verified local service providers across Zimbabwe. Book trusted help near you.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
