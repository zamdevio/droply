import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import { ThemeProvider } from '@/lib/theme'
import { Layout } from '@/components/layout'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Droply - Anonymous File Sharing',
  description: 'Secure, anonymous file sharing with enterprise-grade security. Built for developers, designed for everyone.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Get theme from localStorage or system preference
                  const theme = localStorage.getItem('theme') || 'system';
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  
                  // Determine effective theme
                  const effective = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
                  
                  // Apply theme immediately to prevent flash
                  if (effective === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                  
                  // Store the effective theme for consistency
                  localStorage.setItem('effective-theme', effective);
                  
                  // Listen for system theme changes
                  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                    if (localStorage.getItem('theme') === 'system') {
                      const newEffective = e.matches ? 'dark' : 'light';
                      if (newEffective === 'dark') {
                        document.documentElement.classList.add('dark');
                        document.documentElement.style.colorScheme = 'dark';
                      } else {
                        document.documentElement.classList.remove('dark');
                        document.documentElement.style.colorScheme = 'light';
                      }
                      localStorage.setItem('effective-theme', newEffective);
                    }
                  });
                } catch (_) {
                  // Fallback to system preference if localStorage fails
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (prefersDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  }
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <Layout>
            {children}
          </Layout>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
