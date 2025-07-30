import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import type { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
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
      // 세션에 사용자 ID 추가
      if (session?.user) {
        session.user.id = token.sub!
      }
      return session
    },
    async jwt({ token, user, account }) {
      // 첫 로그인 시 사용자 정보 저장
      if (user) {
        token.id = user.id
      }
      return token
    }
  },
  pages: {
    signIn: '/', // 커스텀 로그인 페이지 (홈페이지)
    error: '/', // 에러 시 홈페이지로 리다이렉트
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30일
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }