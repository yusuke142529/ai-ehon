"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { Box, Heading, Text, Button } from "@chakra-ui/react";

// OAuth アカウントの型定義
interface OAuthAccount {
  provider: string;
  providerAccountId: string;
}

export default function AccountLinkPage() {
  const t = useTranslations("accountLink");
  const locale = useLocale();
  // session を使っていない場合は下記のように status のみ取得
  const { status } = useSession();

  const [accounts, setAccounts] = useState<OAuthAccount[]>([]);
  const [message, setMessage] = useState("");

  // ログイン中なら、紐づけ済みアカウント一覧を取得
  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/user/link-oauth")
        .then((res) => res.json())
        .then((data) => {
          if (data.accounts) setAccounts(data.accounts);
        })
        .catch((error) => console.error(error));
    }
  }, [status]);

  const googleLinked = accounts.some((acc) => acc.provider === "google");

  // 「Googleアカウントをリンクする」ボタン押下
  const handleLinkGoogle = async () => {
    setMessage(t("linkingGoogle"));
    signIn("google", {
      callbackUrl: `/${locale}/settings/account-link`,
    });
  };

  if (status !== "authenticated") {
    return <Text>{t("notLoggedIn")}</Text>;
  }

  return (
    <Box p={4}>
      <Heading as="h1" mb={4}>
        {t("pageTitle")}
      </Heading>

      <Text mb={2}>{t("currentLinked")}</Text>
      <Box as="ul" mb={4}>
        {accounts.map((acc, index) => (
          <Box as="li" key={index}>
            {acc.provider} ({acc.providerAccountId})
          </Box>
        ))}
      </Box>

      <Box as="hr" my={4} />
      {!googleLinked ? (
        <Button onClick={handleLinkGoogle} colorScheme="blue">
          {t("linkGoogleButton")}
        </Button>
      ) : (
        <Text>{t("alreadyLinkedGoogle")}</Text>
      )}

      {message && <Text mt={2}>{message}</Text>}
    </Box>
  );
}