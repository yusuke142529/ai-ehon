"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  BoxProps,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  useColorModeValue,
  chakra,
  shouldForwardProp,
} from "@chakra-ui/react";
import {
  motion,
  isValidMotionProp,
  Transition,
  HTMLMotionProps,
} from "framer-motion";
import Link from "next/link";
import Confetti from "react-confetti";

/* ------------------------------------------------------------
  1) MotionBox の定義 (Chakraから transition を除外して合成)
------------------------------------------------------------- */

// ①: ChakraのBoxPropsから "transition" を除外
type ChakraBoxPropsWithoutTransition = Omit<BoxProps, "transition">;

// ②: Framer MotionのHTMLMotionProps<"div"> と合体
export type MotionBoxProps = ChakraBoxPropsWithoutTransition & HTMLMotionProps<"div">;

/**
 * ③ Chakra + Framer Motion 用のカスタムコンポーネント
 *    shouldForwardProp で initial / animate / transition 等が弾かれないようにする。
 */
export const MotionBox = chakra(motion.div, {
  shouldForwardProp: (prop) =>
    shouldForwardProp(prop) || isValidMotionProp(prop),
}) as React.ForwardRefExoticComponent<MotionBoxProps>;

/* ------------------------------------------------------------
  2) 画面サイズ取得用カスタムフック
------------------------------------------------------------- */
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
}

/* ------------------------------------------------------------
  3) メインのコンテンツコンポーネント
------------------------------------------------------------- */
function PurchaseSuccessContent() {
  const searchParams = useSearchParams();
  const credits = searchParams?.get("credits") ?? "0";
  const locale = useLocale();
  const t = useTranslations("purchaseSuccess");

  const textColor = useColorModeValue("gray.700", "gray.100");
  const btnColorScheme = useColorModeValue("blue", "cyan");
  const containerBg = useColorModeValue("whiteAlpha.900", "whiteAlpha.100");
  const { width, height } = useWindowSize();

  // Framer Motion 用のトランジション (本来のアニメーション設定)
  const fadeInTransition: Transition = { duration: 0.6 };

  return (
    <MotionBox
      // ここで ChakraとMotionが混在
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fadeInTransition} // ← Framer Motion 用
      minH="100vh"
      display="flex"
      flexDir="column"
      justifyContent="center"
      alignItems="center"
      bgGradient="linear(to-b, blue.600, purple.700)"
      px={4}
      py={16}
    >
      <Confetti width={width} height={height} recycle={false} numberOfPieces={300} gravity={0.2} />

      <Container
        maxW="md"
        textAlign="center"
        bg={containerBg}
        borderRadius="lg"
        boxShadow="xl"
        p={[6, 8]}
      >
        <Heading
          size="lg"
          mb={4}
          bgGradient="linear(to-r, teal.300, blue.300)"
          bgClip="text"
        >
          {t("thanksTitle")}
        </Heading>

        {!!credits && (
          <Text fontSize="lg" mb={6} color={textColor}>
            {t("creditsMsg", { credits })}
          </Text>
        )}

        <Text mb={6} color={textColor}>
          {t("description")}
        </Text>

        <VStack spacing={4}>
          <Link href={`/${locale}/ehon/create`}>
            <Button colorScheme={btnColorScheme} size="md">
              {t("goCreate")}
            </Button>
          </Link>

          <Link href={`/${locale}`}>
            <Button variant="outline" size="md" colorScheme={btnColorScheme}>
              {t("goHome")}
            </Button>
          </Link>
        </VStack>
      </Container>
    </MotionBox>
  );
}

/* ------------------------------------------------------------
  4) ページコンポーネント (Suspense でラップ)
------------------------------------------------------------- */
export default function PurchaseSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PurchaseSuccessContent />
    </Suspense>
  );
}