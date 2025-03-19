//src/lib/sendRegistrationEmail.ts

import { sendMail } from "./email-ses"; // SES版のインポートに変更

/**
 * 新規登録（仮登録）メール送信
 * - verifyUrl を案内してメール認証を完了してもらう。
 */
export async function sendRegistrationEmail(
  to: string,
  name: string,
  verifyUrl: string
) {
  const subject = "【AIえほんメーカー】仮登録のお知らせ";
  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
        <p>こんにちは、<strong>${name}</strong>様</p>
        <p>この度は「AIえほんメーカー」に仮登録いただき、誠にありがとうございます。</p>
        <p>本登録を完了するには、下記のリンクをクリックしてメールアドレスを認証してください。</p>
        <p>
          <a href="${verifyUrl}" style="color: #1a73e8;" target="_blank">
            メールアドレスを認証する
          </a>
        </p>
        <p>もしこのメールに覚えがない場合は、破棄していただいて問題ございません。</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="font-size: 14px; color: #888;">
          ※このメールは自動送信されています。返信いただいても対応できませんので、ご了承ください。<br>
          サポート: <a href="mailto:aiehonmaker.japan@gmail.com" style="color: #1a73e8;">aiehonmaker.japan@gmail.com</a>
        </p>
      </body>
    </html>
  `;

  await sendMail({ to, subject, html });
}