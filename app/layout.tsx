import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Evently — Discover Events",
    template: "%s | Evently",
  },
  description:
    "Discover events, book tickets, and manage check-ins with Evently.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f7f7f8] text-slate-800 antialiased">
        {children}
      </body>
    </html>
  );
}
