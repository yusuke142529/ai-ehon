//src/app/[locale]/mypage/MyPageClient.tsx

"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Box, Heading, Text, Avatar, Flex, HStack, Button } from "@chakra-ui/react";
import Link from "next/link";

import EditProfileModal from "./EditProfileModal"; // ←別ファイル (同階層) のモーダル

type UserData = {
    id: number;
    name: string | null;
    email: string | null;
    iconUrl: string | null;
    points: number;
};

interface MyPageClientProps {
    user: UserData;
}

/**
 * MyPageClient (クライアントコンポーネント)
 * - UI表示 & next-intlの useTranslations() による多言語対応
 */
export default function MyPageClient({ user }: MyPageClientProps) {
    // 「common」ネームスペースの翻訳を取得
    const t = useTranslations("common");

    return (
        <Box maxW="600px" mx="auto" p={4}>
            <Heading size="lg" mb={6}>
                {t("myPageTitle")}
                {/* 例: "マイページ" or "My Page" */}
            </Heading>

            <Flex alignItems="center" mb={6}>
                <Avatar
                    src={user.iconUrl ?? ""}
                    name={user.name ?? t("userNoName")} // "名無し" or "NoName"
                    size="xl"
                    mr={4}
                />
                <Box>
                    <Text fontWeight="bold" fontSize="xl">
                        {user.name || t("userNoName")}
                    </Text>
                    <Text color="gray.600">
                        {/* "メール: {xxx}" or "Email: {xxx}" */}
                        {t("userEmail", { email: user.email ?? "" })}
                    </Text>
                    <Text color="gray.600">
                        {/* "ポイント: 100 pt" or "Points: 100 pt" */}
                        {t("userPoints", { points: user.points })}
                    </Text>
                </Box>
            </Flex>

            <HStack spacing={3}>
                {/* プロフィール編集 (アイコンアップロード / 名前変更) */}
                <EditProfileModal user={user} />

                {/* パスワード変更ページ */}
                <Link href="./settings/change-password">
                    <Button colorScheme="teal" variant="outline">
                        {t("changePasswordBtn")}
                        {/* "パスワード変更" or "Change Password" */}
                    </Button>
                </Link>

                {/* 退会ページ */}
                <Link href="./settings/delete-account">
                    <Button colorScheme="red" variant="ghost">
                        {t("deleteAccountBtn")}
                        {/* "退会する" or "Delete Account" */}
                    </Button>
                </Link>
            </HStack>
        </Box>
    );
}