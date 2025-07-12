import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navigation } from "@/components/ui/navigation";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Primis Educare - College Preparation Excellence",
  description:
    "Comprehensive college preparation courses including SAT, IELTS, TOEFL prep and college counseling services.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
