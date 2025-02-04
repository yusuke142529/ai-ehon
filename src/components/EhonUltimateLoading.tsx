"use client";

import React from "react";
import { Box, Text, Center, useColorModeValue } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
import { useTranslations } from "next-intl";

// ▼ 単一のLottieアニメ - 例として "loadingAnimation.json"
import loadingAnimation from "@/lotties/loadingAnimation.json";

/**
 * 単一ファイルの Lottie アニメーションを使ったローディング画面。
 * 
 * - 背景は少しぼかしやグラデーションを重ね、高級感を演出
 * - フェードイン/アウトを滑らかに
 * - コンテナ中央にアニメ + 一言メッセージ
 */
export default function EhonUltimateLoading() {
  const t = useTranslations("loading"); // 例: loading.json内に"waitMessage"等ある想定

  // Chakra UIの配色
  const bgGradient = useColorModeValue(
    "linear(to-r, rgba(255,255,255,0.4), rgba(255,255,255,0.2))",
    "linear(to-r, rgba(0,0,0,0.4), rgba(0,0,0,0.2))"
  );

  return (
    <AnimatePresence>
      {/* オーバーレイ全体 */}
      <Box
        as={motion.div}
        position="fixed"
        top={0}
        left={0}
        w="100%"
        h="100%"
        // 背景色 + グラデーション + ぼかし
        bg="rgba(0, 0, 0, 0.3)"
        backdropFilter="blur(10px)"
        backgroundImage={bgGradient}
        zIndex={9999}
        display="flex"
        alignItems="center"
        justifyContent="center"
        // フェードイン/アウト
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* メインコンテンツ */}
        <Box
          as={motion.div}
          bg="whiteAlpha.800" 
          _dark={{ bg: "blackAlpha.700" }}
          p={6}
          rounded="md"
          shadow="lg"
          w="90%"
          maxW="sm"
          textAlign="center"
          // 中身のフェード+上から降りてくるようなアニメ
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Center>
            <Box w={[150, 200]} h={[150, 200]}>
              <Lottie
                animationData={loadingAnimation}
                loop
                style={{ width: "100%", height: "100%" }}
              />
            </Box>
          </Center>

          {/* メッセージ */}
          <Text fontSize="md" color="gray.700" _dark={{ color: "gray.100" }} mt={4}>
            {t("waitMessage") /* ex: "しばらくお待ちください…" */}
          </Text>
        </Box>
      </Box>
    </AnimatePresence>
  );
}