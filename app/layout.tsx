// app/layout.tsx
import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Header } from '@/components/header';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'ItsAllFunAndGames',
  description: 'Find the perfect game for any group, age, and space.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${outfit.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="itsallfunandgames-theme"
        >
          <Header />
          <main className="container mx-auto px-4 py-8">{children}</main>

          {/* Toasts (Sonner via shadcn wrapper) */}
          <Toaster richColors position="top-right" duration={3000} />
        </ThemeProvider>
      </body>
    </html>
  );
}
