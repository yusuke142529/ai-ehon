// src/app/[locale]/ehon/create/CreatePageClient.tsx

"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Button,
  VStack,
  useColorModeValue,
  useToast,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  Icon,
  Flex,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { AnimatePresence } from "framer-motion";
import { FaBookOpen } from "react-icons/fa";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import ThemeDrawerSelect from "@/components/ThemeDrawerSelect";
import GenreDrawerSelect from "@/components/GenreDrawerSelect";
import CharacterDrawerSelect from "@/components/CharacterDrawerSelect";
import ArtStyleDrawerSelect from "@/components/ArtStyleDrawerSelect";
import TargetAgeDrawerSelect from "@/components/TargetAgeDrawerSelect";

// 旧コンポーネントは削除し、新しいコンポーネントを利用
import MergedCosmicOverlay from "@/components/MergedCosmicOverlay";

import { useUserSWR } from "@/hook/useUserSWR";

// ローカルストレージキー
const GENERATION_KEY = "ehon_generation_status";
const GENERATION_TIMESTAMP_KEY = "ehon_generation_timestamp";
const GENERATION_TIMEOUT_MS = 30 * 60 * 1000; // 30分

export default function CreatePageClient() {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const toast = useToast();

  // フォーム state
  const [theme, setTheme] = useState("");
  const [genre, setGenre] = useState("");
  const [charAnimal, setCharAnimal] = useState("");
  const [styleId, setStyleId] = useState<number | undefined>(undefined);
  const [ageRange, setAgeRange] = useState("");
  const [pageCount, setPageCount] = useState(10);
  const [outputLanguage, setOutputLanguage] = useState<"ja" | "en">(
    locale === "en" ? "en" : "ja"
  );

  // エラー & ローディング管理
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [recoveringSession, setRecoveringSession] = useState(false);

  // ユーザー情報取得用 SWR フック
  const { user, mutate } = useUserSWR();

  // ポイント計算
  const costPerPage = 15;
  const creditsRequired = pageCount * costPerPage;

  // 初回マウント時に前回の生成状態を確認
  useEffect(() => {
    const checkPreviousGeneration = async () => {
      const generationStatus = localStorage.getItem(GENERATION_KEY);
      const generationTimestamp = localStorage.getItem(GENERATION_TIMESTAMP_KEY);
      
      // 生成中状態があり、タイムアウトしていない場合
      if (generationStatus === "generating" && generationTimestamp) {
        const timestamp = parseInt(generationTimestamp, 10);
        const now = Date.now();
        
        // 30分以内の場合のみ復旧処理を実行
        if (now - timestamp < GENERATION_TIMEOUT_MS) {
          setRecoveringSession(true);
          
          try {
            // 最新の絵本を確認
            const res = await fetch('/api/user/latest-book');
            if (res.ok) {
              const latestBook = await res.json();
              
              if (latestBook && latestBook.id) {
                toast({
                  title: t("generationRecoveryTitle", { defaultValue: "生成状態を復元しました" }),
                  description: t("generationRecoveryDesc", { defaultValue: "前回の生成を継続しています" }),
                  status: "info",
                  duration: 5000,
                  isClosable: true,
                });
                
                // 生成された絵本ページへリダイレクト
                router.push(`/${locale}/ehon/${latestBook.id}`);
                return;
              }
            }
          } catch (err) {
            console.error("Recovery check error:", err);
          } finally {
            // 状態をクリア
            clearGenerationStatus();
            setRecoveringSession(false);
          }
        } else {
          // タイムアウトした場合は状態をクリア
          clearGenerationStatus();
        }
      }
    };
    
    checkPreviousGeneration();
  }, [locale, router, toast, t]);

  // 生成状態を保存
  const saveGenerationStatus = () => {
    localStorage.setItem(GENERATION_KEY, "generating");
    localStorage.setItem(GENERATION_TIMESTAMP_KEY, Date.now().toString());
  };

  // 生成状態をクリア
  const clearGenerationStatus = () => {
    localStorage.removeItem(GENERATION_KEY);
    localStorage.removeItem(GENERATION_TIMESTAMP_KEY);
  };

  // バリデーション処理
  function validateForm() {
    const newErrors: Record<string, string> = {};
    if (!theme) newErrors.theme = t("errThemeEmpty");
    if (!genre) newErrors.genre = t("errGenreEmpty");
    if (!charAnimal) newErrors.charAnimal = t("errCharEmpty");
    if (!styleId) newErrors.styleId = t("errStyleEmpty");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // 生成処理
  async function handleGenerate() {
    // 1. フォームバリデーション
    if (!validateForm()) {
      toast({
        title: t("validationError"),
        description: t("validationErrorDesc"),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // 2. ログインチェック & クレジット確認
    if (!user) {
      toast({
        title: t("errorTitle"),
        description: t("pleaseLoginDesc"),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (user.points < creditsRequired) {
      toast({
        title: t("notEnoughCreditsTitle"),
        description: t("notEnoughCreditsDesc", {
          required: creditsRequired,
          current: user.points,
        }),
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    // 3. ページ数制限（最小5、最大30）
    const finalPageCount = Math.min(Math.max(pageCount, 5), 30);
    setIsLoading(true);
    
    // 生成状態を保存 (スリープ復帰用)
    saveGenerationStatus();

    try {
      // 4. API 送信
      const payload = {
        theme,
        genre,
        charAnimal,
        artStyle: { styleId },
        ageRange,
        pageCount: finalPageCount,
        language: outputLanguage,
      };

      const res = await fetch("/api/ehon/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        toast({
          title: t("generateFailTitle"),
          description: t("generateFailDesc"),
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        clearGenerationStatus();
      } else {
        const data = await res.json();
        toast({
          title: t("generateStartTitle"),
          description: t("generateStartDesc"),
          status: "success",
          duration: 4000,
          isClosable: true,
        });

        // ポイント消費後、ユーザー情報の再取得
        await mutate();

        // 結果ページへ遷移
        router.push(`/${locale}/ehon/${data.id}`);
      }
    } catch (err) {
      console.error("Error in handleGenerate:", err);
      toast({
        title: t("errorTitle"),
        description: t("networkErrorDesc"),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      clearGenerationStatus();
    } finally {
      setIsLoading(false);
    }
  }

  // UI 用スタイル設定
  const pageBg = useColorModeValue("gray.50", "gray.800");
  const cardBg = useColorModeValue("white", "gray.700");
  const segmentBg = useColorModeValue("gray.200", "gray.600");
  const highlightBg = useColorModeValue("teal.500", "teal.300");
  const textColorActive = useColorModeValue("white", "whiteAlpha.900");
  const textColorInactive = useColorModeValue("gray.700", "gray.300");

  if (recoveringSession) {
    return (
      <Box minH="100vh" py={10} px={4} bg={pageBg} textAlign="center">
        <Alert status="info" maxW="md" mx="auto" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>{t("checkingGenerationStatusTitle", { defaultValue: "生成状態を確認中" })}</AlertTitle>
            <AlertDescription>
              {t("checkingGenerationStatusDesc", { defaultValue: "前回の絵本生成状態を確認しています..." })}
            </AlertDescription>
          </Box>
        </Alert>
      </Box>
    );
  }

  return (
    <>
      {/* ローディング中はオーバーレイを表示 */}
      <AnimatePresence>
        {isLoading && <MergedCosmicOverlay isLoading={true} />}
      </AnimatePresence>

      <Box
        minH="100vh"
        py={10}
        px={4}
        bg={pageBg}
        pointerEvents={isLoading ? "none" : "auto"}
      >
        <Box
          maxW="xl"
          mx="auto"
          bg={cardBg}
          p={[6, 8]}
          borderRadius="md"
          boxShadow="md"
        >
          <Heading as="h1" size="lg" mb={2} textAlign="center">
            {t("createBookTitle")}
          </Heading>
          <Text fontSize="sm" color="gray.600" textAlign="center" mb={6}>
            {t("createBookDesc")}
          </Text>

          {/* 言語切り替え (出力先) */}
          <Box textAlign="center" mb={6}>
            <Text fontSize="sm" color="gray.500" mb={1}>
              {t("labelOutputLanguage")}
            </Text>
            <Flex
              position="relative"
              display="inline-flex"
              rounded="full"
              bg={segmentBg}
              p="2px"
              w="200px"
              h="40px"
              alignItems="center"
            >
              <Box
                position="absolute"
                top={0}
                bottom={0}
                left={outputLanguage === "ja" ? 0 : "50%"}
                width="50%"
                rounded="full"
                bg={highlightBg}
                transition="all 0.3s"
              />
              <Button
                variant="ghost"
                size="sm"
                borderRadius="full"
                flex="1"
                zIndex={1}
                color={
                  outputLanguage === "ja" ? textColorActive : textColorInactive
                }
                onClick={() => setOutputLanguage("ja")}
              >
                {t("langJa")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                borderRadius="full"
                flex="1"
                zIndex={1}
                color={
                  outputLanguage === "en" ? textColorActive : textColorInactive
                }
                onClick={() => setOutputLanguage("en")}
              >
                {t("langEn")}
              </Button>
            </Flex>
          </Box>

          <VStack align="stretch" spacing={4}>
            {/* テーマ */}
            <FormControl isInvalid={!!errors.theme}>
              <FormLabel fontSize="sm">{t("labelTheme")}</FormLabel>
              <ThemeDrawerSelect
                selectedTheme={theme}
                onChange={(val) => setTheme(val)}
              />
              <FormErrorMessage>{errors.theme}</FormErrorMessage>
            </FormControl>

            {/* ジャンル */}
            <FormControl isInvalid={!!errors.genre}>
              <FormLabel fontSize="sm">{t("labelGenre")}</FormLabel>
              <GenreDrawerSelect
                selectedGenre={genre}
                onChange={(val) => setGenre(val)}
              />
              <FormErrorMessage>{errors.genre}</FormErrorMessage>
            </FormControl>

            {/* キャラクター */}
            <FormControl isInvalid={!!errors.charAnimal}>
              <FormLabel fontSize="sm">{t("labelMainCharacter")}</FormLabel>
              <CharacterDrawerSelect
                selectedCharacter={charAnimal}
                onChange={(val) => setCharAnimal(val)}
              />
              <FormErrorMessage>{errors.charAnimal}</FormErrorMessage>
            </FormControl>

            {/* アートスタイル */}
            <FormControl isInvalid={!!errors.styleId}>
              <FormLabel fontSize="sm">{t("labelStyleDetail")}</FormLabel>
              <ArtStyleDrawerSelect
                selectedStyleId={styleId}
                onChange={(_unusedCat, id) => setStyleId(id)}
              />
              <FormErrorMessage>{errors.styleId}</FormErrorMessage>
            </FormControl>

            {/* 対象年齢 */}
            <FormControl isInvalid={!!errors.ageRange}>
              <FormLabel fontSize="sm">{t("searchLabelTargetAge")}</FormLabel>
              <TargetAgeDrawerSelect
                selectedAge={ageRange}
                onChange={(val) => setAgeRange(val)}
              />
              <FormErrorMessage>{errors.ageRange}</FormErrorMessage>
            </FormControl>

            {/* ページ数 */}
            <FormControl>
              <FormLabel fontSize="sm">{t("searchLabelPages")}</FormLabel>
              <Box position="relative" px={2} py={2}>
                <Slider
                  min={5}
                  max={30}
                  step={1}
                  value={pageCount}
                  onChange={(val) => setPageCount(val)}
                  colorScheme="teal"
                >
                  {[5, 10, 15, 20, 25, 30].map((markVal) => (
                    <SliderMark
                      key={markVal}
                      value={markVal}
                      mt="2"
                      ml="-1"
                      fontSize="xs"
                      color="gray.500"
                    >
                      {markVal}
                    </SliderMark>
                  ))}
                  <SliderMark
                    value={pageCount}
                    textAlign="center"
                    bg="teal.500"
                    color="white"
                    fontSize="xs"
                    borderRadius="md"
                    px={2}
                    py={1}
                    transform="translate(-50%, -125%)"
                  >
                    {t("searchLabelPagesUnit", { count: pageCount })}
                  </SliderMark>
                  <SliderTrack bg="teal.100">
                    <SliderFilledTrack bg="teal.400" />
                  </SliderTrack>
                  <SliderThumb
                    boxSize={6}
                    transition="0.2s"
                    _hover={{ boxSize: 8 }}
                  >
                    <Icon as={FaBookOpen} color="teal.600" />
                  </SliderThumb>
                </Slider>
                <Text mt={2} fontSize="xs" color="gray.500">
                  {t("pointsRequiredMsg", {
                    pageCount,
                    pointsRequired: creditsRequired,
                  })}
                </Text>
              </Box>
            </FormControl>
          </VStack>

          {/* 生成ボタン */}
          <Box mt={8} textAlign="center">
            <Button colorScheme="teal" size="md" onClick={handleGenerate}>
              {t("btnGenerateBook")}
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
}