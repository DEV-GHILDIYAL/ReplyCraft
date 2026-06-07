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
  title: "ReplyDesk — AI Review Response & Reputation Manager",
  description:
    "Turn every review into a growth opportunity. AI drafts perfect responses in seconds. You approve in one click. Manage reviews from Google, Yelp, Facebook, and more.",
  keywords: [
    "review management",
    "AI response",
    "reputation management",
    "Google reviews",
    "business reviews",
    "ReplyDesk",
  ],
  openGraph: {
    title: "ReplyDesk — AI Review Response & Reputation Manager",
    description:
      "AI drafts perfect responses to your business reviews. You approve in one click.",
    type: "website",
    url: "https://replydesk.io",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReplyDesk — AI Review Response & Reputation Manager",
    description:
      "AI drafts perfect responses to your business reviews. You approve in one click.",
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
      <body className="min-h-screen bg-rc-bg text-rc-text antialiased">
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
