import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Synnovator',
  description: 'AI Hackathon Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Noto+Sans+SC:wght@400;500&family=Poppins:wght@500&family=Space+Grotesk:wght@700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-surface text-light-gray">
        {children}
      </body>
    </html>
  );
}
