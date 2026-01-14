import type { Metadata } from "next";
import "./globals.css";
import ErrorBoundaryWrapper from "@/components/ErrorBoundaryWrapper";

export const metadata: Metadata = {
  title: "PageShare",
  description: "A social platform for sharing thoughts and ideas about Stock markets, NFT's and Crypto",
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
          {children}
        </ErrorBoundaryWrapper>
      </body>
    </html>
  );
}
