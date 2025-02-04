"use client";

import React, { useEffect } from "react";
import {
  Box,
  Flex,
  Spacer,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Avatar,
  useColorMode,
  useColorModeValue,
  HStack,
  chakra,
  Button
} from "@chakra-ui/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SunIcon, MoonIcon } from "@chakra-ui/icons";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useUserSWR } from "@/hook/useUserSWR";

/** Framer Motion ラッパ */
const MotionBox = motion(chakra.div);
const MotionButton = motion(Button);
const MotionMenuList = motion(MenuList);
const MotionMenuItem = motion(MenuItem);

export default function Header() {
  // 1. ロケール取得
  const locale = useLocale();
  // 2. ルーターと現在のパス
  const router = useRouter();
  const pathname = usePathname();

  // 3. NextAuth セッション
  const { data: session } = useSession();
  const isLoggedIn = !!session;

  // 4. ユーザー情報 (points)
  const { user } = useUserSWR();

  // 5. カラーモード (Chakra UI)
  const { colorMode, toggleColorMode } = useColorMode();
  const bg = useColorModeValue("white", "gray.800");

  // カラーモードCookieを更新
  useEffect(() => {
    document.cookie = `chakra-ui-color-mode=${colorMode}; path=/; max-age=31536000`;
  }, [colorMode]);

  /** 言語切り替え */
  const handleLocaleSwitch = () => {
    const nextLocale = locale === "ja" ? "en" : "ja";
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000`;
    const newPath = pathname.replace(/^\/(ja|en)/, `/${nextLocale}`);
    router.push(newPath);
  };

  /** ログインページへ (未ログイン時) */
  const handleLoginRedirect = () => {
    const callbackUrl = encodeURIComponent(pathname);
    router.push(`/${locale}/auth/login?callbackUrl=${callbackUrl}`);
  };

  /** 購入ページへ遷移 */
  const handleGoPurchase = () => {
    router.push(`/${locale}/purchase`);
  };

  // アバター (ホバー時にリングが広がる演出)
  const AvatarWithRing = ({ src, name }: { src?: string; name?: string }) => (
    <Box position="relative" display="inline-block">
      <MotionBox
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        w="60px"
        h="60px"
        borderRadius="50%"
        border="2px solid"
        borderColor="blue.300"
        zIndex={-1}
        initial={{ scale: 0 }}
        whileHover={{ scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        pointerEvents="none"
      />
      <Avatar size="sm" name={name} src={src} _hover={{ cursor: "pointer" }} />
    </Box>
  );

  return (
    <Flex
      as="header"
      position="sticky"
      top={0}
      zIndex="sticky"
      p={4}
      borderBottom="1px solid"
      borderColor={useColorModeValue("gray.200", "gray.700")}
      alignItems="center"
      bg={bg}
      boxShadow="sm"
    >
      {/* ロゴ */}
      <Link href={`/${locale}`} style={{ textDecoration: "none" }}>
        <Box
          as={motion.div}
          fontSize="xl"
          fontWeight="bold"
          color="blue.500"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          {locale === "ja" ? "AIえほんメーカー" : "AI Ehon Maker"}
        </Box>
      </Link>

      <Spacer />

      {/* (1) カプセル型「pt購入」ボタン (パルスリング) ※常時表示 */}
      <MotionButton
        borderRadius="full"
        px={4}
        py={2}
        bg="teal.600"
        color="white"
        fontWeight="bold"
        position="relative"
        overflow="hidden"
        display="flex"
        alignItems="center"
        mr={4}
        whileHover={{ scale: 1.1 }} // ボタン拡大
        onClick={handleGoPurchase}
      >
        {/* Inner ring */}
        <MotionBox
          position="absolute"
          borderRadius="full"
          border="2px solid rgba(255,255,255,0.4)"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          initial={{ scale: 0.7, opacity: 0 }}
          whileHover={{
            scale: [0.7, 1, 0.7],
            opacity: [0, 0.6, 0],
            transition: {
              repeat: Infinity,
              duration: 2,
            },
          }}
          pointerEvents="none"
          w="180%"
          h="180%"
          zIndex={-1}
        />
        {/* Outer ring */}
        <MotionBox
          position="absolute"
          borderRadius="full"
          border="2px solid rgba(255,255,255,0.2)"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          initial={{ scale: 0.5, opacity: 0 }}
          whileHover={{
            scale: [0.5, 0.9, 0.5],
            opacity: [0, 0.4, 0],
            transition: {
              repeat: Infinity,
              duration: 2,
              delay: 1,
            },
          }}
          pointerEvents="none"
          w="250%"
          h="250%"
          zIndex={-1}
        />
        {/* "[1234pt]" */}
        {`${user?.points ?? 0}pt`}
      </MotionButton>

      {/* (2) ユーザーアバター or Login: 言語切り替え + ダークモード + MyPage/Login/Logout をMenuに集約 */}
      <Menu>
        <MenuButton
          as={Button}
          variant="outline"
          _hover={{ transform: "scale(1.03)", transition: "transform 0.1s" }}
        >
          {isLoggedIn ? (
            <HStack spacing={2}>
              <AvatarWithRing
                src={user?.iconUrl ?? ""}
                name={user?.name ?? (locale === "ja" ? "名無し" : "NoName")}
              />
              <Box as="span" fontSize="sm">
                {user?.name ?? (locale === "ja" ? "名無し" : "NoName")}
              </Box>
            </HStack>
          ) : (
            <HStack spacing={2}>
              <AvatarWithRing src="" name={locale === "ja" ? "ゲスト" : "Guest"} />
              <Box as="span" fontSize="sm">
                {locale === "ja" ? "ゲスト" : "Guest"}
              </Box>
            </HStack>
          )}
        </MenuButton>

        <AnimatePresence>
          <MotionMenuList
            // **3Dフリップ + Glass + Stagger** 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            bg="rgba(255,255,255,0.2)"
            backdropFilter="blur(10px)"
            border="1px solid rgba(255,255,255,0.3)"
            boxShadow="0 8px 32px rgba(0,0,0,0.2)"
            borderRadius="md"
          >
            {/* 言語切り替え */}
            <MotionMenuItem variants={itemVariants} onClick={handleLocaleSwitch}>
              {locale === "ja"
                ? "Englishに切り替え"
                : "Switch to 日本語"}
            </MotionMenuItem>
            {/* ダーク/ライトモード */}
            <MotionMenuItem variants={itemVariants} onClick={toggleColorMode}>
              {colorMode === "light"
                ? locale === "ja"
                  ? "ダークモード"
                  : "Dark Mode"
                : locale === "ja"
                ? "ライトモード"
                : "Light Mode"}
            </MotionMenuItem>

            {isLoggedIn ? (
              <>
                {/* Mypage */}
                <MotionMenuItem
                  variants={itemVariants}
                  as={Link}
                  href={`/${locale}/mypage`}
                >
                  {locale === "ja" ? "マイページ" : "My Page"}
                </MotionMenuItem>
                {/* Logout */}
                <MotionMenuItem
                  variants={itemVariants}
                  onClick={() => signOut()}
                >
                  {locale === "ja" ? "ログアウト" : "Logout"}
                </MotionMenuItem>
              </>
            ) : (
              <>
                {/* Login */}
                <MotionMenuItem variants={itemVariants} onClick={handleLoginRedirect}>
                  {locale === "ja" ? "ログイン" : "Login"}
                </MotionMenuItem>
              </>
            )}
          </MotionMenuList>
        </AnimatePresence>
      </Menu>
    </Flex>
  );
}

/** (A) メニューコンテナ用バリアント: 3Dフリップ + childrenスタッガ */
const containerVariants = {
  hidden: {
    opacity: 0,
    rotateX: -90, 
    transformOrigin: "top center",
  },
  show: {
    opacity: 1,
    rotateX: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
      staggerChildren: 0.06, // 項目を少しずつ
    },
  },
  exit: {
    opacity: 0,
    rotateX: -90,
  },
};

/** (B) 各MenuItem のバリアント: フェード + yアップ */
const itemVariants = {
  hidden: { opacity: 0, y: -6 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 },
  },
};