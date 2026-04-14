import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "EngiBuddy | AI Coach for Project-Based Learning",
  description: "Structured thinking companion for STEM/engineering projects",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
