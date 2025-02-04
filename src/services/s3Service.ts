"use server";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

// AWS環境変数 (デフォルト値も用意)
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
    secretAccessKey
  }
});

/**
 * 画像などのバイナリ(Buffer)を S3 に public-read でアップロードし、公開URLを返す。
 * @param fileBuf バイナリデータ (Buffer)
 * @param s3Key   S3 上の保存パス (例: "attachments/my-file.png")
 * @param contentType MIMEタイプ (デフォルト "image/png")
 *
 * 注意:
 *  - 同一 s3Key だと上書きになる。必要に応じて内部でユニークIDを付与可能(コメント参照)。
 */
export async function uploadImageBufferToS3(
  fileBuf: Buffer,
  s3Key: string,
  contentType: string = "image/png"
): Promise<string> {
  /**
   * 同じファイル名を使い回すと上書きリスクがあるため、
   * ユニークサフィックスを付与したい場合は下記のように実装:
   *
   * const uniqueSuffix = `${Date.now()}_${uuidv4()}`;
   * const ext = s3Key.split('.').pop() || 'png';
   * const baseName = s3Key.replace(/\.[^/.]+$/, '');
   * s3Key = `${baseName}_${uniqueSuffix}.${ext}`;
   */

  // S3に putObject
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      Body: fileBuf,
      ContentType: contentType,
      ACL: "public-read"
    })
  );

  // 公開URLを組み立てて返却
  // リージョンが "ap-northeast-1" の場合は下記のようなドメイン
  return `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;
}