// src/lib/email-ses.ts

import { SESClient, SendEmailCommand, SendEmailCommandInput, SendTemplatedEmailCommand } from "@aws-sdk/client-ses";

// SESクライアント初期化 - シンプルな実装
const sesClient = new SESClient({
  region: process.env.SES_REGION || process.env.AWS_REGION || "ap-northeast-1",
  credentials: {
    accessKeyId: process.env.SES_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.SES_SECRET_ACCESS_KEY || "",
  },
});

/**
 * Amazon SESを使用してメールを送信する関数
 * 
 * @param to - 宛先メールアドレス（単一またはカンマ区切りの複数アドレス）
 * @param subject - メールの件名
 * @param html - メールのHTML本文
 * @param from - 送信元アドレス（未指定時は環境変数から取得）
 * @returns - 送信結果（成功時はMessageId含む）
 */
export async function sendMail({
  to,
  subject,
  html,
  from = process.env.SES_SENDER_EMAIL,
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  // 環境変数チェック
  if (!from) {
    throw new Error("送信元メールアドレス(SES_SENDER_EMAIL)が設定されていません");
  }

  // 送信パラメータの構築
  const params: SendEmailCommandInput = {
    Source: from,
    Destination: {
      ToAddresses: to.includes(",") ? to.split(",").map(email => email.trim()) : [to],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: html,
          Charset: "UTF-8",
        },
      },
    },
  };

  try {
    // 開発環境の場合はログ出力
    if (process.env.NODE_ENV !== "production") {
      console.log("SES送信パラメータ:", JSON.stringify(params, null, 2));
    }

    // メール送信
    const command = new SendEmailCommand(params);
    const result = await sesClient.send(command);
    
    // 開発環境ではログ出力
    if (process.env.NODE_ENV !== "production") {
      console.log("SESメール送信結果:", result);
    }
    
    return result;
  } catch (error) {
    console.error("SESメール送信エラー:", error);
    throw error;
  }
}

/**
 * プレーンテキスト本文とHTML本文の両方を送信する拡張関数
 */
export async function sendMailWithTextAndHtml({
  to,
  subject,
  textContent,
  htmlContent,
  from = process.env.SES_SENDER_EMAIL,
}: {
  to: string;
  subject: string;
  textContent: string;
  htmlContent: string;
  from?: string;
}) {
  if (!from) {
    throw new Error("送信元メールアドレス(SES_SENDER_EMAIL)が設定されていません");
  }

  const params: SendEmailCommandInput = {
    Source: from,
    Destination: {
      ToAddresses: to.includes(",") ? to.split(",").map(email => email.trim()) : [to],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: "UTF-8",
      },
      Body: {
        Text: {
          Data: textContent,
          Charset: "UTF-8",
        },
        Html: {
          Data: htmlContent,
          Charset: "UTF-8",
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    return await sesClient.send(command);
  } catch (error) {
    console.error("SESメール送信エラー:", error);
    throw error;
  }
}

/**
 * SESテンプレートを使用したメール送信
 * 注: AWSコンソールで事前にテンプレートを作成しておく必要があります
 */
export async function sendTemplatedEmail({
  to,
  templateName,
  templateData,
  from = process.env.SES_SENDER_EMAIL,
}: {
  to: string | string[];
  templateName: string;
  templateData: Record<string, unknown>; // any型をunknown型に変更
  from?: string;
}) {
  if (!from) {
    throw new Error("送信元メールアドレス(SES_SENDER_EMAIL)が設定されていません");
  }

  const params = {
    Source: from,
    Destination: {
      ToAddresses: Array.isArray(to) ? to : [to],
    },
    Template: templateName,
    TemplateData: JSON.stringify(templateData),
  };

  try {
    const command = new SendTemplatedEmailCommand(params);
    return await sesClient.send(command);
  } catch (error) {
    console.error("SESテンプレートメール送信エラー:", error);
    throw error;
  }
}