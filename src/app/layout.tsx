import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { ThemeToggle } from "@/components/ThemeToggle";
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
        <Script id="theme-boot" strategy="beforeInteractive">
          {`(function(){try{var s=localStorage.getItem("splitto:theme");var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);document.documentElement.classList.toggle("light",!d);}catch(e){}})();`}
        </Script>
        {children}
        <footer className="flex flex-col items-center gap-3 bg-zinc-50 px-6 py-4 text-center dark:bg-black">
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            Splitto is free, open, and private — no ads, no data selling, nothing tracked beyond what this group needs.
          </p>
          <ThemeToggle />
        </footer>
      </body>
    </html>
  );
}
