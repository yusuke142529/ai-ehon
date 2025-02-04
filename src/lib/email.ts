// src/lib/email.ts
import { google } from "googleapis";
import nodemailer from "nodemailer";

/**
 * Google OAuth2 を使った Nodemailer 送信を共通化する関数
 * 
 * 必要な環境変数:
 * - GOOGLE_OAUTH_USER
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * - GOOGLE_OAUTH_REFRESH_TOKEN
 * - (任意) GOOGLE_OAUTH_REDIRECT / 既定で "http://localhost:3000"
 */
export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  // 1) OAuth2クライアント生成
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT ?? "http://localhost:3000" 
    // ↑ OAuth取得時に設定したリダイレクトURIを合わせてください
  );

  // 2) リフレッシュトークンをセット
  oAuth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
  });

  // 3) アクセストークン取得
  const accessTokenObj = await oAuth2Client.getAccessToken();
  const accessToken = accessTokenObj?.token;
  if (!accessToken) {
    throw new Error("Failed to get OAuth2 access token");
  }

  // 4) Nodemailer transporter をOAuth2設定で作成
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.GOOGLE_OAUTH_USER,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
      accessToken,
    },
  });

  // 5) 送信
  await transporter.sendMail({
    from: `"AIえほんメーカー" <${process.env.GOOGLE_OAUTH_USER}>`,
    to,
    subject,
    html,
  });
}
