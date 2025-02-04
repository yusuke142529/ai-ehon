// src/app/settings/delete-account/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react"; // ★追加
import {
  Box,
  Heading,
  Text,
  Button,
  Spinner,
} from "@chakra-ui/react";
import { useTranslations, useLocale } from "next-intl";

/**
 * 退会画面: 注意喚起の後、退会APIを呼び出す
 */
export default function DeleteAccountPage() {
  const t = useTranslations("common");
  const locale = useLocale();  // ロケール取得
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleDelete() {
    // confirmダイアログ
    if (!confirm(t("deleteAccountConfirm"))) {
      return;
    }
    setIsLoading(true);

    try {
      // 1) 退会API呼び出し
      const res = await fetch("/api/user/deleteAccount", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || t("deleteAccountFailed"));
      }

      // 2) メッセージを表示
      alert(t("deleteAccountSuccess"));

      // 3) 退会直後にセッションを破棄 => ログアウト
      await signOut({ redirect: false });

      // 4) ロケール付きトップページへ移動
      router.push(`/${locale}`);
      // 例: ログインページに飛ばしたいなら → router.push(`/${locale}/auth/login`);

    } catch (err: any) {
      setFeedback(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Box maxW="600px" mx="auto" p={4}>
      <Heading size="lg" mb={4}>
        {t("deleteAccountTitle")} 
        {/* 例: "退会手続き" */}
      </Heading>
      <Text color="red.600" mb={6}>
        {t("deleteAccountCaution")}
        {/* 例: "退会するとアカウントに関連するデータはすべて削除されます..." */}
      </Text>

      <Button colorScheme="red" onClick={handleDelete} disabled={isLoading}>
        {isLoading ? <Spinner size="sm" /> : t("deleteAccountButton")}
        {/* 例: "退会する" */}
      </Button>

      {feedback && (
        <Text mt={4} color="red.500">
          {feedback}
        </Text>
      )}
    </Box>
  );
}