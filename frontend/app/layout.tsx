import type { Metadata } from "next";
import "./globals.css";
import ErrorBoundaryWrapper from "@/components/ErrorBoundaryWrapper";
import { AuthProvider } from "@/contexts/AuthContext";
import { siteConfig } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "PageShare - Social Platform for Stocks, NFTs & Crypto",
    template: "%s | PageShare",
  },
  description: siteConfig.description,
  keywords: [
    "stocks",
    "crypto",
    "NFT",
    "social trading",
    "investing",
    "financial social network",
  ],
  authors: [{ name: "PageShare" }],
  creator: "PageShare",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: "PageShare - Social Platform for Stocks, NFTs & Crypto",
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: "PageShare - Social platform for stocks, NFTs and crypto",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PageShare - Social Platform for Stocks, NFTs & Crypto",
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-black">
      <body className="bg-black">
        <ErrorBoundaryWrapper>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  );
}
