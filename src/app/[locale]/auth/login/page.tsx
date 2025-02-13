"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Link as ChakraLink,
  Divider,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  FormErrorMessage,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { FaGoogle, FaLock, FaEye, FaEyeSlash, FaEnvelope } from "react-icons/fa";

// Framer Motion 用のラップコンポーネント
const MotionBox = motion(Box);

/**
 * LoginForm コンポーネント (クライアント)
 */
function LoginForm() {
  // ❶ "common" ネームスペースなど、適切に置き換えてください
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  // (A) エラークエリパラメータ
  const errorParam = searchParams?.get("error") || null;
  // 例: "OAuthAccountNotLinked", "CredentialsSignin", etc.

  // (B) ログイン後のリダイレクト先
  const callbackUrl = searchParams?.get("callbackUrl") || `/${locale}/`;

  // フォーム状態
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const toast = useToast();

  // パスワード表示切替
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  // (C) リアルタイムバリデーション
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.length > 0 && !emailRegex.test(email)) {
      setEmailError(t("emailInvalid")); // "メールアドレスの形式が正しくありません"
    } else {
      setEmailError("");
    }

    if (password.length > 0 && password.length < 6) {
      setPasswordError(t("passwordShort")); // "6文字以上を推奨します"
    } else {
      setPasswordError("");
    }

    // パスワード強度計算 (例)
    let strength = 0;
    if (password.length > 5) strength += 30;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/\d/.test(password)) strength += 20;
    if (/[^A-Za-z0-9]/.test(password)) strength += 20;
    if (password.length > 10) strength += 10;
    setPasswordStrength(strength);
  }, [email, password, t]);

  // (D) フォーム送信
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // 入力エラー時
    if (emailError || passwordError) {
      toast({
        title: t("formErrorTitle"),    // "入力エラー"
        description: t("formErrorDesc"), // "フォームのエラーを修正してください。"
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl,
    });
    setIsLoading(false);

    // 成功／失敗
    if (result && !result.error) {
      // ログイン成功
      toast({
        title: t("loginSuccessTitle"), // "ログイン成功"
        description: t("loginSuccessDesc"),
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push(callbackUrl);
    } else {
      // ログイン失敗
      toast({
        title: t("loginFailedTitle"), // "ログイン失敗"
        description: t("loginFailedDesc"),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }

  // (E) Googleログイン
  async function handleGoogleLogin() {
    setIsLoading(true);
    await signIn("google", { callbackUrl });
  }

  // (F) Framer Motion アニメ
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
      bgGradient="linear(to-tr, cyan.300, blue.200, white)"
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
        {t("loginTitle")} {/* 例: "ログイン" */}
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
            {t("loginTitle")}
          </Heading>

          {/* (G) OAuthAccountNotLinked 等のエラー表示 */}
          {errorParam === "OAuthAccountNotLinked" && (
            <Alert status="error" mb={4}>
              <AlertIcon />
              <Box>
                <AlertTitle>{t("oauthNotLinkedTitle")}</AlertTitle>
                <AlertDescription fontSize="sm">
                  {t("oauthNotLinkedDesc")}
                  <Box mt={2}>
                    {/* 例: 既存ユーザーに紐づけしたい場合の説明文など */}
                    <ul style={{ marginLeft: "1.5em", listStyle: "disc" }}>
                      <li>{t("oauthNotLinkedHint1")}</li>
                      <li>{t("oauthNotLinkedHint2")}</li>
                    </ul>
                  </Box>
                </AlertDescription>
              </Box>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <FormControl mb={4} isInvalid={!!emailError}>
              <FormLabel fontWeight="bold">{t("emailLabel")}</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FaEnvelope color="gray.400" />
                </InputLeftElement>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  required
                  variant="outline"
                />
              </InputGroup>
              {emailError && <FormErrorMessage>{emailError}</FormErrorMessage>}
            </FormControl>

            <FormControl mb={2} isInvalid={!!passwordError}>
              <FormLabel fontWeight="bold">{t("passwordLabel")}</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FaLock color="gray.400" />
                </InputLeftElement>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("passwordPlaceholder")}
                  required
                  variant="outline"
                />
                <InputRightElement>
                  <Button variant="ghost" size="sm" onClick={togglePasswordVisibility}>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </Button>
                </InputRightElement>
              </InputGroup>
              {passwordError && <FormErrorMessage>{passwordError}</FormErrorMessage>}
            </FormControl>

            {/* (H) パスワード強度表示 */}
            {password.length > 0 && (
              <Box mb={4}>
                <Text fontSize="sm" color="gray.600">
                  {t("passwordStrengthLabel")}
                </Text>
                <Progress
                  value={passwordStrength}
                  size="xs"
                  colorScheme={
                    passwordStrength < 30
                      ? "red"
                      : passwordStrength < 60
                      ? "yellow"
                      : "green"
                  }
                  borderRadius="md"
                />
              </Box>
            )}

            <Text fontSize="sm" textAlign="right" mb={4}>
              <ChakraLink
                as={NextLink}
                href={`/${locale}/auth/forgot`}
                color="blue.500"
                textDecoration="underline"
              >
                {t("forgotPasswordLink")}
              </ChakraLink>
            </Text>

            <Button
              type="submit"
              colorScheme="blue"
              width="full"
              isLoading={isLoading}
              boxShadow="md"
            >
              {t("loginButton")}
            </Button>
          </form>

          <Divider my={4} />

          {/* (I) Googleログインボタン */}
          <Button
            colorScheme="red"
            variant="outline"
            width="full"
            leftIcon={<FaGoogle />}
            isLoading={isLoading}
            onClick={handleGoogleLogin}
            _hover={{ bg: "gray.100" }}
          >
            {t("googleLoginButton")}
          </Button>

          <Text fontSize="sm" textAlign="center" mt={4} color="gray.700">
            {t("noAccount")}{" "}
            <ChakraLink
              as={NextLink}
              href={`/${locale}/auth/register`}
              color="blue.500"
              textDecoration="underline"
            >
              {t("goToRegister")}
            </ChakraLink>
          </Text>
        </MotionBox>
      </Flex>
    </Box>
  );
}

/**
 * LoginPage (Suspense boundary)
 *  - useSearchParams() 等を包むための Suspense
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}