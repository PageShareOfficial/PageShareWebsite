import type { Metadata } from "next";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
