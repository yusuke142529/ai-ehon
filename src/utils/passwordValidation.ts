// utils/passwordValidation.ts
import zxcvbn from "zxcvbn";

/**
 * パスワードのバリデーション結果型
 */
export type PasswordValidationResult = {
    /**
     * エラーメッセージ（空文字の場合はエラーなし）
     */
    error: string;

    /**
     * zxcvbn で算定したパスワード強度スコア (0 ~ 4)
     * - 0: 非常に弱い
     * - 1: 弱い
     * - 2: 普通
     * - 3: 強め
     * - 4: 非常に強い
     */
    score: number;
};

/**
 * パスワードのバリデーション関数
 * - 8文字以上
 * - 英大文字、数字、記号を少なくとも1つずつ含む
 * - zxcvbn スコア3以上を必須 (スコア2以下ならエラー)
 *
 * @param password ユーザーが入力したパスワード
 * @param t i18n 翻訳関数 (例: useTranslations("common"))
 * @returns { error: string; score: number } エラー文言とスコア
 */
export function validatePassword(
    password: string,
    t: (key: string) => string
): PasswordValidationResult {
    // 1. 8文字以上
    if (password.length < 8) {
        return {
            error: t("passwordTooShort"), // 例: "パスワードは8文字以上である必要があります"
            score: 0,
        };
    }

    // 2. 大文字・数字・記号のチェック
    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    // 記号の定義は要件に応じて調整してください（ここでは英数字以外を全て記号扱い）
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (!hasUpper || !hasDigit || !hasSpecial) {
        return {
            error: t("passwordMustInclude"),
            // 例: "英大文字と数字、記号を少なくとも1つ含む必要があります"
            score: 0,
        };
    }

    // 3. zxcvbnによるスコア判定
    const result = zxcvbn(password);
    if (result.score < 3) {
        return {
            error: t("passwordTooWeak"),
            // 例: "パスワードが弱すぎます（もう少し複雑にしてください）"
            score: result.score,
        };
    }

    // すべて通ればOK
    return {
        error: "",
        score: result.score,
    };
}