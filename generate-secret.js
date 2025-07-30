// NextAuth Secret 생성 스크립트
const crypto = require('crypto');

const secret = crypto.randomBytes(32).toString('base64');
console.log('\n=== NextAuth Secret 생성 완료 ===');
console.log('\n아래 값을 .env.local 파일의 NEXTAUTH_SECRET에 복사하세요:');
console.log('\n' + secret + '\n');
console.log('=================================\n');