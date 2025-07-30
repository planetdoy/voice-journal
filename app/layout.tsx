import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import NextAuthSessionProvider from '@/components/providers/session-provider'

export const metadata: Metadata = {
  title: 'Voice Journal - 내 목소리로 만드는 매일의 성장',
  description: '음성 기반 개인 성장 플랫폼. 매일 밤 내일의 계획을 음성으로 녹음하고, 아침에 자신의 목소리로 들으며 동기부여를 받으세요.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <NextAuthSessionProvider>
          {children}
        </NextAuthSessionProvider>
      </body>
    </html>
  )
}
