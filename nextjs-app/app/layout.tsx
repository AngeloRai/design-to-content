import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Design System App',
  description: 'AI-Generated Component Library from Figma Designs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}