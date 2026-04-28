import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ResaleIQ | Rejected Economy',
  description: 'Reseller compliance, profit, and listing intelligence platform'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
