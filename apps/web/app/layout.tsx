import type { Metadata } from "next";
import { Barlow_Condensed, DM_Mono, Instrument_Sans, Newsreader } from "next/font/google";
import "./globals.css";

// Barlow Condensed and DM Mono ship as static weights only (no variable-font
// instance on Google Fonts) — weight must be an explicit list. Instrument
// Sans and Newsreader do ship variable, so `weight: "variable"` covers the
// whole range in one file. latin-ext (not just latin) on all four, or
// Turkish diacritics (Ş ş Ğ ğ İ ı Ç ç) fall back to a system font mid-string.
const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin", "latin-ext"],
  weight: "variable",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin", "latin-ext"],
  weight: "variable",
  axes: ["opsz"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Vidi",
  description: "Spor için log, puan ve yorum.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${barlowCondensed.variable} ${instrumentSans.variable} ${newsreader.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink">{children}</body>
    </html>
  );
}
