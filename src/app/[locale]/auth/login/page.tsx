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
  Divider,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  FormErrorMessage,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
// ★ ここがポイント：@chakra-ui/next-jsからLinkをインポート
import { Link as ChakraNextLink } from "@chakra-ui/next-js";

import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { FaGoogle, FaLock, FaEye, FaEyeSlash, FaEnvelope } from "react-icons/fa";

const MotionBox = motion(Box);

function LoginForm() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 認証完了パラメータ (例: "?verified=1")
  const verifiedParam = searchParams?.get("verified") || null;

  // NextAuth が付与するエラークエリパラメータ (例: "?error=CredentialsSignin")
  const errorParam = searchParams?.get("error") || null;

  // ログイン後に飛ぶURL（デフォルトはトップページ）
  const callbackUrl = searchParams?.get("callbackUrl") || `/${locale}/`;

  // フォーム状態
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const toast = useToast();

  // メール簡易バリデーション
  useEffect(() => {
    if (email.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError(t("emailInvalid"));
      } else {
        setEmailError("");
      }
    } else {
      setEmailError("");
    }
  }, [email, t]);

  // パスワード表示切替
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  // フォーム送信
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (emailError) {
      toast({
        title: t("formErrorTitle"),
        description: t("formErrorDesc"),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (!email || !password) {
      toast({
        title: t("formErrorTitle"),
        description: t("missingRequiredFields"),
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

    if (result && !result.error) {
      // ログイン成功
      toast({
        title: t("loginSuccessTitle"),
        description: t("loginSuccessDesc"),
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push(callbackUrl);
    } else {
      // ログイン失敗
      let errMsg = t("loginFailedDesc");
      if (result?.error?.includes("EmailNotVerified")) {
        // 例: "EmailNotVerified" を throw している場合
        errMsg = t("emailNotVerifiedErrorDesc"); // 例: "メール認証がまだ完了していません"
      }
      toast({
        title: t("loginFailedTitle"),
        description: errMsg,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }

  // Googleログイン
  async function handleGoogleLogin() {
    setIsLoading(true);
    await signIn("google", { callbackUrl });
  }

  // Framer Motion アニメーション用のバリエーション
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
        {t("loginTitle")}
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

          {/* (1) メール認証完了メッセージ */}
          {verifiedParam === "1" && (
            <Alert status="success" mb={4}>
              <AlertIcon />
              <Box>
                <AlertTitle>{t("verificationSuccessTitle")}</AlertTitle>
                <AlertDescription fontSize="sm">
                  {t("verificationSuccessDesc")}
                </AlertDescription>
              </Box>
            </Alert>
          )}

          {/* (2) ログインエラー (例: CredentialsSignin) */}
          {errorParam === "CredentialsSignin" && (
            <Alert status="error" mb={4}>
              <AlertIcon />
              <Box>
                <AlertTitle>{t("loginFailedTitle")}</AlertTitle>
                <AlertDescription fontSize="sm">
                  {t("emailNotVerifiedErrorDesc")}
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

            <FormControl mb={4}>
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
            </FormControl>

            <Text fontSize="sm" textAlign="right" mb={4}>
              {/* Forgot Password Link */}
              <ChakraNextLink
                href={`/${locale}/auth/forgot`}
                color="blue.500"
                textDecoration="underline"
              >
                {t("forgotPasswordLink")}
              </ChakraNextLink>
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
            {t("noEmailVerification")}{" "}
            <ChakraNextLink
              href={`/${locale}/auth/resend`}
              color="blue.500"
              textDecoration="underline"
            >
              {t("resendVerificationLinkText")}
            </ChakraNextLink>
          </Text>

          <Text fontSize="sm" textAlign="center" mt={4} color="gray.700">
            {t("noAccount")}{" "}
            <ChakraNextLink
              href={`/${locale}/auth/register`}
              color="blue.500"
              textDecoration="underline"
            >
              {t("goToRegister")}
            </ChakraNextLink>
          </Text>
        </MotionBox>
      </Flex>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
