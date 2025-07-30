import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// S3 클라이언트 초기화
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.S3_BUCKET_NAME!

// 파일 업로드
export async function uploadToS3(
  file: File | Buffer,
  key: string,
  contentType: string
): Promise<string> {
  try {
    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })

    await s3Client.send(command)
    
    // S3 URL 반환
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-northeast-2'}.amazonaws.com/${key}`
  } catch (error) {
    console.error('S3 업로드 오류:', error)
    throw new Error('파일 업로드에 실패했습니다.')
  }
}

// 파일 삭제
export async function deleteFromS3(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    await s3Client.send(command)
  } catch (error) {
    console.error('S3 삭제 오류:', error)
    throw new Error('파일 삭제에 실패했습니다.')
  }
}

// Presigned URL 생성 (임시 접근 링크)
export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    return await getSignedUrl(s3Client, command, { expiresIn })
  } catch (error) {
    console.error('Presigned URL 생성 오류:', error)
    throw new Error('파일 접근 링크 생성에 실패했습니다.')
  }
}

// S3 키 생성 헬퍼 함수
export function generateS3Key(userId: string, fileName: string): string {
  const timestamp = Date.now()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_')
  return `voice-records/${userId}/${timestamp}_${sanitizedFileName}`
}

// S3 키에서 파일명 추출
export function extractFileNameFromKey(key: string): string {
  const parts = key.split('/')
  return parts[parts.length - 1]
}