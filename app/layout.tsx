import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Max Power Home Page',
  description: '一个现代化的服务器监控页面（支持 Windows/Linux/macOS）',
  generator: 'Max Power and v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
