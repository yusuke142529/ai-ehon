"use client";

import React, { FC, useEffect, useState } from "react";
import NextLink from "next/link";
import {
  Button,
  ButtonProps,
  Tooltip,
  Box,
  Icon
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { motion, Variants } from "framer-motion";
// Remix Icon: フィードバック用アイコン
import { RiFeedbackLine } from "react-icons/ri";

/** グラデーションアニメーション (背景が左右に移動する) */
const gradientKeyframes = keyframes`
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

/** Framer Motion 用のBox */
const MotionBox = motion(Box);

/** 3Dチルト & スケールアニメのバリアント */
const buttonVariants: Variants = {
  rest: {
    rotateX: 0,
    rotateY: 0,
    scale: 1,
  },
  hover: {
    rotateX: 8,
    rotateY: 8,
    scale: 1.05,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  tap: {
    scale: 0.95,
    rotateX: 0,
    rotateY: 0,
    transition: { duration: 0.05, ease: "easeInOut" },
  },
};

/** アイコンの軽い回転アニメバリアント */
const iconVariants: Variants = {
  rest:  { rotate: 0 },
  hover: { rotate: 15 },
  tap:   { rotate: 360 },
};

/** 
 * プロパティ: 
 * - href: フィードバック用フォームなどへのURL
 * - text: ツールチップやaria-labelに表示する文言 (デフォ: "バグ・要望を報告する")
 */
export interface FeedbackButtonProps extends ButtonProps {
  href: string;
  text?: string;
}

/**
 * ===== 究極のフィードバックボタン =====
 * - アイコンのみ表示 (RiFeedbackLine)
 * - ガラス風ツールチップ (暗め背景 + blur)
 * - ページ読み込み後5秒だけ自動表示、その後もホバーで表示
 * - 3Dチルト、リングエフェクトなど派手なアニメを実装
 */
export const FeedbackButton: FC<FeedbackButtonProps> = ({
  href,
  text = "バグ・要望を報告する",
  ...buttonProps
}) => {
  // 5秒だけ自動でツールチップを表示するフラグ
  const [isAutoOpen, setIsAutoOpen] = useState(true);
  // マウスホバーによるフラグ
  const [isHover, setIsHover] = useState(false);

  // マウント後 5秒で isAutoOpen = false
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAutoOpen(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Tooltip
      label={text}
      placement="top"
      hasArrow
      // ガラス風にするための設定
      bg="rgba(0,0,0,0.3)"
      backdropFilter="blur(8px)"
      color="white"
      border="1px solid rgba(255,255,255,0.3)"
      boxShadow="0 8px 32px rgba(0,0,0,0.2)"
      borderRadius="md"
      px="1rem"
      py="0.5rem"
      // isOpen を自動表示 + ホバーで表示
      isOpen={isAutoOpen || isHover}
    >
      <Box
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        display="inline-block"
      >
        <Button
          as={NextLink}
          href={href}
          bg="transparent"
          color="white"
          aria-label={text}
          _hover={{}}
          _active={{}}
          _focusVisible={{
            outline: "2px solid white",
            outlineOffset: "2px",
          }}
          p={0}
          {...buttonProps}
        >
          <MotionBox
            // グラデーション背景 + アニメーション
            bgGradient="linear(to-r, teal.400, purple.500)"
            backgroundSize="400% 100%"
            animation={`${gradientKeyframes} 8s ease infinite`}

            // 3Dチルト + ボックスシャドウ
            style={{ perspective: "1000px" }}
            borderRadius="lg"
            boxShadow="0 0 15px rgba(100,100,255,0.4)"
            variants={buttonVariants}
            initial="rest"
            whileHover="hover"
            whileTap="tap"
            display="inline-block"
            position="relative"
            p="0.3rem"
          >
            {/* リングエフェクト (ホバー時に広がる) */}
            <MotionBox
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              borderRadius="50%"
              bg="rgba(255,255,255,0.4)"
              zIndex={-1}
              width="0px"
              height="0px"
              variants={{
                rest:  { width: 0, height: 0, opacity: 0 },
                hover: {
                  width: 220,
                  height: 220,
                  opacity: 0.4,
                  transition: { duration: 0.3, ease: "easeOut" },
                },
                tap: { opacity: 0.7 },
              }}
            />

            {/* アイコン: RiFeedbackLine */}
            <MotionBox variants={iconVariants} display="inline-block">
              <Icon as={RiFeedbackLine} boxSize={5} />
            </MotionBox>
          </MotionBox>
        </Button>
      </Box>
    </Tooltip>
  );
};