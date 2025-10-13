import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GST Invoice Generator | Per-Date Exchange Rates",
  description: "Generate GST-compliant export invoices with automatic per-invoice-date exchange rates. Supports Upwork CSV import, client grouping, and professional PDF generation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
