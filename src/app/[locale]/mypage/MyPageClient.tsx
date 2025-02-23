"use client";

import React from "react";
import { useUserSWR } from "@/hook/useUserSWR";
import { useTranslations, useLocale } from "next-intl";
import {
  Box,
  Heading,
  Text,
  Avatar,
  Flex,
  Stack, // ★ HStack から Stack に変更
  Button,
  Spinner,
  useToast,
  useBreakpointValue,
} from "@chakra-ui/react";
import Link from "next/link";
import EditProfileModal from "./EditProfileModal";
import useSWR from "swr";
import { signIn } from "next-auth/react";

// OAuth アカウントの型定義
interface OAuthAccount {
  provider: string;
  // 必要に応じて他のフィールドを追加
}

type OAuthAccountsData = {
  accounts: OAuthAccount[];
};

export default function MyPageClient() {
  // 1. フックは必ずコンポーネントの冒頭で呼び出す
  const t = useTranslations("common");
  const locale = useLocale();
  const toast = useToast();

  // ユーザーデータ取得用
  const { user, isLoading, error } = useUserSWR();

  // OAuth アカウント情報取得用
  const {
    data: accountsData,
    error: accountsError,
    isLoading: accountsLoading,
    mutate: mutateAccounts,
  } = useSWR<OAuthAccountsData>("/api/user/link-oauth", async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(t("fetchAccountsError"));
    return res.json();
  });

  // レスポンシブなアバターサイズ（例）
  const avatarSize = useBreakpointValue({ base: "lg", md: "xl" });

  // 2. ローディング・エラーチェックなどの分岐はフック呼び出し「後」にまとめて行う
  if (isLoading || accountsLoading) {
    // ユーザーデータ or OAuthアカウント情報どちらかがローディング中の場合
    return (
      <Box>
        <Spinner size="sm" mr={2} />
        {t("loading")}
      </Box>
    );
  }

  if (error) {
    return (
      <Box color="red.500">
        {t("errorOccurred")}: {(error as Error).message}
      </Box>
    );
  }
  if (accountsError) {
    return (
      <Box color="red.500">
        {t("errorOccurred")}: {(accountsError as Error).message}
      </Box>
    );
  }

  if (!user) {
    return <Box>{t("userNotFound")}</Box>;
  }

  // 3. フックの結果を使ってコンポーネントの JSX を組み立てる
  const accounts: OAuthAccount[] = accountsData?.accounts || [];
  const isGoogleLinked = accounts.some((acc: OAuthAccount) => acc.provider === "google");

  // Google アカウント連携ハンドラ
  const handleLinkGoogle = async () => {
    signIn("google", {
      callbackUrl: `/${locale}/mypage`,
    });
  };

  // Google アカウント連携解除ハンドラ
  const handleUnlinkGoogle = async () => {
    try {
      const confirmMsg = t("unlinkGoogleConfirm");
      if (!window.confirm(confirmMsg)) return;

      const res = await fetch("/api/user/link-oauth?provider=google", {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("unlinkFailed"));
      }
      toast({
        title: t("googleUnlinkSuccess"),
        status: "success",
        duration: 5000,
      });
      mutateAccounts();
    } catch (err: unknown) {
      console.error(err);
      let message = t("unlinkFailed");
      if (err instanceof Error) {
        message = err.message;
      }
      toast({
        title: t("errorTitle"),
        description: message,
        status: "error",
        duration: 5000,
      });
    }
  };

  return (
    <Box maxW="600px" mx="auto" p={4}>
      <Heading size="lg" mb={6}>
        {t("myPageTitle")}
      </Heading>

      <Flex alignItems="center" mb={6}>
        <Avatar
          src={user.image || ""}
          name={user.name || t("userNoName")}
          size={avatarSize}  // レスポンシブサイズを適用
          mr={4}
        />
        <Box>
          <Text fontWeight="bold" fontSize="xl">
            {user.name || t("userNoName")}
          </Text>
          <Text color="gray.600">
            {t("userEmail", { email: user.email })}
          </Text>
          <Text color="gray.600">
            {t("userPoints", { points: user.points })}
          </Text>
        </Box>
      </Flex>

      {/*
        小画面 (base) では縦並び (column)、
        中画面 (md~) では横並び (row) にする
      */}
      <Stack
        spacing={3}
        mb={6}
        direction={{ base: "column", md: "row" }}
        width="100%"
      >
        {/* プロフィール編集モーダル */}
        <EditProfileModal user={user} />

        {/* パスワード変更ボタン */}
        <Link href={`/${locale}/mypage/settings/change-password`}>
          <Button
            colorScheme="teal"
            variant="outline"
            width={{ base: "full", md: "auto" }}
            whiteSpace="normal"
          >
            {t("changePasswordBtn")}
          </Button>
        </Link>

        {/* アカウント削除ボタン */}
        <Link href={`/${locale}/mypage/settings/delete-account`}>
          <Button
            colorScheme="red"
            variant="ghost"
            width={{ base: "full", md: "auto" }}
            whiteSpace="normal"
          >
            {t("deleteAccountBtn")}
          </Button>
        </Link>
      </Stack>

      {/* OAuth アカウント連携セクション */}
      <Box border="1px solid" borderColor="gray.300" p={4} rounded="md">
        <Text fontWeight="semibold" mb={3}>
          {t("oauthLinkTitle")}
        </Text>

        {isGoogleLinked ? (
          <>
            <Text mb={2}>{t("googleLinkedMessage")}</Text>
            <Button colorScheme="red" onClick={handleUnlinkGoogle}>
              {t("unlinkGoogleButton")}
            </Button>
          </>
        ) : (
          <>
            <Text mb={2}>{t("googleNotLinkedMessage")}</Text>
            <Button colorScheme="blue" onClick={handleLinkGoogle}>
              {t("linkGoogleButton")}
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}