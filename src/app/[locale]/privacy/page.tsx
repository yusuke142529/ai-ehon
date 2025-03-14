"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Heading,
  Text,
  Link as ChakraLink,
  useColorModeValue,
  IconButton,
  Flex,
  VStack,
} from "@chakra-ui/react";
import { ArrowUpIcon, ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
// ★ framer-motion を使用
import { AnimatePresence, motion } from "framer-motion";

// 「id」要素にスムーズスクロールするヘルパー関数
const scrollToId = (id: string) => {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
  }
};

export default function PrivacyPage() {
  const t = useTranslations("privacyPage");

  // (1) オブジェクトを受け取る
  const sectionsObj = t.raw("sections") as Record<
    string,
    { heading: string; content: string }
  >;
  // (2) Object.values で配列化
  const sections = Object.values(sectionsObj);

  const title = t("title");
  const updatedAt = t("updatedAt");

  // 現在アコーディオンが開いているインデックス (null = 全部閉)
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // カラーモード
  const containerBg = useColorModeValue("white", "gray.800");
  const headingColor = useColorModeValue("gray.800", "whiteAlpha.900");
  const tocBg = useColorModeValue("gray.50", "gray.700");
  const linkColor = useColorModeValue("blue.600", "blue.300");
  const sectionHeadingBg = useColorModeValue("gray.100", "gray.600");
  const sectionHeadingHoverBg = useColorModeValue("gray.200", "gray.500");
  const sectionContentBg = useColorModeValue("gray.50", "gray.700");

  // 開閉トグル
  const handleToggle = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  // フレームモーションのバリアント定義 (開閉アニメ)
  const variants = {
    open: {
      opacity: 1,
      height: "auto",
    },
    collapsed: {
      opacity: 0,
      height: 0,
    },
  };

  return (
    <Box
      id="topOfPage"
      maxW="800px"
      mx="auto"
      py={8}
      px={{ base: 4, md: 0 }}
      bg={containerBg}
    >
      {/* タイトル */}
      <Heading color={headingColor} mb={2}>
        {title}
      </Heading>
      <Text fontSize="sm" color="gray.500" mb={6}>
        {updatedAt}
      </Text>

      {/* === 目次 / TOC === */}
      <Box bg={tocBg} p={3} borderRadius="md" mb={6}>
        <Heading as="h3" size="sm" mb={2}>
          {t("tocTitle") || "目次"}
        </Heading>
        <VStack align="start" spacing={1}>
          {sections.map((sec, idx) => (
            <ChakraLink
              key={idx}
              onClick={() => scrollToId(`section-${idx}`)}
              color={linkColor}
              fontSize="sm"
              _hover={{ textDecoration: "underline" }}
              cursor="pointer"
            >
              {sec.heading}
            </ChakraLink>
          ))}
        </VStack>
      </Box>

      {/* === セクション本体 (アコーディオン) === */}
      {sections.map((sec, idx) => {
        const isOpen = openIndex === idx;

        return (
          <Box key={idx} mb={6} id={`section-${idx}`}>
            {/* 見出し行 */}
            <Flex
              align="center"
              justify="space-between"
              cursor="pointer"
              bg={sectionHeadingBg}
              p={3}
              borderRadius="md"
              _hover={{ bg: sectionHeadingHoverBg }}
              onClick={() => handleToggle(idx)}
            >
              <Heading as="h2" size="sm">
                {sec.heading}
              </Heading>
              {isOpen ? (
                <ChevronUpIcon color="blue.400" boxSize={5} />
              ) : (
                <ChevronDownIcon color="blue.400" boxSize={5} />
              )}
            </Flex>

            {/* framer-motion + AnimatePresence で開閉アニメを実装 */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key={`content-${idx}`}
                  style={{ overflow: "hidden" }}
                  initial="collapsed"
                  animate="open"
                  exit="collapsed"
                  variants={variants}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <Box p={3} mt={2} bg={sectionContentBg} borderRadius="md">
                    <Text whiteSpace="pre-wrap" fontSize="sm">
                      {sec.content}
                    </Text>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        );
      })}

      {/* Back to top ボタン */}
      <IconButton
        aria-label="Back to top"
        icon={<ArrowUpIcon />}
        position="fixed"
        bottom={10}
        right={10}
        colorScheme="blue"
        onClick={() => scrollToId("topOfPage")}
      />
    </Box>
  );
}
