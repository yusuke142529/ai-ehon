"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";

/**
 * アカウントリンク設定画面
 *   - 既にログイン中のユーザーが Googleログインを追加リンクする等
 */
export default function AccountLinkPage() {
  const t = useTranslations("accountLink");
  const locale = useLocale();
  const { data: session, status } = useSession();
  const [accounts, setAccounts] = useState<
    { provider: string; providerAccountId: string }[]
  >([]);
  const [message, setMessage] = useState("");

  // ログイン中なら、紐づけ済みアカウント一覧を取得
  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/user/link-oauth")
        .then((res) => res.json())
        .then((data) => {
          if (data.accounts) setAccounts(data.accounts);
        })
        .catch((err) => console.error(err));
    }
  }, [status]);

  const googleLinked = accounts.some((acc) => acc.provider === "google");

  // 「Googleアカウントをリンクする」ボタン押下
  const handleLinkGoogle = async () => {
    setMessage(t("linkingGoogle"));
    // Google OAuthへリダイレクト
    signIn("google", {
      callbackUrl: `/${locale}/settings/account-link`,
    });
  };

  if (status !== "authenticated") {
    return <p>{t("notLoggedIn")}</p>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>{t("pageTitle")}</h1>
      <p>{t("currentLinked")}</p>
      <ul>
        {accounts.map((acc, i) => (
          <li key={i}>
            {acc.provider} ({acc.providerAccountId})
          </li>
        ))}
      </ul>

      <hr style={{ margin: "16px 0" }} />

      {!googleLinked ? (
        <button onClick={handleLinkGoogle}>
          {t("linkGoogleButton")}
        </button>
      ) : (
        <p>{t("alreadyLinkedGoogle")}</p>
      )}

      {message && <p>{message}</p>}
    </div>
  );
}