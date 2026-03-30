import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tracebud - Field App Prototype",
  description: "Interactive Prototype - EUDR Compliance Made Simple",
  icons: {
    icon: "/images/tracebud-logo.png",
    shortcut: "/images/tracebud-logo.png",
    apple: "/images/tracebud-logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
