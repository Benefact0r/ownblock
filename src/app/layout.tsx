import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title:
    "OwnBlock — Real Estate & Operating Business Co-Ownership Protocol on Solana",
  description:
    "Fractional Co-Buying for Real Estate & Operating Businesses with Multi-Party SPV Legal Escrow and Housd On-Chain Credit Pool.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
