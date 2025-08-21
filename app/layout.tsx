import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import NextAuthSessionProvider from '@/components/providers/session-provider'

export const metadata: Metadata = {
  title: 'Speak Log - 내 목소리로 만드는 매일의 성장',
  description: '음성 기반 개인 성장 플랫폼. 매일 밤 내일의 계획을 음성으로 녹음하고, 아침에 자신의 목소리로 들으며 동기부여를 받으세요.',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --font-sans: ${GeistSans.variable};
              --font-mono: ${GeistMono.variable};
            }
            html {
              font-family: ${GeistSans.style.fontFamily};
            }
            body {
              margin: 0;
              padding: 0;
            }
          `
        }} />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <NextAuthSessionProvider>
          {children}
        </NextAuthSessionProvider>
      </body>
    </html>
  )
}
