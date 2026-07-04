import type { Metadata } from "next";
import { Archivo, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import "@/styles/globals.css";

/* Display face — variable, with the width axis the signature rides on */
const display = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-display",
  display: "swap",
});

const body = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-body",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hemanth A R — Software Engineer · AI × Security × Full Stack",
  description:
    "Don't read my resume. Verify it. Systems for threat intelligence, retrieval, and full-stack products — with the evidence one click away.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable} ${mono.variable}`}>
        {/* Hero entrance gate (Phase 2.5): set a class BEFORE paint so the
            stagger plays once per session with no flash. Skipped under
            reduced motion and on repeat visits this session. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var m=matchMedia('(prefers-reduced-motion: reduce)').matches;if(!m&&!sessionStorage.getItem('entrance')){document.documentElement.classList.add('do-entrance');sessionStorage.setItem('entrance','1');}}catch(e){}`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
