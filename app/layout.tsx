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
          <main className="container mx-auto max-w-6xl px-4 py-10">
            <div
              className="relative z-0 overflow-hidden rounded-[2.75rem] border border-white/60 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.12)] ring-1 ring-black/5 backdrop-blur supports-[backdrop-filter]:bg-white/65 dark:border-white/10 dark:bg-slate-950/70 dark:ring-white/5 md:p-10"
            >
              <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-emerald-200/40 via-transparent to-rose-200/50 dark:from-emerald-400/10 dark:via-transparent dark:to-rose-500/20" />
              {children}
            </div>
          </main>

          {/* Toasts (Sonner via shadcn wrapper) */}
          <Toaster richColors position="top-right" duration={3000} />
        </ThemeProvider>
      </body>
    </html>
  );
}
