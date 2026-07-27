import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Trust Traders | Top Chemical Factory & Wholesale Supplier",
    template: "%s | Trust Traders"
  },
  description: "Trust Traders is a leading chemical factory and wholesale supplier in Bangladesh. We offer premium quality chemicals, strict quality control, and fast delivery for industrial processing.",
  keywords: ["Trust Traders", "Chemical Factory", "Chemical Wholesale", "Bangladesh Chemical Supplier", "Dyeing Chemicals", "Textile Chemicals", "Industrial Chemicals"],
  authors: [{ name: "Trust Traders" }],
  openGraph: {
    title: "Trust Traders | Premium Chemical Factory",
    description: "Trust Traders is a leading chemical factory and wholesale supplier. Premium quality chemicals for your business.",
    url: "https://trusttraders.com",
    siteName: "Trust Traders",
    images: [
      {
        url: "/favicon.ico",
        width: 800,
        height: 600,
      }
    ],
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let globalSettings: any = {};
  let theme = null;
  let logoUrl = "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧪</text></svg>";
  try {
    const settingsPath = path.join(process.cwd(), 'settings.json');
    if (fs.existsSync(settingsPath)) {
      globalSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      if (globalSettings.theme) theme = globalSettings.theme;
      if (theme?.logoUrl) {
         logoUrl = theme.logoUrl;
      } else if (globalSettings.companyInfo?.logoUrl) {
         logoUrl = globalSettings.companyInfo.logoUrl;
      }
    }
  } catch (err) {}

  const themeStyles = theme ? `
    :root {
      --color-teal-50: color-mix(in srgb, ${theme.primary} 10%, white);
      --color-teal-100: color-mix(in srgb, ${theme.primary} 20%, white);
      --color-teal-200: color-mix(in srgb, ${theme.primary} 40%, white);
      --color-teal-300: color-mix(in srgb, ${theme.primary} 60%, white);
      --color-teal-400: color-mix(in srgb, ${theme.primary} 80%, white);
      --color-teal-500: color-mix(in srgb, ${theme.primary} 90%, white);
      --color-teal-600: ${theme.primary};
      --color-teal-700: color-mix(in srgb, ${theme.primary} 85%, black);
      --color-teal-800: color-mix(in srgb, ${theme.primary} 70%, black);
      --color-teal-900: color-mix(in srgb, ${theme.primary} 55%, black);
      --color-teal-950: color-mix(in srgb, ${theme.primary} 40%, black);
      --color-slate-50: ${theme.backgroundLight};
      --color-slate-100: color-mix(in srgb, ${theme.backgroundLight} 95%, black);
      --color-slate-200: color-mix(in srgb, ${theme.backgroundLight} 90%, black);
      --color-slate-700: color-mix(in srgb, ${theme.backgroundDark} 85%, white);
      --color-slate-800: color-mix(in srgb, ${theme.backgroundDark} 92%, white);
      --color-slate-900: ${theme.backgroundDark};
      --color-slate-950: color-mix(in srgb, ${theme.backgroundDark} 85%, black);
    }
  ` : '';

  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="icon" href={logoUrl} sizes="any" />
        <link rel="apple-touch-icon" href={logoUrl} />
        {themeStyles && <style dangerouslySetInnerHTML={{ __html: themeStyles }} />}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // Apply Dark Mode
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className={`${outfit.variable} ${inter.variable} min-h-full font-sans antialiased text-slate-900 dark:text-slate-50 transition-colors duration-0`}>
        <LayoutWrapper globalSettings={globalSettings}>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
