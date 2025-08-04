import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/ui/navigation";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Primis EduCare - College Prep Excellence",
  description:
    "Transform your academic journey with comprehensive college prep courses, expert guidance, and proven success strategies.",
  keywords:
    "college prep, SAT prep, ACT prep, academic tutoring, college admissions, test preparation",
  authors: [{ name: "Primis EduCare Team" }],
  openGraph: {
    title: "Primis EduCare - College Prep Excellence",
    description:
      "Transform your academic journey with comprehensive college prep courses, expert guidance, and proven success strategies.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Primis EduCare - College Prep Excellence",
    description:
      "Transform your academic journey with comprehensive college prep courses, expert guidance, and proven success strategies.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570]">
            <Navigation />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
