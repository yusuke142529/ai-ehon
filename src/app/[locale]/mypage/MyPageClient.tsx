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

export default function MyPageClient() {
  // Get translation function and current locale
  const t = useTranslations("common");
  const locale = useLocale();
  const toast = useToast();

  // Retrieve user data using custom SWR hook
  const { user, isLoading, error } = useUserSWR();

  // Retrieve OAuth accounts via SWR
  const {
    data: accountsData,
    error: accountsError,
    isLoading: accountsLoading,
    mutate: mutateAccounts,
  } = useSWR("/api/user/link-oauth", async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(t("fetchAccountsError"));
    return res.json();
  });

  // If user data is loading, show loading text
  if (isLoading) {
    return <Box>{t("loading")}</Box>;
  }
  if (error) {
    return (
      <Box color="red.500">
        {t("errorOccurred")}: {error.message}
      </Box>
    );
  }
  if (!user) {
    return <Box>{t("userNotFound")}</Box>;
  }

  // If account data is loading, show a spinner and loading text
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
        {t("errorOccurred")}: {accountsError.message}
      </Box>
    );
  }

  const accounts = accountsData?.accounts || [];
  const isGoogleLinked = accounts.some((acc: any) => acc.provider === "google");

  // Handler for linking Google account
  const handleLinkGoogle = async () => {
    signIn("google", {
      callbackUrl: `/${locale}/mypage`,
    });
  };

  // Handler for unlinking Google account
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
    } catch (err: any) {
      console.error(err);
      toast({
        title: t("errorTitle"),
        description: err.message,
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
        {/* Profile editing modal */}
        <EditProfileModal user={user} />
        {/* Change password button */}
        <Link href={`/${locale}/mypage/settings/change-password`}>
          <Button colorScheme="teal" variant="outline">
            {t("changePasswordBtn")}
          </Button>
        </Link>
        {/* Delete account button */}
        <Link href={`/${locale}/mypage/settings/delete-account`}>
          <Button colorScheme="red" variant="ghost">
            {t("deleteAccountBtn")}
          </Button>
        </Link>
      </HStack>

      {/* OAuth Account Linking Section */}
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