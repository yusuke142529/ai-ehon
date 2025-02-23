// src/lib/email.ts (修正版: アプリパスワード版)

import nodemailer from "nodemailer";

/**
 * Gmail SMTP + アプリパスワードを使った Nodemailer 送信を共通化する関数
 *
 * 必要な環境変数:
 * - GMAIL_USER   (例: example@gmail.com)
 * - GMAIL_APP_PASS  (上記アカウントの2段階認証 + アプリパスワード)
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
  // 1) 環境変数から認証情報を取得
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASS;

  if (!user || !pass) {
    throw new Error(
      "環境変数 GMAIL_USER または GMAIL_APP_PASS が設定されていません"
    );
  }

  // 2) NodemailerでSMTPトランスポートを作成
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });

  // 3) メール送信
  try {
    const result = await transporter.sendMail({
      from: `"AIえほんメーカー" <${user}>`, // 送信元
      to,     // 送信先
      subject,// 件名
      html,   // HTML本文
    });

    // 開発環境などでログを見たい場合
    if (process.env.NODE_ENV !== "production") {
      console.log("Mail send result:", result);
    }
  } catch (error) {
    console.error("Mail send error:", error);
    throw error;
  }
}