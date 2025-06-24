import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pre-Flight Review',
  description: 'AI-powered code review assistant that runs before you submit a pull request',
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
