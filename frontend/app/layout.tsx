/**
 * @file layout.tsx
 * @description Root layout component for the entire application.
 * Defines the base HTML structure, global styles, and metadata.
 */

import "./globals.css";
import type { Metadata } from "next";

/**
 * Metadata configuration for the application.
 * Used by Next.js to populate the <head> section of the HTML.
 */
export const metadata: Metadata = {
  title: "Silicon Systems HelpDesk - Enterprise Issue Management",
  description: "Smart ticket management system with real-time analytics and team collaboration",
};

/**
 * RootLayout component that wraps all pages in the application.
 * 
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to be rendered within the layout.
 * @returns {JSX.Element} The rendered root layout.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}