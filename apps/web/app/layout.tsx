import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import themeMeta from '@synnovator/ui/theme-meta';
import './globals.css';

export const metadata: Metadata = {
  title: 'Synnovator',
  description: 'AI Hackathon Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Critical Latin fonts — loaded first in a separate request */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Poppins:wght@500&family=Space+Grotesk:wght@700&display=swap"
          rel="stylesheet"
        />
        {/* Chinese font — separate request so it does not delay critical Latin fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme={themeMeta.defaultMode}
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
