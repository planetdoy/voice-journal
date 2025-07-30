import { withAuth } from "next-auth/middleware"

// 보호된 라우트 설정
export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      // /api/transcribe 경로는 로그인한 사용자만 접근 가능
      if (req.nextUrl.pathname.startsWith("/api/transcribe")) {
        return token !== null
      }
      // 다른 경로는 모두 허용
      return true
    },
  },
})

// 미들웨어가 적용될 경로 설정
export const config = {
  matcher: [
    "/api/transcribe/:path*",
    // 추후 보호할 경로 추가 가능
  ],
}