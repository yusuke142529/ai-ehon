"use client";
import React, { FC } from "react";
import NextLink from "next/link";
import { 
  Button, 
  ButtonProps, 
  Icon, 
  VisuallyHidden, 
  Box, 
  keyframes 
} from "@chakra-ui/react";
import { FaBug } from "react-icons/fa";
import { motion, Variants } from "framer-motion";

// (A) Chakra UIの keyframes で定義するグラデーションアニメ
const gradientKeyframes = keyframes`
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

/**
 * フレームモーション用にラップしたBox
 */
const MotionBox = motion(Box);

const buttonVariants: Variants = {
  rest: {
    rotateX: 0,
    rotateY: 0,
    scale: 1,
  },
  hover: {
    rotateX: 8,  // ちょっと奥に傾く
    rotateY: 8, 
    scale: 1.05,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  tap: {
    scale: 0.95,
    rotateX: 0,
    rotateY: 0,
    transition: {
      duration: 0.05,
      ease: "easeInOut",
    },
  },
};

const iconVariants: Variants = {
  rest: { rotate: 0 },
  hover: { rotate: 20 },
  tap:   { rotate: 360 },
};

export interface FeedbackButtonProps extends ButtonProps {
  /** バグ・要望を報告するための問い合わせフォームURL */
  href: string;
  /** ボタンに表示するテキスト */
  text?: string;
}

/**
 * 究極のフィードバックボタン
 */
export const FeedbackButton: FC<FeedbackButtonProps> = ({
  href,
  text = "バグ・要望を報告する",
  ...buttonProps
}) => {
  return (
    <MotionBox
      // ここで、backgroundにグラデーション + keyframesアニメを設定
      bgGradient="linear(to-r, red.400, orange.400, yellow.400, orange.400, red.400)"
      backgroundSize="400% 100%" 
      animation={`${gradientKeyframes} 5s ease infinite`}
      
      // 3Dチルトのための perspective
      style={{ perspective: "1000px" }}
      borderRadius="lg"
      boxShadow="0 0 15px rgba(255,100,100,0.6)"
      
      // Framer Motion variants
      variants={buttonVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      
      display="inline-block"
      position="relative"
      p="0.2rem" 
      // ↑ このパディングを少しとることで、MotionBox自体に余裕を持たせ
      //   Buttonとの間を区別しやすくしています
    >
      {/* リングエフェクト: ホバー時に膨張 */}
      <MotionBox
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        borderRadius="50%"
        bg="rgba(255,255,255,0.3)"
        zIndex={-1}
        width="0px"
        height="0px"
        variants={{
          rest: { width: 0, height: 0, opacity: 0 },
          hover: {
            width: 200,
            height: 200,
            opacity: 0.3,
            transition: { duration: 0.3, ease: "easeOut" },
          },
          tap: { opacity: 0.6 },
        }}
      />

      {/* 実際のボタン (Chakra) */}
      <Button
        as={NextLink}
        href={href}
        bg="transparent"
        color="white"
        leftIcon={
          <MotionBox variants={iconVariants} display="inline-block">
            <Icon as={FaBug} />
          </MotionBox>
        }
        px={6}
        py={4}
        fontWeight="bold"
        borderRadius="md"
        fontSize="md"
        aria-label="バグや問題の報告、および機能要望を送信するフォームへ移動"
        _hover={{}} 
        _active={{}}
        _focusVisible={{
          outline: "2px solid white",
          outlineOffset: "2px",
        }}
        {...buttonProps}
      >
        {text}
        <VisuallyHidden>
          バグや問題点の詳細、および追加の機能要望を開発チームに送信できます
        </VisuallyHidden>
      </Button>
    </MotionBox>
  );
};