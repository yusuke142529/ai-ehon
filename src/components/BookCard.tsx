"use client";

import React from "react";
import {
  AspectRatio,
  Box,
  Text,
  Image,
  useColorModeValue,
} from "@chakra-ui/react";
import { motion, Variants } from "framer-motion";

// Framer Motion 拡張
const MotionBox = motion(Box);

type BookCardProps = {
  id: number;
  title: string;
  coverImage?: string;
  theme?: string;
  genre?: string;
  characters?: string;
  artStyle?: any;
  targetAge?: string;
  pageCount?: number;
  isFavorite?: boolean;
};

// (1) アニメーション定義
const containerVariants: Variants = {
  closed: {
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  open: {
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const coverGroupVariants: Variants = {
  closed: { rotateY: 0 },
  open: {
    rotateY: [-130, -120, -130],
    transition: {
      duration: 0.7,
      ease: "easeInOut",
      times: [0, 0.5, 1],
    },
  },
};

/**
 * BookCard
 * - 視覚的なカード
 * - 親要素(HomeClient)が <Link> で囲むことでページ遷移する（router.push不要）
 * - カードをクリックするとフリップアニメ（開閉）
 */
export default function BookCard({
  id,
  title,
  coverImage = "/images/sample-cover.png",
  theme,
  genre,
  characters,
  artStyle,
  targetAge,
  pageCount,
  isFavorite
}: BookCardProps) {
  const titleColor = useColorModeValue("gray.800", "gray.50");
  const [isOpen, setIsOpen] = React.useState(false);

  // 背表紙 & 表紙テクスチャ
  const spineTexture = "/images/leather_texture.jpg";
  const coverTexture = "/images/paper_texture.png";

  return (
    <Box position="relative" w="fit-content" mx="auto" my={6}>
      {/* 下の影 */}
      <MotionBox
        position="absolute"
        top="100%"
        left="50%"
        transform="translateX(-50%)"
        w="160px"
        h="30px"
        bgGradient="radial(rgba(0,0,0,0.18) 30%, transparent 70%)"
        zIndex={-1}
        style={{
          rotateX: isOpen ? 10 : 0,
          rotateZ: isOpen ? 5 : 0,
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        filter="blur(2px)"
        opacity={0.6}
      />

      <AspectRatio ratio={995 / 1167} w="200px" style={{ perspective: "800px" }}>
        <MotionBox
          variants={containerVariants}
          initial="closed"
          animate={isOpen ? "open" : "closed"}
          style={{
            transformStyle: "preserve-3d",
            transformOrigin: "left center",
          }}
          position="absolute"
          top={0}
          left={0}
          w="full"
          h="full"
          boxShadow="0 6px 12px rgba(0,0,0,0.3)"
          whileHover={{
            rotateX: 8,
            rotateY: -5,
            scale: 1.05,
          }}
          transition={{ duration: 0.3 }}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          {/* CoverGroup */}
          <MotionBox
            variants={coverGroupVariants}
            style={{
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
              transformOrigin: "left center",
            }}
            position="absolute"
            top={0}
            left={0}
            w="full"
            h="full"
            zIndex={2}
          >
            {/* 背表紙 */}
            <Box
              position="absolute"
              top={0}
              left={0}
              w="full"
              h="full"
              bgImage={`url(${spineTexture})`}
              bgSize="100% 100%"
              bgPos="center"
              bgRepeat="no-repeat"
              style={{
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
              }}
            />

            {/* 表紙 */}
            <Box
              position="absolute"
              top="17px"
              left="28px"
              w="calc(100% - 50px)"
              h="calc(100% - 35px)"
              borderRadius="6px"
              overflow="hidden"
              bgImage={`url(${coverTexture})`}
              bgSize="cover"
              bgPos="center"
              bgRepeat="repeat"
              style={{
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
              }}
            >
              {/* 光沢エフェクト */}
              <Box
                position="absolute"
                top={0}
                left={0}
                w="full"
                h="full"
                pointerEvents="none"
                bgGradient="radial(rgba(255,255,255,0.15) 0%, transparent 80%)"
                opacity={0.3}
              />

              {/* 表紙イメージ */}
              <Box w="full" h="140px" overflow="hidden">
                <Image
                  src={coverImage}
                  alt={`${title} cover`}
                  w="full"
                  h="full"
                  objectFit="cover"
                  style={{ backfaceVisibility: "hidden" }}
                />
              </Box>

              {/* タイトル部分 */}
              <Box px={3} pt={2} pb={3} color={titleColor}>
                <Text
                  fontFamily="'Kosugi Maru', sans-serif"
                  fontWeight="bold"
                  fontSize="sm"
                  noOfLines={2}
                  mb={2}
                  style={{ backfaceVisibility: "hidden" }}
                >
                  {title}
                </Text>

                {/* isFavorite 等の表示は必要に応じてここに追加可 */}
              </Box>
            </Box>
          </MotionBox>
        </MotionBox>
      </AspectRatio>
    </Box>
  );
}