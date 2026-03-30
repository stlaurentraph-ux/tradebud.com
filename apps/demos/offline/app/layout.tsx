import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tracebud - Field App Prototype",
  description: "Interactive Prototype - EUDR Compliance Made Simple",
  icons: {
    icon: [
      { url: "/favicon-16x16-v6.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32-v6.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon-32x32-v6.png",
    apple: "/favicon-32x32-v6.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
