import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Summond.design — everything being built with AI, right now',
  description: 'An endless feed of apps, tools, games and interfaces conjured into existence with Claude, Cursor, Bolt and Lovable.',
  openGraph: {
    title: 'Summond.design',
    description: 'Everything being built with AI, right now.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
