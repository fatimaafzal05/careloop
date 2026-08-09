import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareLoop — Family health organizer",
  description: "A private, thoughtful home for family health organization.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
