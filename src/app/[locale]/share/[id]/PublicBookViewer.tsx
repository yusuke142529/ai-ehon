// src/app/share/[id]/PublicBookViewer.tsx
"use client";

import React, { useState } from "react";
import {
    Box,
    Flex,
    Text,
    Image,
    IconButton,
    HStack,
    useColorModeValue
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

interface Page {
    id: number;
    pageNumber: number;
    text: string;
    imageUrl?: string | null;
}

interface PublicBookViewerProps {
    pages: Page[];
    bookTitle: string;
}

export default function PublicBookViewer({ pages, bookTitle }: PublicBookViewerProps) {
    const [currentPage, setCurrentPage] = useState(0);
    const totalPages = pages.length;
    const sortedPages = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);

    const bgColor = useColorModeValue("#ECEAD8", "#2D3748");
    const textColor = useColorModeValue("#4A3C31", "#E2E8F0");
    const borderColor = useColorModeValue("#D0C9B1", "#4A5568");

    const goToNextPage = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    const goToPrevPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    // 現在のページオブジェクト
    const page = sortedPages[currentPage];

    return (
        <Box
            position="relative"
            maxW="800px"
            mx="auto"
            borderRadius="md"
            overflow="hidden"
            boxShadow="lg"
        >
            {/* メインコンテンツ */}
            <MotionBox
                bg={bgColor}
                p={6}
                borderRadius="md"
                boxShadow="inset 0 0 20px rgba(0,0,0,0.1)"
                minH="500px"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* ヘッダー: タイトルとページ番号 */}
                <Flex justify="space-between" align="center" mb={4}>
                    <Text
                        fontSize="xl"
                        fontWeight="bold"
                        color={textColor}
                        fontFamily='"Kosugi Maru", sans-serif'
                    >
                        {bookTitle}
                    </Text>
                    <Text fontSize="sm" color={textColor}>
                        {currentPage + 1} / {totalPages}ページ
                    </Text>
                </Flex>

                {/* 画像 */}
                {page?.imageUrl && (
                    <Box
                        mb={4}
                        borderRadius="md"
                        overflow="hidden"
                        borderWidth="1px"
                        borderColor={borderColor}
                    >
                        <Image
                            src={page.imageUrl}
                            alt={`ページ ${page.pageNumber}`}
                            width="100%"
                            height="auto"
                            objectFit="cover"
                        />
                    </Box>
                )}

                {/* ページテキスト */}
                <Box
                    p={4}
                    bg={useColorModeValue("white", "gray.700")}
                    borderRadius="md"
                    boxShadow="sm"
                    minH="150px"
                >
                    <Text
                        fontFamily='"Kosugi Maru", sans-serif'
                        fontSize="md"
                        color={textColor}
                        whiteSpace="pre-wrap"
                        lineHeight="1.6"
                    >
                        {page?.text || "ページテキストがありません"}
                    </Text>
                </Box>
            </MotionBox>

            {/* ページナビゲーションコントロール */}
            <HStack
                spacing={4}
                justify="center"
                mt={4}
                mb={2}
            >
                <IconButton
                    aria-label="前のページ"
                    icon={<ChevronLeftIcon boxSize={6} />}
                    onClick={goToPrevPage}
                    isDisabled={currentPage === 0}
                    size="md"
                    colorScheme="blue"
                    variant="outline"
                />

                <Text fontSize="sm" color="gray.600">
                    {currentPage + 1} / {totalPages}
                </Text>

                <IconButton
                    aria-label="次のページ"
                    icon={<ChevronRightIcon boxSize={6} />}
                    onClick={goToNextPage}
                    isDisabled={currentPage === totalPages - 1}
                    size="md"
                    colorScheme="blue"
                    variant="outline"
                />
            </HStack>
        </Box>
    );
}