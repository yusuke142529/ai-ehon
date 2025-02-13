"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Box,
  Flex,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  Text,
  Progress,
  Link as ChakraLink,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  FormErrorMessage,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import NextLink from "next/link";
import { FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import zxcvbn from "zxcvbn"; // パスワード強度を算定

// Framer Motion 用のラップコンポーネント
const MotionBox = motion(Box);

/**
 * ResetPasswordForm コンポーネント
 * - クエリからトークンを取得し、パスワードリセットのフォームを表示する
 * - useSearchParams() を利用しているので、Suspense バウンダリ内で使用します。
 */
function ResetPasswordForm() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  // クエリからトークンを取得 (?token=xxx)
  const token = searchParams?.get("token") || "";

  // 入力された新パスワード
  const [newPassword, setNewPassword] = useState("");
  // パスワードの強度 (0~4)
  const [passwordScore, setPasswordScore] = useState(0);
  // バリデーションエラーメッセージ
  const [newPasswordError, setNewPasswordError] = useState("");

  // パスワードの表示/非表示
  const [showPassword, setShowPassword] = useState(false);
  // API 通信中のローディングフラグ
  const [isLoading, setIsLoading] = useState(false);

  // --- トークンが存在しない場合はログインページへリダイレクト ---
  useEffect(() => {
    if (!token) {
      toast({
        title: t("resetPasswordNoTokenTitle"), // 例: "エラー"
        description: t("resetPasswordNoTokenDesc"), // 例: "トークンが見つかりません"
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      router.push(`/${locale}/auth/login`);
    }
  }, [token, toast, router, t, locale]);

  // --- zxcvbn によるパスワード強度チェックとエラー設定 ---
  useEffect(() => {
    const result = zxcvbn(newPassword);
    setPasswordScore(result.score);

    // score が低い場合、または長さが短い場合にエラー表示（調整可能）
    if (result.score < 3 && newPassword.length > 0) {
      setNewPasswordError(t("resetPasswordWeakPasswordError"));
    } else {
      setNewPasswordError("");
    }
  }, [newPassword, t]);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  // --- フォーム送信ハンドラ ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // トークンが無い場合は何もしない
    if (!token) return;

    // バリデーションエラーがあれば中断
    if (newPasswordError) {
      toast({
        title: t("resetPasswordErrorTitle"),
        description: t("resetPasswordErrorDesc"),
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    // パスワード未入力の場合もエラー
    if (!newPassword) {
      toast({
        title: t("resetPasswordErrorTitle"),
        description: t("resetPasswordErrorDesc"),
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      // API へパスワードリセットリクエスト
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      setIsLoading(false);

      if (!res.ok) {
        throw new Error(data.error || t("resetPasswordToastFailDesc"));
      }

      toast({
        title: t("resetPasswordToastSuccessTitle"),
        description: t("resetPasswordToastSuccessDesc"),
        status: "success",
        duration: 4000,
        isClosable: true,
      });

      // ログインページへリダイレクト（ロケール付き）
      router.push(`/${locale}/auth/login`);
    } catch (err: any) {
      setIsLoading(false);
      toast({
        title: t("resetPasswordToastFailTitle"),
        description: err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  }

  // パスワード強度バーのパーセント値 (score 0～4 を 0～100 に換算)
  const passwordStrengthPercent = (passwordScore / 4) * 100;

  // フォームのアニメーション設定
  const formVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-tr, purple.200, pink.100, white)"
      py={[8, 12]}
      px={4}
    >
      <Heading
        textAlign="center"
        color="white"
        mb={[6, 10]}
        fontSize={["3xl", "4xl", "5xl"]}
        textShadow="1px 1px 2px rgba(0,0,0,0.3)"
      >
        {t("resetPasswordTitle")}
      </Heading>

      <Flex justify="center" align="center">
        <MotionBox
          maxW="md"
          w="full"
          bg="white"
          p={[6, 8]}
          borderRadius="lg"
          boxShadow="2xl"
          variants={formVariants}
          initial="hidden"
          animate="visible"
        >
          <Heading
            as="h2"
            fontSize="xl"
            mb={4}
            textAlign="center"
            color="gray.700"
          >
            {t("resetPasswordTitle")}
          </Heading>

          <form onSubmit={handleSubmit}>
            <FormControl mb={2} isInvalid={!!newPasswordError}>
              <FormLabel fontWeight="bold">
                {t("resetPasswordNewPasswordLabel")}
              </FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FaLock color="gray.400" />
                </InputLeftElement>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  variant="outline"
                  placeholder={t("resetPasswordPlaceholder")}
                />
                <InputRightElement>
                  <Button variant="ghost" size="sm" onClick={togglePasswordVisibility}>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </Button>
                </InputRightElement>
              </InputGroup>
              {newPasswordError && (
                <FormErrorMessage>{newPasswordError}</FormErrorMessage>
              )}
            </FormControl>

            {/* パスワード強度バー */}
            {newPassword.length > 0 && (
              <Box mb={4}>
                <Text fontSize="sm" color="gray.600">
                  {t("resetPasswordStrengthLabel")}
                </Text>
                <Progress
                  value={passwordStrengthPercent}
                  size="xs"
                  colorScheme={
                    passwordScore < 2
                      ? "red"
                      : passwordScore === 2
                      ? "yellow"
                      : "green"
                  }
                  borderRadius="md"
                />
              </Box>
            )}

            <Button
              type="submit"
              colorScheme="blue"
              w="full"
              isLoading={isLoading}
              boxShadow="md"
            >
              {t("resetPasswordButton")}
            </Button>
          </form>

          <Text fontSize="sm" textAlign="center" mt={6} color="gray.700">
            {t("resetPasswordBackToLogin")}{" "}
            <ChakraLink
              as={NextLink}
              href={`/${locale}/auth/login`}
              color="blue.500"
              textDecoration="underline"
            >
              {t("loginTitle")}
            </ChakraLink>
          </Text>
        </MotionBox>
      </Flex>
    </Box>
  );
}

/**
 * ResetPasswordPage コンポーネント
 * ResetPasswordForm を Suspense バウンダリでラップして、useSearchParams() の使用によるエラーを回避します。
 */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
