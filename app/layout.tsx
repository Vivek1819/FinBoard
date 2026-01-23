import { GeistSans } from "geist/font/sans";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FinBoard",
  description: "Personal Financial Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.className} bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
