import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PyLint AI — Error Detection & Suggestion Tool",
  description: "AI-powered Python code error detection, bug analysis, and suggestion tool with VS Code-like interface.",
  keywords: ["PyLint AI", "Python", "Error Detection", "Code Analysis", "AI", "Next.js", "TypeScript", "Tailwind CSS"],
  authors: [{ name: "PyLint AI Team" }],
  openGraph: {
    title: "PyLint AI — Error Detection & Suggestion Tool",
    description: "AI-powered Python code error detection, bug analysis, and suggestion tool",
    url: "https://pylint-ai.com",
    siteName: "PyLint AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PyLint AI — Error Detection & Suggestion Tool",
    description: "AI-powered Python code error detection, bug analysis, and suggestion tool",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
