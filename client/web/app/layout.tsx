import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import { StoreProvider } from "@/lib/store/provider"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4100",
  ),
  title: "GameEngine - ゲームを作ろう、共有しよう",
  description:
    "ブロックベースのビジュアルプログラミングでゲームを作り、共有できるプラットフォーム",
  openGraph: {
    siteName: "GameEngine",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <StoreProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </StoreProvider>
      </body>
    </html>
  )
}
