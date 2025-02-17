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
 * - GOOGLE_OAUTH_REDIRECT  (例: "http://localhost:3000/api/auth/callback/google")
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
  // 1) 環境変数からリダイレクト URI を取得（必須）
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT;
  if (!redirectUri) {
    throw new Error("環境変数 GOOGLE_OAUTH_REDIRECT が設定されていません");
  }

  // 2) OAuth2 クライアント生成
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  // 3) リフレッシュトークンをセット
  oAuth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
  });

  // 4) アクセストークン取得
  const accessTokenResponse = await oAuth2Client.getAccessToken();
  const accessToken = accessTokenResponse?.token;
  if (!accessToken) {
    throw new Error("OAuth2 アクセストークンの取得に失敗しました");
  }

  // 5) Nodemailer transporter を OAuth2 設定で作成
  //    開発環境（NODE_ENV !== "production"）のみ logger / debug を有効にしています
  const isDev = process.env.NODE_ENV !== "production";
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
    logger: isDev, 
    debug: isDev,
  });

  // 6) メール送信
  try {
    const result = await transporter.sendMail({
      from: `"AIえほんメーカー" <${process.env.GOOGLE_OAUTH_USER}>`,
      to,
      subject,
      html,
    });
    // 開発中であれば送信結果をコンソールに出力
    if (isDev) {
      console.log("Mail send result:", result);
    }
  } catch (error) {
    // エラー内容をコンソールに表示
    console.error("Mail send error:", error);
    throw error;
  }
}
