// src/app/[locale]/purchase/success/page.tsx
"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  Container,
  useColorModeValue,
} from "@chakra-ui/react";
import Link from "next/link";
import Confetti from "react-confetti";
import { motion } from "framer-motion";

/**
 * ウィンドウサイズを取得する簡易フック
 * Confetti で画面全体を覆うために使用
 */
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    // 初回 & リスナー設定
    handleResize();
    window.addEventListener("resize", handleResize);
    // クリーンアップ
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
}

/**
 * PurchaseSuccessContent コンポーネント
 * - useSearchParams() を使用してクエリパラメータから購入クレジットを取得
 * - ロケールや各種 UI 要素の表示を行う
 */
function PurchaseSuccessContent() {
  // クエリパラメータで購入クレジットを取得
  const searchParams = useSearchParams();
  const credits = searchParams?.get("credits") ?? "0";

  // 現在のロケール
  const locale = useLocale();

  // "purchaseSuccess" セクションの文言を取得
  const t = useTranslations("purchaseSuccess");

  // カラーモードに応じた文字色やボタンカラー
  const textColor = useColorModeValue("gray.700", "gray.100");
  const btnColorScheme = useColorModeValue("blue", "cyan");

  // 画面サイズ（Confetti 用）
  const { width, height } = useWindowSize();

  return (
    <Box
      as={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 } as any}
      minH="100vh"
      display="flex"
      flexDir="column"
      justifyContent="center"
      alignItems="center"
      bgGradient="linear(to-b, blue.600, purple.700)"
      px={4}
      py={16}
    >
      {/* Confetti（紙吹雪）の描画 */}
      <Confetti
        width={width}
        height={height}
        recycle={false}
        numberOfPieces={300}
        gravity={0.2}
      />

      <Container
        maxW="md"
        textAlign="center"
        bg={useColorModeValue("whiteAlpha.900", "whiteAlpha.100")}
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
          {/* 例: "ご購入ありがとうございます！" */}
        </Heading>

        {/* 購入クレジットの案内を表示 */}
        {credits && (
          <Text fontSize="lg" mb={6} color={textColor}>
            {t("creditsMsg", { credits })}
            {/* 例: "今回は 1000 クレジットを追加しました。" */}
          </Text>
        )}

        <Text mb={6} color={textColor}>
          {t("description")}
          {/* 例: "引き続きAIえほんをお楽しみください。" */}
        </Text>

        <VStack spacing={4}>
          <Link href={`/${locale}/ehon/create`}>
            <Button colorScheme={btnColorScheme} size="md">
              {t("goCreate")}
              {/* 例: "絵本を作成する" */}
            </Button>
          </Link>

          <Link href={`/${locale}`}>
            <Button variant="outline" size="md" colorScheme={btnColorScheme}>
              {t("goHome")}
              {/* 例: "トップページへ戻る" */}
            </Button>
          </Link>
        </VStack>
      </Container>
    </Box>
  );
}

/**
 * PurchaseSuccessPage コンポーネント
 * - 内部の PurchaseSuccessContent を Suspense バウンダリでラップして、
 *   useSearchParams() によるエラーを回避する
 */
export default function PurchaseSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PurchaseSuccessContent />
    </Suspense>
  );
}
