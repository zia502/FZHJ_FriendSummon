import type { Metadata } from "next"
import "./globals.css"
import { TopNav } from "@/components/top-nav"

export const metadata: Metadata = {
  title: "风之痕迹好友招募",
  description: "风之痕迹好友招募",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <TopNav />
        {children}
      </body>
    </html>
  )
}
