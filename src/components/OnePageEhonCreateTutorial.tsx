"use client";

import React from "react";
import {
    Box,
    Heading,
    Text,
    FormControl,
    FormLabel,
    Button,
    VStack,
    useColorModeValue,
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    SliderMark,
    Icon,
    Flex
} from "@chakra-ui/react";
import { FaBookOpen } from "react-icons/fa";
import { useTranslations } from "next-intl";

// DrawerSelectなどの既存コンポーネント (ただし disabled で無効化)
import ThemeDrawerSelect from "@/components/ThemeDrawerSelect";
import GenreDrawerSelect from "@/components/GenreDrawerSelect";
import CharacterDrawerSelect from "@/components/CharacterDrawerSelect";
import ArtStyleDrawerSelect from "@/components/ArtStyleDrawerSelect";
import TargetAgeDrawerSelect from "@/components/TargetAgeDrawerSelect";

export default function OnePageEhonCreateTutorial() {
    const t = useTranslations("common");
    const cardBg = useColorModeValue("white", "gray.700");

    // デモ用: ページ数 10固定
    const pageCount = 10;
    const pointsRequired = pageCount * 5;

    return (
        <Box
            bg={cardBg}
            p={[6, 8]}
            borderRadius="md"
            boxShadow="md"
            mb={8}
        >
            <Heading as="h2" size="md" mb={2} textAlign="center">
                {t("createBookTitle", { defaultValue: "絵本作成ページ (サンプル)" })}
            </Heading>
            <Text fontSize="xs" color="gray.600" textAlign="center" mb={6}>
                {t("tutorialCreateDesc", {
                    defaultValue:
                        "すべて無効化されており、操作できません。ログイン後、本ページを実際に操作できます。",
                })}
            </Text>

            <VStack align="stretch" spacing={4}>
                {/* テーマ */}
                <FormControl isDisabled>
                    <FormLabel fontSize="sm">{t("labelTheme", { defaultValue: "テーマ" })}</FormLabel>
                    <ThemeDrawerSelect selectedTheme="(テーマ選択)" onChange={() => null} disabled />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                        {t("tutorialThemeNote", {
                            defaultValue: "好きなテーマをここで選べます。",
                        })}
                    </Text>
                </FormControl>

                {/* ジャンル */}
                <FormControl isDisabled>
                    <FormLabel fontSize="sm">{t("labelGenre", { defaultValue: "ジャンル" })}</FormLabel>
                    <GenreDrawerSelect selectedGenre="" onChange={() => null} disabled />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                        {t("tutorialGenreNote", {
                            defaultValue: "物語のジャンルを選択します。",
                        })}
                    </Text>
                </FormControl>

                {/* キャラクター */}
                <FormControl isDisabled>
                    <FormLabel fontSize="sm">{t("labelMainCharacter", { defaultValue: "主人公の動物" })}</FormLabel>
                    <CharacterDrawerSelect selectedCharacter="" onChange={() => null} disabled />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                        {t("tutorialCharacterNote", {
                            defaultValue: "好きな動物を主人公にできます。",
                        })}
                    </Text>
                </FormControl>

                {/* アートスタイル */}
                <FormControl isDisabled>
                    <FormLabel fontSize="sm">{t("labelStyleDetail", { defaultValue: "アートスタイル" })}</FormLabel>
                    <ArtStyleDrawerSelect selectedCategory="" selectedStyleId={undefined} onChange={() => null} disabled />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                        {t("tutorialStyleNote", {
                            defaultValue: "イラストの雰囲気をここから選べます。",
                        })}
                    </Text>
                </FormControl>

                {/* 対象年齢 */}
                <FormControl isDisabled>
                    <FormLabel fontSize="sm">{t("searchLabelTargetAge", { defaultValue: "対象年齢" })}</FormLabel>
                    <TargetAgeDrawerSelect selectedAge="" onChange={() => null} disabled />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                        {t("tutorialAgeNote", {
                            defaultValue: "読み手に合わせた難易度・語彙レベルを選択。",
                        })}
                    </Text>
                </FormControl>

                {/* ページ数 (Slider) */}
                <FormControl isDisabled>
                    <FormLabel fontSize="sm">{t("searchLabelPages", { defaultValue: "ページ数" })}</FormLabel>
                    <Box position="relative" px={2} py={2}>
                        <Slider
                            min={5}
                            max={30}
                            step={1}
                            value={pageCount}
                            colorScheme="teal"
                        >
                            {[5, 10, 15, 20, 25, 30].map((val) => (
                                <SliderMark
                                    key={val}
                                    value={val}
                                    mt="2"
                                    ml="-1"
                                    fontSize="xs"
                                    color="gray.500"
                                >
                                    {val}
                                </SliderMark>
                            ))}
                            <SliderTrack bg="teal.100">
                                <SliderFilledTrack bg="teal.400" />
                            </SliderTrack>
                            <SliderThumb boxSize={6} transition="0.2s">
                                <Icon as={FaBookOpen} color="teal.600" />
                            </SliderThumb>
                        </Slider>
                        <Text mt={2} fontSize="xs" color="gray.500">
                            {t("pointsRequiredMsg", { pageCount, pointsRequired })}
                        </Text>
                    </Box>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                        {t("tutorialPagesNote", {
                            defaultValue: "ページが多いほど長い物語になります。",
                        })}
                    </Text>
                </FormControl>
            </VStack>

            {/* 生成ボタン (無効) */}
            <Box mt={8} textAlign="center">
                <Button colorScheme="teal" size="md" isDisabled>
                    {t("tutorialGenerateDisabled", {
                        defaultValue: "ログインして作成",
                    })}
                </Button>
                <Text fontSize="xs" color="gray.500" mt={1}>
                    {t("tutorialGenerateNote", {
                        defaultValue:
                            "このサンプルでは生成はできません。ログイン後にお試しください。",
                    })}
                </Text>
            </Box>
        </Box>
    );
}