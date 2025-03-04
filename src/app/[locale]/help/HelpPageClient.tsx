"use client";

// src/app/[locale]/help/HelpPageClient.tsx
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
    Collapse,
    VStack,
    Container,
} from "@chakra-ui/react";
import { ArrowUpIcon, ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";

// スムーズスクロール用ヘルパー関数
const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: "smooth" });
    }
};

export function HelpPageClient() {
    const t = useTranslations("help");

    // 翻訳ファイルから直接セクションデータを取得
    const sectionsObj = t.raw("sections") as Record<
        string,
        { heading: string; content: string }
    >;

    // Object.values で配列化して扱いやすくする
    const sections = Object.entries(sectionsObj).map(([key, value]) => ({
        id: key,
        ...value
    }));

    const title = t("title");
    const description = t("description");
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

    // アコーディオン開閉処理
    const handleToggle = (idx: number) => {
        setOpenIndex((prev) => (prev === idx ? null : idx));
    };

    return (
        <Container maxW="800px" py={8} px={{ base: 4, md: 8 }}>
            <Box
                id="topOfPage"
                bg={containerBg}
                borderRadius="lg"
                boxShadow="md"
                overflow="hidden"
                p={{ base: 4, md: 6 }}
            >
                {/* タイトル */}
                <Heading color={headingColor} mb={2} size="xl">
                    {title}
                </Heading>
                <Text fontSize="md" mb={2}>
                    {description}
                </Text>
                <Text fontSize="sm" color="gray.500" mb={6}>
                    {updatedAt}
                </Text>

                {/* === 目次 / TOC === */}
                <Box bg={tocBg} p={4} borderRadius="md" mb={8}>
                    <Heading as="h3" size="sm" mb={3}>
                        {t("tocTitle")}
                    </Heading>
                    <VStack align="start" spacing={2}>
                        {sections.map((sec, idx) => (
                            <ChakraLink
                                key={sec.id}
                                onClick={() => scrollToId(`section-${idx}`)}
                                color={linkColor}
                                fontSize="md"
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
                        <Box key={sec.id} mb={5} id={`section-${idx}`} scrollMarginTop="20px">
                            {/* 見出し行 */}
                            <Flex
                                align="center"
                                justify="space-between"
                                cursor="pointer"
                                bg={sectionHeadingBg}
                                p={4}
                                borderRadius="md"
                                _hover={{ bg: sectionHeadingHoverBg }}
                                onClick={() => handleToggle(idx)}
                            >
                                <Heading as="h2" size="md">
                                    {sec.heading}
                                </Heading>
                                {isOpen ? (
                                    <ChevronUpIcon color="blue.500" boxSize={6} />
                                ) : (
                                    <ChevronDownIcon color="blue.500" boxSize={6} />
                                )}
                            </Flex>

                            {/* 本文をアコーディオン表示 */}
                            <Collapse in={isOpen} animateOpacity>
                                <Box p={4} mt={2} bg={sectionContentBg} borderRadius="md">
                                    <Text whiteSpace="pre-wrap" fontSize="md">
                                        {sec.content}
                                    </Text>
                                </Box>
                            </Collapse>
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
                    size="lg"
                    borderRadius="full"
                    boxShadow="lg"
                    onClick={() => scrollToId("topOfPage")}
                />
            </Box>
        </Container>
    );
}