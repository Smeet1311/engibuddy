import type { Metadata } from "next"
import "./globals.css"
import { ChatProvider } from "./chat-provider"

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
      <body>
        <ChatProvider>{children}</ChatProvider>
      </body>
    </html>
  )
}
