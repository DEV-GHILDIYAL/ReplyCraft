import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReplyDesk",
  description: "Turn every review into a growth opportunity",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
  keywords: [
    "review management",
    "AI response",
    "reputation management",
    "Google reviews",
    "business reviews",
    "ReplyDesk",
  ],
  openGraph: {
    title: "ReplyDesk",
    description:
      "Turn every review into a growth opportunity. AI drafts perfect responses in seconds.",
    type: "website",
    url: "https://replydesk.io",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReplyDesk",
    description:
      "Turn every review into a growth opportunity. AI drafts perfect responses in seconds.",
  },
};

import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark`}
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-screen bg-rc-bg text-rc-text antialiased overflow-x-hidden">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#18181b",
              color: "#f4f4f5",
              border: "1px solid #27272a",
            },
          }}
        />
      </body>
    </html>
  );
}
