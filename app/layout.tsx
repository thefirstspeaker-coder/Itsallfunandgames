import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Header } from '@/components/header';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: 'ItsAllFunAndGames',
  description: 'Find the perfect game for any group, age, and space.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#0c1324] text-[#dce1fb] antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
          themes={["dark"]}
          disableTransitionOnChange
        >
          <Header />
          <main className="mx-auto w-full max-w-[1280px] px-4 py-8 md:px-8 md:py-12">{children}</main>
          <Toaster richColors position="top-right" duration={3000} />
        </ThemeProvider>
      </body>
    </html>
  );
}
