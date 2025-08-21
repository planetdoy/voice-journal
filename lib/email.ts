import nodemailer from "nodemailer"

// 이메일 설정 (환경변수 사용)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// 일일 사용량 리포트 이메일 템플릿
export function generateDailyUsageEmailTemplate(data: any) {
  const {
    date,
    totalUsers,
    totalRequests,
    totalInputTokens,
    totalOutputTokens,
    totalTokens,
    totalCost,
    userSummary,
  } = data

  const formatCurrency = (amount: number) => `$${amount.toFixed(4)}`
  const formatNumber = (num: number) => num.toLocaleString()

  return {
    subject: `Voice Journal - 일일 토큰 사용량 리포트 (${date})`,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat-card { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-value { font-size: 24px; font-weight: bold; color: #667eea; }
        .stat-label { color: #6c757d; font-size: 14px; }
        .user-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .user-table th, .user-table td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
        .user-table th { background-color: #f8f9fa; font-weight: 600; }
        .cost-highlight { color: #28a745; font-weight: bold; }
        .footer { text-align: center; color: #6c757d; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🤖 Voice Journal 일일 사용량 리포트</h1>
        <p>${date} 사용량 통계</p>
      </div>

      <div class="summary">
        <h2>📊 전체 요약</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${totalUsers}</div>
            <div class="stat-label">활성 사용자</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${formatNumber(totalRequests)}</div>
            <div class="stat-label">총 요청 수</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${formatNumber(totalTokens)}</div>
            <div class="stat-label">총 토큰 사용량</div>
          </div>
          <div class="stat-card">
            <div class="stat-value cost-highlight">${formatCurrency(totalCost)}</div>
            <div class="stat-label">총 비용 (USD)</div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${formatNumber(totalInputTokens)}</div>
            <div class="stat-label">입력 토큰</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${formatNumber(totalOutputTokens)}</div>
            <div class="stat-label">출력 토큰</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${formatCurrency(totalCost * 1300)}</div>
            <div class="stat-label">총 비용 (원화)</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${totalUsers > 0 ? formatCurrency(totalCost / totalUsers) : '$0.0000'}</div>
            <div class="stat-label">사용자당 평균 비용</div>
          </div>
        </div>
      </div>

      ${userSummary.length > 0 ? `
      <div>
        <h2>👥 사용자별 상세</h2>
        <table class="user-table">
          <thead>
            <tr>
              <th>사용자</th>
              <th>총 토큰</th>
              <th>입력 토큰</th>
              <th>출력 토큰</th>
              <th>비용 (USD)</th>
              <th>주요 기능</th>
            </tr>
          </thead>
          <tbody>
            ${userSummary.map((user: any) => `
            <tr>
              <td>
                <strong>${user.name}</strong><br>
                <small>${user.email}</small>
              </td>
              <td>${formatNumber(user.totalTokens)}</td>
              <td>${formatNumber(user.totalInputTokens)}</td>
              <td>${formatNumber(user.totalOutputTokens)}</td>
              <td class="cost-highlight">${formatCurrency(user.totalCost)}</td>
              <td>
                ${Object.entries(user.endpoints).map(([endpoint, count]) => 
                  `${endpoint}: ${count}회`
                ).join('<br>')}
              </td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      <div class="footer">
        <p>Voice Journal 자동 생성 리포트 • ${new Date().toLocaleString('ko-KR')}</p>
        <p>이 리포트는 매일 정오 12:00에 자동으로 생성됩니다.</p>
      </div>
    </body>
    </html>
    `,
    text: `
Voice Journal 일일 토큰 사용량 리포트 (${date})

전체 요약:
- 활성 사용자: ${totalUsers}명
- 총 요청 수: ${formatNumber(totalRequests)}회
- 총 토큰 사용량: ${formatNumber(totalTokens)}개
- 총 비용: ${formatCurrency(totalCost)} (약 ${Math.round(totalCost * 1300)}원)

사용자별 상세:
${userSummary.map((user: any) => `
${user.name} (${user.email}):
  - 토큰: ${formatNumber(user.totalTokens)}개
  - 비용: ${formatCurrency(user.totalCost)}
  - 사용 기능: ${Object.entries(user.endpoints).map(([endpoint, count]) => `${endpoint}(${count}회)`).join(', ')}
`).join('')}

생성 시간: ${new Date().toLocaleString('ko-KR')}
    `
  }
}

// 이메일 전송 함수
export async function sendEmail(to: string, subject: string, html: string, text?: string) {
  try {
    const info = await transporter.sendMail({
      from: `"Voice Journal" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    })

    console.log("이메일 전송 성공:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("이메일 전송 실패:", error)
    return { success: false, error: error }
  }
}