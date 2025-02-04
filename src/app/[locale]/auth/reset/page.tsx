// src/app/[locale]/auth/reset/page.tsx

"use client";

import React, { useEffect, useState } from "react";
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
  FormErrorMessage
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import NextLink from "next/link";
import { FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import zxcvbn from "zxcvbn"; // フロントエンドでもパスワード強度を表示

// framer-motion ラッパ
const MotionBox = motion(Box);

export default function ResetPasswordPage() {
  const t = useTranslations("common");
  const locale = useLocale(); // ★ ロケールを取得
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const toast = useToast();

  const [newPassword, setNewPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [passwordScore, setPasswordScore] = useState(0); // 0~4
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ★ トークン未指定チェック
  useEffect(() => {
    if (!token) {
      toast({
        title: t("resetPasswordNoTokenTitle"),    // 例: "エラー"
        description: t("resetPasswordNoTokenDesc"), // 例: "トークンが見つかりません"
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      // ロケール付きでログインページへ
      router.push(`/${locale}/auth/login`);
    }
  }, [token, toast, router, t, locale]);

  // ★ パスワード強度チェック (zxcvbn) + エラーメッセージ
  useEffect(() => {
    const { score } = zxcvbn(newPassword);
    setPasswordScore(score);

    // 登録時と同様、score < 3 を弱いとみなす
    if (score < 3 && newPassword.length > 0) {
      setNewPasswordError(t("resetPasswordWeakPasswordError"));
      // 例: "パスワードが脆弱です。より複雑なパスワードを使用してください"
    } else {
      setNewPasswordError("");
    }
  }, [newPassword, t]);

  // パスワードの目アイコン(表示/非表示)
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  // ★ フォーム送信ハンドラ
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return; // トークンがない場合は処理しない

    // バリデーションエラーがあれば送信不可
    if (newPasswordError) {
      toast({
        title: t("resetPasswordErrorTitle"),   // 例: "入力エラー"
        description: t("resetPasswordErrorDesc"), // 例: "パスワードを再度確認してください"
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
        // 例: "パスワードリセットに失敗しました"
      }

      // ★ 成功時のトースト
      toast({
        title: t("resetPasswordToastSuccessTitle"), 
        // 例: "完了"
        description: t("resetPasswordToastSuccessDesc"), 
        // 例: "パスワードをリセットしました。ログインしてください。"
        status: "success",
        duration: 4000,
        isClosable: true,
      });

      // ★ ログインページへ (ロケール付き)
      router.push(`/${locale}/auth/login`);
    } catch (err: any) {
      setIsLoading(false);
      toast({
        title: t("resetPasswordToastFailTitle"),   // 例: "エラー"
        description: err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  }

  // パスワード強度バーの% (0~4 → 0~100)
  const passwordStrengthPercent = (passwordScore / 4) * 100;

  // framer-motionのアニメ
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
        {/* 例: "パスワード再設定" */}
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
          <Heading as="h2" fontSize="xl" mb={4} textAlign="center" color="gray.700">
            {t("resetPasswordTitle")}
          </Heading>

          <form onSubmit={handleSubmit}>
            <FormControl mb={2} isInvalid={!!newPasswordError}>
              <FormLabel fontWeight="bold">
                {t("resetPasswordNewPasswordLabel")}
                {/* 例: "新しいパスワード" */}
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
                  // 例: "8文字以上を推奨"
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
                  {/* 例: "パスワード強度:" */}
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
              {/* 例: "パスワードを更新" */}
            </Button>
          </form>

          {/* ログイン画面へ戻る */}
          <Text fontSize="sm" textAlign="center" mt={6} color="gray.700">
            {t("resetPasswordBackToLogin")}{" "}
            {/* 例: "ログイン画面に戻る:" */}
            <ChakraLink
              as={NextLink}
              href={`/${locale}/auth/login`}
              color="blue.500"
              textDecoration="underline"
            >
              {t("loginTitle")}
              {/* 例: "ログイン" */}
            </ChakraLink>
          </Text>
        </MotionBox>
      </Flex>
    </Box>
  );
}