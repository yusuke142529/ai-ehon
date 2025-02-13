"use client";

import React, { memo, useCallback } from "react";
import { Box, Flex, Button, Heading } from "@chakra-ui/react";
import { motion } from "framer-motion";
import Particles from "@tsparticles/react";
import { loadFull } from "tsparticles";
import Lottie from "lottie-react";
import loadingAnimation from "@/lotties/loadingAnimation.json";

// Chakra UI の Box を motion 対応させる
const MotionBox = motion(Box);

interface EnhancedLoadingOverlayProps {
  /** キャンセルボタンがクリックされたときに呼ばれるコールバック */
  onCancel?: () => void;
}

const EnhancedLoadingOverlay: React.FC<EnhancedLoadingOverlayProps> = ({ onCancel }) => {
  // Particles の初期化（全機能を読み込む）
  const particlesInit = useCallback(async (engine: any) => {
    await loadFull(engine);
  }, []);

  return (
    <>
      {/* グラデーション背景用のキーフレーム定義 */}
      <style>{`
        @keyframes gradientAnimation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .gradient-background {
          background: linear-gradient(45deg, #ff9a9e, #fad0c4, #fad0c4, #ff9a9e);
          background-size: 400% 400%;
          animation: gradientAnimation 15s ease infinite;
        }
      `}</style>

      {/* オーバーレイ全体 */}
      <Box
        position="fixed"
        top="0"
        left="0"
        width="100%"
        height="100%"
        zIndex="9999"
        overflow="hidden"
        bg="transparent" // ※ここで背景色を明示的に指定
      >
        {/* 背景レイヤー */}
        <Box position="absolute" top="0" left="0" width="100%" height="100%" zIndex="1">
          {/* グラデーション背景 */}
          <Box
            className="gradient-background"
            position="absolute"
            top="0"
            left="0"
            width="100%"
            height="100%"
            zIndex="1"
          />
          {/* パーティクルエフェクト */}
          <Box position="absolute" top="0" left="0" width="100%" height="100%" zIndex="2">
            <Particles
              init={particlesInit}
              options={particlesOptions}
              style={{ width: "100%", height: "100%", pointerEvents: "none" }}
            />
          </Box>
          {/* 幾何学模様のオーバーレイ（回転アニメーション付き） */}
          <MotionBox
            as="svg"
            position="absolute"
            top="0"
            left="0"
            width="100%"
            height="100%"
            zIndex="3"
            viewBox="0 0 800 600"
            preserveAspectRatio="none"
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 120, ease: "linear", repeat: Infinity }}
          >
            <defs>
              <pattern id="hexPattern" patternUnits="userSpaceOnUse" width="100" height="86.6">
                <polygon
                  points="50,0 100,25 100,75 50,100 0,75 0,25"
                  stroke="#ffffff"
                  strokeWidth="0.5"
                  fill="none"
                  opacity="0.1"
                />
              </pattern>
            </defs>
            <rect width="800" height="600" fill="url(#hexPattern)" />
          </MotionBox>
        </Box>

        {/* 中央のコンテンツ部分 */}
        <Flex
          position="relative"
          zIndex="10"
          direction="column"
          align="center"
          justify="center"
          width="100%"
          height="100%"
          color="#FFF"
          textAlign="center"
          p="1rem"
        >
          {/* Lottie アニメーション */}
          <Box width="200px" height="200px" mb="1rem">
            <Lottie animationData={loadingAnimation} loop={true} />
          </Box>
          <Heading fontSize="1.5rem" mb="1rem">
            Loading...
          </Heading>
          {/* キャンセルボタン（必要な場合のみ） */}
          {onCancel && (
            <Button mt="0.5rem" px="1rem" bg="red.500" color="white" borderRadius="4px" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </Flex>
      </Box>
    </>
  );
};

export default memo(EnhancedLoadingOverlay);

// Particles のオプション設定
const particlesOptions = {
  background: {
    color: { value: "transparent" },
  },
  fpsLimit: 60,
  interactivity: {
    events: {
      onHover: { enable: false },
      resize: true,
    },
  },
  particles: {
    color: { value: "#ffffff" },
    links: {
      color: "#ffffff",
      distance: 150,
      enable: true,
      opacity: 0.2,
      width: 1,
    },
    collisions: { enable: false },
    move: {
      direction: "none",
      enable: true,
      outMode: "bounce",
      random: false,
      speed: 1,
      straight: false,
    },
    number: {
      density: { enable: true, area: 800 },
      value: 50,
    },
    opacity: { value: 0.3 },
    shape: { type: "circle" },
    size: { random: true, value: 3 },
  },
  detectRetina: true,
};