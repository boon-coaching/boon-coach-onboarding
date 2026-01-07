import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boon Coach Onboarding",
  description: "Coach onboarding portal for Boon Health",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
