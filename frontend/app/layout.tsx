import type { Metadata } from "next";
import "./globals.css";
import ErrorBoundaryWrapper from "@/components/ErrorBoundaryWrapper";
import OfflineBanner from "@/components/OfflineBanner";
import OfflineOverlay from "@/components/OfflineOverlay";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { AuthProvider } from "@/contexts/AuthContext";
import { OfflineOverlayProvider } from "@/contexts/OfflineOverlayContext";
import { BookmarkProvider } from "@/contexts/BookmarkContext";
import { ContentFiltersProvider } from "@/contexts/ContentFiltersContext";
import { WatchlistProvider } from "@/contexts/WatchlistContext";
import { siteConfig } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "PageShare - Social Platform for Crypto Traders and Investors",
    template: "%s | PageShare",
  },
  description: siteConfig.description,
  keywords: [
    "crypto",
    "Binance",
    "Coinbase",
    "Kucoin",
    "FTX",
    "Crypto",
    "Bitcoin",
    "Ethereum",
    "Solana",
    "Polygon",
    "Web3",
    "crypto trading",
    "investing",
    "crypto social network",
  ],
  authors: [{ name: "PageShare" }],
  creator: "PageShare",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: "PageShare - Social Platform for Crypto Traders and Investors",
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: "PageShare - Social platform for Crypto Traders and Investors",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PageShare - Social Platform for Crypto Traders and Investors",
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  robots: {
    index: true,
    follow: true,
  },
  // Favicons: 48x48 and 96x96 are required by Google for search result display.
  icons: {
    icon: [
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
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
          <ServiceWorkerRegistration />
          <OfflineBanner />
          <OfflineOverlayProvider>
            <OfflineOverlay />
            <AuthProvider>
              <BookmarkProvider>
                <ContentFiltersProvider>
                  <WatchlistProvider>
                    {children}
                  </WatchlistProvider>
                </ContentFiltersProvider>
              </BookmarkProvider>
            </AuthProvider>
          </OfflineOverlayProvider>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  );
}
