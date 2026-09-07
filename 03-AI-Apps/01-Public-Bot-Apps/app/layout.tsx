import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prisma AIRS Demo - Retail Portal',
  description: 'Public-facing retail demo app secured by Palo Alto Networks Prisma AIRS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}