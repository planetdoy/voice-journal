import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === "development",
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      // 세션에 사용자 ID와 프로필 이미지 추가
      if (session?.user) {
        session.user.id = token.sub!
        // 프로필 이미지가 토큰에 있으면 세션에 추가
        if (token.picture) {
          session.user.image = token.picture as string
        }
      }
      return session
    },
    async jwt({ token, user, account, profile }) {
      // 첫 로그인 시 사용자 정보 저장
      if (user) {
        token.id = user.id
        token.picture = user.image // 프로필 이미지 URL 저장
      }
      
      // 구글에서 프로필 정보가 오는 경우
      if (profile && account?.provider === 'google') {
        token.picture = (profile as any).picture
      }
      
      return token
    }
  },
  pages: {
    signIn: '/', // 커스텀 로그인 페이지 (홈페이지)
    error: '/', // 에러 시 홈페이지로 리다이렉트
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30일
  }
}