import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PageShare",
  description: "A social platform for sharing thoughts and ideas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
