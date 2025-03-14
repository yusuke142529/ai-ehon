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
  InputGroup,
  InputLeftElement,
  InputRightElement,
  FormErrorMessage,
} from "@chakra-ui/react";
// ★ next-js 用のリンクコンポーネントを追加
import { Link as ChakraNextLink } from "@chakra-ui/next-js";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

// パスワードバリデーション
import { validatePassword } from "@/utils/passwordValidation";

// Framer Motion 用ラップコンポーネント
const MotionBox = motion(Box);

function ResetPasswordForm() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  // クエリ (?token=xxx) からトークン取得
  const token = searchParams?.get("token") || "";

  // パスワード入力関連
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [passwordScore, setPasswordScore] = useState(0);

  // パスワード可視化
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  // 通信中フラグ
  const [isLoading, setIsLoading] = useState(false);

  // トークンが無い場合はログインページへリダイレクト
  useEffect(() => {
    if (!token) {
      toast({
        title: t("resetPasswordNoTokenTitle"),
        description: t("resetPasswordNoTokenDesc"),
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      router.push(`/${locale}/auth/login`);
    }
  }, [token, toast, router, t, locale]);

  // 新パスワードの入力時バリデーション
  useEffect(() => {
    if (newPassword.length > 0) {
      const { error, score } = validatePassword(newPassword, t);
      setNewPasswordError(error);
      setPasswordScore(score);
    } else {
      setNewPasswordError("");
      setPasswordScore(0);
    }
  }, [newPassword, t]);

  // フォーム送信ハンドラ
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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

    // パスワード未入力ならエラー
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

      router.push(`/${locale}/auth/login`);
    } catch (error: unknown) {
      setIsLoading(false);
      let message = t("resetPasswordToastFailDesc");
      if (error instanceof Error) {
        message = error.message;
      }
      toast({
        title: t("resetPasswordToastFailTitle"),
        description: message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  }

  // パスワード強度バー (0~4を0~100%に)
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
            {/* ★ ここを修正 */}
            <ChakraNextLink
              href={`/${locale}/auth/login`}
              color="blue.500"
              textDecoration="underline"
            >
              {t("loginTitle")}
            </ChakraNextLink>
          </Text>
        </MotionBox>
      </Flex>
    </Box>
  );
}

/**
 * ResetPasswordPage コンポーネント
 */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
