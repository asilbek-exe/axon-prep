import type { Metadata } from "next";
import "./globals.css";
import "./minimal.css";
import { sitePath } from "@/lib/paths";
export const metadata: Metadata = {
  title: "Axon Prep — Your Interview Workspace",
  description:
    "Prepare with intention. Answer with confidence. An interview preparation workspace with answers saved in your browser.",
  icons: { icon: sitePath("/favicon.svg") },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light">
      <body>{children}</body>
    </html>
  );
}
