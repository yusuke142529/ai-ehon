// src/lib/sendRegistrationEmail.ts
import { sendMail } from "./email";

/**
 * 新規登録完了時に送信するメールを作成・送信するヘルパー関数
 * 
 * @param to   宛先メールアドレス
 * @param name ユーザーの名前
 */
export async function sendRegistrationEmail(to: string, name: string) {
    // 件名と本文を自由にカスタマイズください
    const subject = "【AIえほんメーカー】登録が完了しました";
    const html = `
    <p>こんにちは、${name}様</p>
    <p>この度はご登録いただきありがとうございます。</p>
    <p>ご不明点等ございましたらお気軽にお問い合わせください。</p>
    <br>
    <p>今後ともどうぞよろしくお願いいたします。</p>
  `;

    await sendMail({ to, subject, html });
}