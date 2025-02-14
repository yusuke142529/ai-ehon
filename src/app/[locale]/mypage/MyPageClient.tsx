//src/app/[locale]/mypage/MyPageClient.tsx

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
  HStack,
  Button,
  Spinner,
  useToast,
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
  const t = useTranslations("common");
  const locale = useLocale();
  const toast = useToast();

  // ユーザーデータ取得用カスタム SWR フック
  const { user, isLoading, error } = useUserSWR();

  // OAuth アカウント情報取得
  const {
    data: accountsData,
    error: accountsError,
    isLoading: accountsLoading,
    mutate: mutateAccounts,
  } = useSWR<OAuthAccountsData>(
    "/api/user/link-oauth",
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(t("fetchAccountsError"));
      return res.json();
    }
  );

  // ユーザーデータ読み込み中の場合
  if (isLoading) {
    return <Box>{t("loading")}</Box>;
  }
  if (error) {
    return (
      <Box color="red.500">
        {t("errorOccurred")}: {(error as Error).message}
      </Box>
    );
  }
  if (!user) {
    return <Box>{t("userNotFound")}</Box>;
  }

  // OAuth アカウント情報読み込み中の場合
  if (accountsLoading) {
    return (
      <Box>
        <Spinner size="sm" mr={2} />
        {t("loading")}
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
    } catch (error: unknown) {
      console.error(error);
      let message = t("unlinkFailed");
      if (error instanceof Error) {
        message = error.message;
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
          size="xl"
          mr={4}
        />
        <Box>
          <Text fontWeight="bold" fontSize="xl">
            {user.name || t("userNoName")}
          </Text>
          <Text color="gray.600">{t("userEmail", { email: user.email })}</Text>
          <Text color="gray.600">{t("userPoints", { points: user.points })}</Text>
        </Box>
      </Flex>

      <HStack spacing={3} mb={6}>
        {/* プロフィール編集モーダル */}
        <EditProfileModal user={user} />
        {/* パスワード変更ボタン */}
        <Link href={`/${locale}/mypage/settings/change-password`}>
          <Button colorScheme="teal" variant="outline">
            {t("changePasswordBtn")}
          </Button>
        </Link>
        {/* アカウント削除ボタン */}
        <Link href={`/${locale}/mypage/settings/delete-account`}>
          <Button colorScheme="red" variant="ghost">
            {t("deleteAccountBtn")}
          </Button>
        </Link>
      </HStack>

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