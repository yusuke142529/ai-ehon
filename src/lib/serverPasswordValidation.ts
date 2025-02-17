// lib/serverPasswordValidation.ts
import zxcvbn from "zxcvbn";

/**
 * サーバーサイド用: パスワードバリデーション関数
 * - 8文字以上
 * - 英大文字, 数字, 記号を1つ以上含む
 * - zxcvbn スコア3以上必須
 * 
 * @param password - ユーザーが入力したパスワード
 * @returns string - エラーメッセージ（問題ない場合は空文字 ""）
 */
export function validatePasswordServer(password: string): string {
    // 1) 8文字以上
    if (password.length < 8) {
        return "パスワードは8文字以上である必要があります。";
    }

    // 2) 英大文字, 数字, 記号が含まれているか
    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    // 英数字以外を「記号」として扱う例
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    if (!hasUpper || !hasDigit || !hasSpecial) {
        return "英大文字・数字・記号を各1文字以上含む必要があります。";
    }

    // 3) zxcvbn スコア判定
    const { score } = zxcvbn(password);
    if (score < 3) {
        return "パスワードが脆弱です。より複雑なパスワードを使用してください。";
    }

    // バリデーションをすべて通過
    return "";
}