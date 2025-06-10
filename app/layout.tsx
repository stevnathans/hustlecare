import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Menu from "@/components/header/menu";
import { GlobalProvider } from "./GlobalProvider";
import Footer from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hustlecare | Start Any Business in Kenya",
  description:
    "Your smart partner in starting a business – explore ideas, requirements, and startup costs tailored for Kenya.",
  keywords: ["start business Kenya", "business requirements", "startup costs", "Hustlecare"],
  themeColor: "#16a34a",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    url: "https://hustlecare.com",
    title: "Hustlecare – Start Your Business in Kenya",
    description:
      "Discover business ideas, explore requirements, and calculate startup costs with Hustlecare.",
    images: [
      {
        url: "https://hustlecare.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Hustlecare – Start Your Business in Kenya",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hustlecare – Start Your Business in Kenya",
    description:
      "Everything you need to launch your business in Kenya: Ideas, requirements, costs, and tools.",
    images: ["https://hustlecare.com/og-image.jpg"],
    creator: "@hustlecare", // update if you have a Twitter handle
  },
  metadataBase: new URL("https://hustlecare.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="canonical" href="https://hustlecare.com/" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <GlobalProvider>
          <header className="sticky top-0 z-50">
            <div>
              <Menu />
            </div>
          </header>
          <main className="flex-grow">{children}</main>
          <Footer />
        </GlobalProvider>
      </body>
    </html>
  );
}