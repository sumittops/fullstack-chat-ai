import type { Metadata } from 'next'
import { SWRConfig } from 'swr'
import localFont from 'next/font/local'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'MeowwChat',
  description: 'Chat with an AI that makes you go `Meowww`',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en'>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SWRConfig
          value={{ revalidateOnFocus: true, dedupingInterval: 5000, shouldRetryOnError: true, errorRetryCount: 3 }}
        >
          <AuthProvider>{children}</AuthProvider>
        </SWRConfig>
      </body>
    </html>
  )
}
