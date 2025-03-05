"use client";

import {
    Box,
    Button,
    Flex,
    HStack,
    IconButton,
    Text,
    useBreakpointValue,
} from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { motion } from "framer-motion";

interface CommunityPaginationProps {
    currentPage: number;
    totalPages: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    onPageChange: (page: number) => void;
}

const MotionButton = motion(Button);
const MotionIconButton = motion(IconButton);

export default function CommunityPagination({
    currentPage,
    totalPages,
    hasPrevPage,
    hasNextPage,
    onPageChange,
}: CommunityPaginationProps) {
    const t = useTranslations("Community");
    const isSmallScreen = useBreakpointValue({ base: true, md: false });

    // 表示するページボタンの範囲を計算
    const getPageNumbers = () => {
        // モバイルの場合は少ないページボタンを表示
        const maxVisibleButtons = isSmallScreen ? 3 : 5;
        const halfVisible = Math.floor(maxVisibleButtons / 2);

        let startPage = Math.max(currentPage - halfVisible, 1);
        let endPage = Math.min(startPage + maxVisibleButtons - 1, totalPages);

        // endPageが上限を超えた場合、startPageを調整
        if (endPage === totalPages) {
            startPage = Math.max(endPage - maxVisibleButtons + 1, 1);
        }

        return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
    };

    const pageNumbers = getPageNumbers();

    // ボタンのアニメーション設定
    const buttonVariants = {
        hover: {
            scale: 1.05,
            transition: { duration: 0.2 },
        },
        tap: {
            scale: 0.95,
            transition: { duration: 0.1 },
        },
    };

    return (
        <Box py={8}>
            <Flex justifyContent="center" alignItems="center">
                {/* 「前へ」ボタン */}
                <MotionIconButton
                    aria-label={t("prevPage")}
                    icon={<FaChevronLeft />}
                    onClick={() => onPageChange(currentPage - 1)}
                    isDisabled={!hasPrevPage}
                    mr={2}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                />

                {/* ページ番号 */}
                <HStack spacing={1}>
                    {/* 先頭ページへのジャンプ（必要な場合） */}
                    {pageNumbers[0] > 1 && (
                        <>
                            <MotionButton
                                size="sm"
                                onClick={() => onPageChange(1)}
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                            >
                                1
                            </MotionButton>
                            {pageNumbers[0] > 2 && (
                                <Text px={1} color="gray.500">
                                    ...
                                </Text>
                            )}
                        </>
                    )}

                    {/* ページ番号ボタン */}
                    {pageNumbers.map((page) => (
                        <MotionButton
                            key={page}
                            size="sm"
                            colorScheme={currentPage === page ? "blue" : "gray"}
                            variant={currentPage === page ? "solid" : "outline"}
                            onClick={() => onPageChange(page)}
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                        >
                            {page}
                        </MotionButton>
                    ))}

                    {/* 最終ページへのジャンプ（必要な場合） */}
                    {pageNumbers[pageNumbers.length - 1] < totalPages && (
                        <>
                            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                                <Text px={1} color="gray.500">
                                    ...
                                </Text>
                            )}
                            <MotionButton
                                size="sm"
                                onClick={() => onPageChange(totalPages)}
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                            >
                                {totalPages}
                            </MotionButton>
                        </>
                    )}
                </HStack>

                {/* 「次へ」ボタン */}
                <MotionIconButton
                    aria-label={t("nextPage")}
                    icon={<FaChevronRight />}
                    onClick={() => onPageChange(currentPage + 1)}
                    isDisabled={!hasNextPage}
                    ml={2}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                />
            </Flex>

            {/* ページ情報テキスト */}
            <Text textAlign="center" fontSize="sm" color="gray.500" mt={2}>
                {t("pageInfo", { current: currentPage, total: totalPages })}
            </Text>
        </Box>
    );
}