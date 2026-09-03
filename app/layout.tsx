import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HavnLine — AI Receptionist for Small Business",
  description: "HavnLine answers your phones, books appointments, and knows your business — so you never miss a call again.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
