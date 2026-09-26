// Mehrzad ArianMehr©
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Unlimited Claude — AI Chat",
  description:
    "Unlimited Claude — a fast, friendly AI chat assistant. Start a new chat, browse your history, and rename your profile.",
  keywords: [
    "Claude",
    "AI chat",
    "Unlimited Claude",
    "assistant",
    "Next.js",
    "TypeScript",
  ],
  authors: [{ name: "Unlimited Claude" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Unlimited Claude — AI Chat",
    description: "A fast, friendly AI chat assistant.",
    siteName: "Unlimited Claude",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Unlimited Claude — AI Chat",
    description: "A fast, friendly AI chat assistant.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Puter.js — free serverless cloud + AI + auth. Loaded async so the
            page renders first; the auth hook polls for `window.puter`. */}
        <Script
          src="https://js.puter.com/v2/"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors closeButton position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
