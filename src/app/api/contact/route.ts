// src/app/api/contact/route.ts


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { uploadImageBufferToS3 } from "@/services/s3Service";
import { sendMail } from "@/lib/email";

// （例）許可する MIME タイプ, ファイルサイズ上限, テキスト長の上限
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_TEXT_LENGTH = 5000; // 本文の最大長例

/** 
 * 簡易 XSS エスケープ関数（例）
 * - sanitize-html や DOMPurify などを利用することを強く推奨
 */
function sanitizeText(text: string): string {
  // 本番運用では、より堅牢なライブラリを使って下さい。
  return text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // 1) フォームデータを取得
    const formData = await req.formData();
    const email = (formData.get("email")?.toString() || "").trim();
    const category = (formData.get("category")?.toString() || "").trim();
    // テキストは XSS 対策でエスケープ
    let content = (formData.get("content")?.toString() || "").trim();
    content = sanitizeText(content);

    // テキストの長さ制限
    if (content.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { message: `Content too long. Max ${MAX_TEXT_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const token = formData.get("gRecaptchaToken")?.toString() || "";

    // 複数添付に対応（File[] でまとめて取得）
    const files = formData.getAll("attachment") as File[];

    // 2) reCAPTCHA 検証
    if (!token) {
      return NextResponse.json(
        { message: "No reCAPTCHA token found" },
        { status: 400 }
      );
    }
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { message: "Server configuration error (missing RECAPTCHA_SECRET_KEY)" },
        { status: 500 }
      );
    }

    const verifyUrl = "https://www.google.com/recaptcha/api/siteverify";
    const verifyBody = new URLSearchParams({ secret: secretKey, response: token });
    const captchaRes = await fetch(verifyUrl, {
      method: "POST",
      body: verifyBody,
    });
    const captchaResult = await captchaRes.json();
    if (!captchaResult.success) {
      return NextResponse.json(
        { message: "reCAPTCHA verification failed", data: captchaResult },
        { status: 400 }
      );
    }

    // 3) スパム対策例（IP ベースで短時間の連投を制限）
    //    ※本番運用では Redis や rate limiting ライブラリなどを併用すると良い
    const ip = (
      req.headers.get("x-forwarded-for") ?? // Vercel等、リバースプロキシ下を想定
      req.ip ?? 
      "unknown"
    ).toString();
    
    // 直近 1 分以内に同じ IP からの投稿がある場合は 429 など返す例
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentInquiry = await prisma.contact_Inquiry.findFirst({
      where: {
        ip,
        createdAt: { gte: oneMinuteAgo },
      },
    });
    if (recentInquiry) {
      return NextResponse.json(
        { message: "You are sending inquiries too frequently. Please wait a bit." },
        { status: 429 }
      );
    }

    // 4) 添付ファイルのバリデーション & アップロード
    //    今回は複数ファイルを想定し、S3 などに順にアップロードして URL を格納する例
    const attachmentUrls: string[] = [];

    for (const file of files) {
      if (!file) continue;

      // MIME タイプチェック
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { message: `Unsupported file type: ${file.type}` },
          { status: 400 }
        );
      }

      // サイズチェック
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { message: `File size exceeds limit of ${MAX_FILE_SIZE} bytes.` },
          { status: 400 }
        );
      }

      // S3 へのアップロード
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split(".").pop() || "bin"; // 拡張子がない場合は bin など
      const cryptoKey = crypto.randomUUID(); // Node.js組み込みの crypto
      const s3Key = `attachments/${cryptoKey}.${ext}`;

      const uploadedUrl = await uploadImageBufferToS3(fileBuffer, s3Key, file.type);
      attachmentUrls.push(uploadedUrl);
    }

    // 5) DBに保存 (contact_Inquiry)
    const newInquiry = await prisma.contact_Inquiry.create({
      data: {
        email,
        category,
        content,
        // 配列を JSON 化して単一カラムに格納する例
        // ※正規化する場合は別テーブルにレコードを作るなどの手法も有り
        attachmentUrl: JSON.stringify(attachmentUrls),
        ip, // スパム対策で IP も保存
      },
    });

    // 6) 管理者宛メール送信
    await sendMail({
      to: "aiehonmaker.japan@gmail.com",
      subject: "[新規問い合わせ] (OAuth2)",
      html: `
=== 新しい問い合わせを受信しました ===<br /><br />
ID: ${newInquiry.id}<br />
Email: ${newInquiry.email}<br />
Category: ${newInquiry.category || "未指定"}<br />
Content:<br />
${newInquiry.content}<br /><br />
Attachments:<br />
${
  attachmentUrls.length > 0
    ? attachmentUrls.map((url) => `<div>${url}</div>`).join("")
    : "なし"
}<br />
CreatedAt: ${newInquiry.createdAt}
`,
    });

    // 7) ユーザー宛 (自動返信)
    if (email) {
      await sendMail({
        to: email,
        subject: "【自動返信】お問い合わせありがとうございます",
        html: `
${newInquiry.email} 様<br /><br />
お問い合わせありがとうございます。下記の内容で受付しました。<br /><br />
▼カテゴリ<br />
${newInquiry.category}<br /><br />
▼お問い合わせ内容<br />
${newInquiry.content}<br /><br />
▼ファイル添付<br />
${
  attachmentUrls.length > 0
    ? attachmentUrls.map((url) => `<div>${url}</div>`).join("")
    : "なし"
}<br /><br />
追って担当者よりご連絡いたしますので、しばらくお待ちください。
`,
      });
    }

    // 8) レスポンス
    return NextResponse.json({ message: "OK" });
  } catch (err) {
    console.error("Contact API Error:", err);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
