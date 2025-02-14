"use server";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
// 未使用の import { v4 as uuidv4 } from "uuid"; を削除

// AWS環境変数 (デフォルト値)
const region = process.env.AWS_REGION || "ap-northeast-1";
const bucket = process.env.AWS_S3_BUCKET_NAME || "ai-ehon-yusuke";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "FAKE_KEY";
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "FAKE_SECRET";

/**
 * S3クライアント生成
 */
const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

/**
 * 画像などのバイナリ(Buffer)を S3 に public-read でアップロードし、公開URLを返す。
 * @param fileBuf バイナリデータ (Buffer)
 * @param s3Key   S3 上の保存パス
 * @param contentType MIMEタイプ (デフォルト "image/png")
 */
export async function uploadImageBufferToS3(
  fileBuf: Buffer,
  s3Key: string,
  contentType: string = "image/png"
): Promise<string> {
  // putObject
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      Body: fileBuf,
      ContentType: contentType,
      ACL: "public-read",
    })
  );

  // 公開URLを組み立て
  return `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;
}