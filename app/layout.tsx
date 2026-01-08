import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HeartSync - Connect with Your Loved One',
  description: 'A beautiful platform for long-distance couples to connect, share moments, and create memories together.',
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

