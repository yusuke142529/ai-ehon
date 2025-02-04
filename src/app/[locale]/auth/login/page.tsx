"use client";

import React, { useState, useEffect } from "react";
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
  Progress
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";

// アイコン
import { FaGoogle, FaLock, FaEye, FaEyeSlash, FaEnvelope } from "react-icons/fa";

// Chakra UI + framer-motion
const MotionBox = motion(Box);

/**
 * - パスワード強度バー追加
 * - パスワードをお忘れですか？リンク
 */
export default function LoginPage() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  // ログイン後のリダイレクト先
  const callbackUrl = searchParams.get("callbackUrl") || `/${locale}/`;

  // フォーム状態
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);

  // パスワード強度 (0~100)
  const [passwordStrength, setPasswordStrength] = useState(0);

  // パスワード可視化
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  // 簡易的なリアルタイムバリデーション
  useEffect(() => {
    // メールアドレス書式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.length > 0 && !emailRegex.test(email)) {
      setEmailError("メールアドレスの形式が正しくありません");
    } else {
      setEmailError("");
    }

    // パスワード長さチェック
    if (password.length > 0 && password.length < 6) {
      setPasswordError("6文字以上を推奨します");
    } else {
      setPasswordError("");
    }

    // パスワード強度
    let strength = 0;
    if (password.length > 5) strength += 30;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/\d/.test(password)) strength += 20;
    if (/[^A-Za-z0-9]/.test(password)) strength += 20;
    if (password.length > 10) strength += 10;
    setPasswordStrength(strength);
  }, [email, password]);

  // フォーム送信 (メール&パスワードログイン)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // バリデーションエラーがあるなら中断
    if (emailError || passwordError) {
      toast({
        title: "入力エラー",
        description: "フォームのエラーを修正してください。",
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
      toast({
        title: t("loginSuccessTitle"),
        description: t("loginSuccessDesc"),
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push(callbackUrl);
    } else {
      toast({
        title: t("loginFailedTitle"),
        description: t("loginFailedDesc"),
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

  // フォームアニメーション
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
      {/* ヘッダー */}
      <Heading
        textAlign="center"
        color="white"
        mb={[6, 10]}
        fontSize={["3xl", "4xl", "5xl"]}
        textShadow="1px 1px 2px rgba(0,0,0,0.3)"
      >
        {t("loginTitle")} {/* "ログイン" */}
      </Heading>

      {/* カード風フォーム */}
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
            {t("loginTitle")} {/* "ログイン" */}
          </Heading>

          <form onSubmit={handleSubmit}>
            {/* メール */}
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

            {/* パスワード */}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </Button>
                </InputRightElement>
              </InputGroup>
              {passwordError && <FormErrorMessage>{passwordError}</FormErrorMessage>}
            </FormControl>

            {/* パスワード強度バー (オプション) */}
            {password.length > 0 && (
              <Box mb={4}>
                <Text fontSize="sm" color="gray.600">
                  パスワード強度:
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

            {/* パスワードをお忘れですか？ */}
            <Text fontSize="sm" textAlign="right" mb={4}>
              <ChakraLink
                as={NextLink}
                href={`/${locale}/auth/forgot`}
                color="blue.500"
                textDecoration="underline"
              >
                パスワードをお忘れですか？
              </ChakraLink>
            </Text>

            <Button
              type="submit"
              colorScheme="blue"
              width="100%"
              isLoading={isLoading}
              boxShadow="md"
            >
              {t("loginButton")} {/* "ログイン" */}
            </Button>
          </form>

          {/* 仕切り */}
          <Divider my={4} />

          {/* Google でログイン */}
          <Button
            colorScheme="red"
            variant="outline"
            width="100%"
            leftIcon={<FaGoogle />}
            isLoading={isLoading}
            onClick={handleGoogleLogin}
            _hover={{ bg: "gray.100" }}
          >
            Google でログイン
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