import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aura | Project Management",
  description: "A minimal project management system built for focused teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
