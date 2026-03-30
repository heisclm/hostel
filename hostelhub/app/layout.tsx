import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "HostelHub - Find Your Perfect Hostel",
  description:
    "The easiest way for Catholic University of Ghana students to find, compare, and book off-campus hostels.",
  keywords: [
    "hostel",
    "accommodation",
    "CUG",
    "Catholic University of Ghana",
    "student housing",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`}>
      <body className="min-h-screen flex flex-col antialiased">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
          <AuthProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#1e293b",
                  color: "#fff",
                  borderRadius: "12px",
                },
              }}
            />
            {children}
          </AuthProvider>
        
      </body>
    </html>
  );
}
