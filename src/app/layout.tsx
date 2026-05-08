import type { Metadata } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "RivalsCodex",
    template: "%s | RivalsCodex",
  },
  description:
    "The definitive in-match Marvel Rivals hero codex for abilities, combos, and role guides.",
  metadataBase: new URL("https://rivalscodex.com"),
  openGraph: {
    title: "RivalsCodex",
    description:
      "Learn Marvel Rivals hero mechanics fast with a high-performance reference codex.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RivalsCodex",
    description:
      "Learn Marvel Rivals hero mechanics fast with a high-performance reference codex.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${barlowCondensed.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans text-foreground">{children}</body>
    </html>
  );
}
