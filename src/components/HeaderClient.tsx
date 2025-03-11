"use client";

import React, { useEffect, useState } from "react";
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
  Button,
  BoxProps,
} from "@chakra-ui/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useUserSWR } from "@/hook/useUserSWR";
import { FeedbackButton } from "@/components/FeedbackButton";
import { useImmersive } from "@/app/[locale]/LayoutClientWrapper";

// ------ アニメーション設定（元のコードを流用） ------
const MotionBox = motion<Omit<BoxProps, "transition">>(chakra.div);
const MotionButton = motion(Button);
const MotionMenuList = motion(MenuList);
const MotionMenuItem = motion(MenuItem);

const containerVariants = {
  hidden: { opacity: 0, rotateX: -90, transformOrigin: "top center" },
  show: {
    opacity: 1,
    rotateX: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
      staggerChildren: 0.06,
    },
  },
  exit: { opacity: 0, rotateX: -90 },
};

const itemVariants = {
  hidden: { opacity: 0, y: -6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

// ------ Props 定義 ------
type HeaderClientProps = {
  locale: string;
  hide?: boolean; // Added hide prop
};

export default function HeaderClient({ locale, hide = false }: HeaderClientProps) {
  // クライアントサイドのみのレンダリングを確認
  const [mounted, setMounted] = useState(false);
  const { immersiveMode, isClient } = useImmersive();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const router = useRouter();
  const pathname = usePathname();

  // next-auth のクライアントセッション
  const { data: session } = useSession();
  const isLoggedIn = !!session;

  // SWR でユーザー情報取得
  const { user } = useUserSWR();

  // Chakra UI カラーモード
  const { colorMode, toggleColorMode } = useColorMode();
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  // SSR/CSR一致のため、本来はColorModeScriptなどが望ましいが、暫定的にcookieセット
  useEffect(() => {
    document.cookie = `chakra-ui-color-mode=${colorMode}; path=/; max-age=31536000`;
  }, [colorMode]);

  // 言語切り替えハンドラ
  const handleLocaleSwitch = () => {
    const nextLocale = locale === "ja" ? "en" : "ja";
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000`;
    const newPath = (pathname ?? "").replace(/^\/(ja|en)/, `/${nextLocale}`);
    router.push(newPath);
  };

  // ログインへ
  const handleLoginRedirect = () => {
    const callbackUrl = encodeURIComponent(pathname ?? "");
    router.push(`/${locale}/auth/login?callbackUrl=${callbackUrl}`);
  };

  // pt購入ページへ
  const handleGoPurchase = () => {
    router.push(`/${locale}/purchase`);
  };

  // アバター + アニメーションリング
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

  // クライアントサイドのみの条件でレンダリングするようにする
  // Added check for hide prop
  if (!mounted || (isClient && immersiveMode) || hide) {
    return null;
  }

  return (
    <Flex
      as="div"
      position="sticky"
      top={0}
      zIndex="sticky"
      p={4}
      borderBottom="1px solid"
      borderColor={borderColor}
      alignItems="center"
      bg={bg}
      boxShadow="sm"
    >
      {/* 左ロゴ */}
      <Link href={`/${locale}`} style={{ textDecoration: "none" }}>
        <MotionBox
          fontSize="xl"
          fontWeight="bold"
          color="blue.500"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          {locale === "ja" ? "AIえほんメーカー" : "AI Ehon Maker"}
        </MotionBox>
      </Link>

      <Spacer />

      <HStack spacing={4}>
        {/* pt(ポイント)購入ボタン */}
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
          whileHover={{ scale: 1.1 }}
          onClick={handleGoPurchase}
        >
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
              transition: { repeat: Infinity, duration: 2 },
            }}
            pointerEvents="none"
            w="180%"
            h="180%"
            zIndex={-1}
          />
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
              transition: { repeat: Infinity, duration: 2, delay: 1 },
            }}
            pointerEvents="none"
            w="250%"
            h="250%"
            zIndex={-1}
          />
          {`${user?.points ?? 0}pt`}
        </MotionButton>

        {/* フィードバックボタン */}
        <FeedbackButton
          href={`/${locale}/contact`}
          text={locale === "ja" ? "バグ・要望を報告する" : "Send Feedback"}
        />

        {/* ユーザーメニュー */}
        <Menu>
          <MenuButton
            as={Button}
            variant="outline"
            borderRadius="full"
            _hover={{ transform: "scale(1.03)", transition: "transform 0.1s" }}
          >
            {isLoggedIn ? (
              <HStack spacing={2}>
                <AvatarWithRing
                  src={user?.image ?? ""}
                  name={user?.name ?? (locale === "ja" ? "名無し" : "NoName")}
                />
                <Box as="span" fontSize="sm">
                  {user?.name ?? (locale === "ja" ? "名無し" : "NoName")}
                </Box>
              </HStack>
            ) : (
              <HStack spacing={2}>
                <AvatarWithRing
                  src=""
                  name={locale === "ja" ? "ゲスト" : "Guest"}
                />
                <Box as="span" fontSize="sm">
                  {locale === "ja" ? "ゲスト" : "Guest"}
                </Box>
              </HStack>
            )}
          </MenuButton>

          <AnimatePresence>
            <MotionMenuList
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
              <MotionMenuItem variants={itemVariants} onClick={handleLocaleSwitch}>
                {locale === "ja" ? "Englishに切り替え" : "Switch to 日本語"}
              </MotionMenuItem>
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
                  <MotionMenuItem
                    variants={itemVariants}
                    as={Link}
                    href={`/${locale}/mypage`}
                  >
                    {locale === "ja" ? "マイページ" : "My Page"}
                  </MotionMenuItem>
                  <MotionMenuItem
                    variants={itemVariants}
                    onClick={() => signOut()}
                  >
                    {locale === "ja" ? "ログアウト" : "Logout"}
                  </MotionMenuItem>
                </>
              ) : (
                <MotionMenuItem variants={itemVariants} onClick={handleLoginRedirect}>
                  {locale === "ja" ? "ログイン" : "Login"}
                </MotionMenuItem>
              )}
            </MotionMenuList>
          </AnimatePresence>
        </Menu>
      </HStack>
    </Flex>
  );
}