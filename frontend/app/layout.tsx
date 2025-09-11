import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import "./globals.css";
import Navbar from "./_components/Navbar";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Spektr | Farm Management",
  description:
    "Spektr helps farmers predict risks, prevent diseases, and manage farms efficiently.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <footer className="text-center py-6 text-gray-400 bg-slate-950">
            © {new Date().getFullYear()} Spektr. All rights reserved.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
