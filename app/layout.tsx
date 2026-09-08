import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Big Uns Trading Cards",
  description:
    "Real bass catches turned into collectible trading cards built to be collected, traded, played, and competed with.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}