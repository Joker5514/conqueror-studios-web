import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import Providers from "@/components/Providers";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://conquerorstudios.dev"),
  title: {
    default: "Conqueror Studios — Git-native AI agent platform",
    template: "%s · Conqueror Studios",
  },
  description:
    "Conqueror Studios is a Git-native, multi-tenant AI agent platform. We build instrumented multi-agent systems, federated agentic architectures, and voice-first interfaces.",
  openGraph: {
    title: "Conqueror Studios — Git-native AI agent platform",
    description:
      "Independent AI R&D. Multi-agent orchestration, voice-first interfaces, federated agentic architectures.",
    url: "https://conquerorstudios.dev",
    siteName: "Conqueror Studios",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Conqueror Studios",
    description: "Independent AI R&D Lab — Mobile, Alabama",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const isPreviewEnvironment =
    process.env.NODE_ENV !== "development" &&
    (process.env.VERCEL_TARGET_ENV === "preview" ||
      process.env.VERCEL_ENV === "preview");

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">
        {isPreviewEnvironment ? (
          <Script
            src="https://app.cofounder.co/agentation/widget.js"
            strategy="afterInteractive"
          />
        ) : null}
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
