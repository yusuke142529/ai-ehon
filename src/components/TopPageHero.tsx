"use client";

import React, { FC } from "react";
import Link from "next/link";
import {
  Box,
  Heading,
  Text,
  Button,
  Flex,
  useColorModeValue,
} from "@chakra-ui/react";
import { useSession } from "next-auth/react";

// ★ ここが next-intl のフック
import { useTranslations } from "next-intl";

type UserProfile = {
  name?: string;
  email?: string;
  image?: string;
};

/**
 * トップページのヒーローセクション
 *  - Chakra UI でスタイリング
 *  - NextAuth の `useSession` でログイン状態を確認
 *  - next-intl の `useTranslations("common")` で翻訳文言を取得
 */
export const TopPageHero: FC = () => {
  // ログイン状態
  const { data: session } = useSession();
  const user: UserProfile | undefined = session?.user ?? undefined;

  // next-intl のフック（react-i18nextではない）
  const t = useTranslations("common");

  // カラーモード対応
  const bgColor = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "gray.100");

  return (
    <Box
      as="section"
      aria-labelledby="top-page-hero-heading"
      textAlign="center"
      mb={12}
      position="relative"
      bg={bgColor}
      p={{ base: 6, md: 8 }}
      borderRadius="md"
    >
      {/* 見出し (h1) */}
      <Heading
        id="top-page-hero-heading"
        as="h1"
        size="2xl"
        mb={4}
        color={textColor}
      >
        {t("hero.title", { defaultValue: "AIえほんメーカー" })}
      </Heading>

      {/* 説明文 (p) */}
      <Text fontSize="lg" mb={8} color={textColor}>
        {t("hero.description", {
          defaultValue:
            "GPT系LLMとDALL·E 3でオリジナル絵本を簡単生成。ポイント制で必要な分だけページ生成、コミュニティで作品を共有できます。",
        })}
      </Text>

      {/* ボタン群（Flexレイアウト） */}
      <Flex justify="center" gap={4}>
        {/* ログインしていない場合に「サンプルを見る」ボタンを表示 */}
        {!user && (
          <Link href="#samples" passHref legacyBehavior>
            <Button as="a" variant="solid" colorScheme="blue" size="lg">
              {t("hero.samplesButton", { defaultValue: "サンプルを見る" })}
            </Button>
          </Link>
        )}
      </Flex>
    </Box>
  );
};

export default TopPageHero;