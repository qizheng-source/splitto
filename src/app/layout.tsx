import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Splitto",
  description: "Split group expenses with no account required.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <footer className="bg-zinc-50 px-6 py-4 text-center text-xs text-zinc-400 dark:bg-black dark:text-zinc-600">
          Splitto is free, open, and private — no ads, no data selling, nothing tracked beyond what this group needs.
        </footer>
      </body>
    </html>
  );
}
