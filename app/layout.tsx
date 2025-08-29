// app/layout.tsx
import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Header } from '@/components/header';
import { Toaster } from "@/components/ui/sonner"; // <-- Import the new Toaster

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  // ... metadata
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ... head elements */}
      </head>
      <body className={`${inter.variable} ${outfit.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Header />
          <main className="container mx-auto px-4 py-8">{children}</main>
          <Toaster /> {/* <-- Add the Toaster here */}
        </ThemeProvider>
      </body>
    </html>
  );
}