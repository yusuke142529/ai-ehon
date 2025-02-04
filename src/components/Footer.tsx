"use client";

import React from "react";
import {
  Box,
  Flex,
  Link as ChakraLink,
  Text,
  IconButton,
  Tooltip,
  useColorModeValue,
  useBreakpointValue
} from "@chakra-ui/react";
import NextLink from "next/link";
import { FaTwitter, FaInstagram } from "react-icons/fa";

// next-intl 用
import { useTranslations, useLocale } from "next-intl";

export default function Footer() {
  const t = useTranslations("common");
  const locale = useLocale(); // 現在のロケールを取得 ("ja" | "en" など)

  // 背景色やテキスト色をダークモード対応
  const bg = useColorModeValue("gray.50", "gray.800");
  const textColor = useColorModeValue("gray.600", "gray.400");

  // Flexの向きをレスポンシブに
  const flexDirection = useBreakpointValue({ base: "column", md: "row" });

  return (
    <Box as="footer" bg={bg} py={6} px={4} mt={8}>
      <Flex
        w="100%"
        maxW="1200px"
        mx="auto"
        align="center"
        justify="space-between"
        direction={flexDirection}
        gap={4}
      >
        {/* 左側: リンク集 */}
        <Flex gap={4} align="center" mb={{ base: 2, md: 0 }}>
          <ChakraLink
            as={NextLink}
            href={`/${locale}/contact`} // ロケールを含めたパス
            fontSize="sm"
            color={textColor}
            _hover={{ textDecoration: "underline" }}
          >
            {t("footerContact")}
          </ChakraLink>

          <ChakraLink
            as={NextLink}
            href={`/${locale}/terms`} // 利用規約リンクを /[locale]/terms へ
            fontSize="sm"
            color={textColor}
            _hover={{ textDecoration: "underline" }}
          >
            {t("footerTerms")}
          </ChakraLink>

          {/* 追加: プライバシーポリシーへのリンク */}
          <ChakraLink
            as={NextLink}
            href={`/${locale}/privacy`}
            fontSize="sm"
            color={textColor}
            _hover={{ textDecoration: "underline" }}
          >
            {t("footerPrivacy")}
          </ChakraLink>

          <ChakraLink
            as={NextLink}
            href={`/${locale}/help`}
            fontSize="sm"
            color={textColor}
            _hover={{ textDecoration: "underline" }}
          >
            {t("footerHelp")}
          </ChakraLink>
        </Flex>

        {/* 中央 or 右側: SNSアイコン */}
        <Flex gap={4} align="center" justify={{ base: "center", md: "flex-end" }}>
          <Tooltip label="Twitter" hasArrow>
            <IconButton
              as={ChakraLink}
              href="https://twitter.com"
              isExternal
              aria-label="Twitter link"
              icon={<FaTwitter />}
              variant="ghost"
              size="sm"
              color={textColor}
              _hover={{ color: "twitter.500", transform: "scale(1.1)" }}
              transition="all 0.2s"
            />
          </Tooltip>
          <Tooltip label="Instagram" hasArrow>
            <IconButton
              as={ChakraLink}
              href="https://instagram.com"
              isExternal
              aria-label="Instagram link"
              icon={<FaInstagram />}
              variant="ghost"
              size="sm"
              color={textColor}
              _hover={{ color: "pink.500", transform: "scale(1.1)" }}
              transition="all 0.2s"
            />
          </Tooltip>
        </Flex>
      </Flex>

      {/* コピーライト表記 */}
      <Box mt={4} textAlign="center">
        <Text fontSize="xs" color={textColor}>
          {t("footerCopyright")}
        </Text>
      </Box>
    </Box>
  );
}