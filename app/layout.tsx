import { ReactNode } from 'react'
import ClientLayout from './ClientLayout'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Inventory Management',
  description: 'Next.js + Firebase + MUI Inventory App'
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang='en'>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
