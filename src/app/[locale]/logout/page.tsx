//src/app/[locale]/logout/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Box, Spinner, Text } from "@chakra-ui/react";
import { useTranslations, useLocale } from "next-intl";

/**
 * ログアウト用ページ
 * - このページにアクセスすると自動的に signOut() を呼び、トップへリダイレクト
 */
export default function LogoutPage() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  useEffect(() => {
    // signOut -> redirect: falseにして自前で遷移
    signOut({ redirect: false }).then(() => {
      // ログアウト完了後、ロケール付きトップページへ遷移
      router.push(`/${locale}`);
    });
  }, [router, locale]);

  return (
    <Box textAlign="center" mt={20}>
      <Spinner />
      <Text mt={4} fontSize="sm" color="gray.600">
        {t("logoutProcessing")}
        {/* 例: "ログアウトしています…" */}
      </Text>
    </Box>
  );
}