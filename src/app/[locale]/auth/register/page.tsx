"use client";

import React, { useState, useEffect } from "react";
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
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import zxcvbn from "zxcvbn";

// アイコン
import { FaGoogle, FaUser, FaLock, FaEye, FaEyeSlash, FaEnvelope } from "react-icons/fa";

// Chakra UI + framer-motion
const MotionBox = motion(Box);

export default function RegisterPage() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const toast = useToast();

  // ========== 入力フィールドのステート ==========
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");

  // ========== フォーム送信や入力状態管理 ==========
  const [isLoading, setIsLoading] = useState(false);

  // 「パスワードを表示するかどうか」のトグル
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // パスワード強度(0～4) - zxcvbnで計測
  const [passwordScore, setPasswordScore] = useState(0);

  // 「名前入力欄に一度でもフォーカスした/離れたか」を判定するフラグ
  // → これにより、ページ遷移直後にエラーメッセージが出ないように制御
  const [nameTouched, setNameTouched] = useState(false);

  // フォーム全体の送信ボタンを押したか(最終チェック用)
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // メールアドレスの簡易バリデーション
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // フォーム送信
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    // 「フォーム送信した」フラグをtrueにする
    setHasSubmitted(true);

    // 万が一、名前欄にまだ触れていない場合でもエラーを表示させる
    if (!nameTouched) {
      setNameTouched(true);
    }

    // クライアントサイドバリデーション
    // フロント側で検出できるエラーを防止
    if (emailError || passwordError || confirmPasswordError || nameError) {
      toast({
        title: "入力エラー",
        description: "フォームのエラーを修正してください。",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // 必須項目チェック(フロント側)
    if (!email || !password || !confirmPassword || !name) {
      toast({
        title: "入力エラー",
        description: "必須項目が未入力です。",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      // サーバーへ登録リクエスト
      const res = await fetch("/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, confirmPassword, name }),
      });
      const data = await res.json();
      setIsLoading(false);

      if (!res.ok) {
        throw new Error(data.error || t("registerFailedDefaultDesc"));
      }

      toast({
        title: t("registerSuccessTitle"),
        description: t("registerSuccessDesc"),
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // 登録成功後、ログイン画面へ遷移など
      router.push(`/${locale}/auth/login`);
    } catch (err: any) {
      setIsLoading(false);
      toast({
        title: t("registerFailedTitle"),
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }

  // Googleアカウントで登録
  async function handleGoogleSignup() {
    setIsLoading(true);
    await signIn("google", { callbackUrl: `/${locale}/` });
  }

  // パスワードの目アイコン(表示/非表示)トグル
  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword(!showConfirmPassword);

  /**
   * リアルタイムバリデーション
   * - emailの形式
   * - password強度(zxcvbn)
   * - confirmPassword
   * - name(必須)
   */
  useEffect(() => {
    // --- Email: 入力されていれば形式チェック ---
    if (email.length > 0 && !emailRegex.test(email)) {
      setEmailError("メールアドレス形式が正しくありません");
    } else {
      setEmailError("");
    }

    // --- Password: zxcvbnで強度計測 ---
    const result = zxcvbn(password);
    setPasswordScore(result.score);

    // 簡易エラー(パスワード長さや任意ルール)
    if (password && password.length < 8) {
      setPasswordError("パスワードは8文字以上を推奨します");
    } else {
      setPasswordError("");
    }

    // --- Confirm Password ---
    if (confirmPassword && password !== confirmPassword) {
      setConfirmPasswordError("パスワードが一致しません");
    } else {
      setConfirmPasswordError("");
    }

    // --- Name: ページロード直後は表示しない ---
    // フィールドに触れた(`nameTouched=true`) or フォーム送信された(`hasSubmitted=true`)状態で、未入力ならエラー
    if ((nameTouched || hasSubmitted) && name.length === 0) {
      setNameError("名前は必須です");
    } else {
      setNameError("");
    }
  }, [email, password, confirmPassword, name, nameTouched, hasSubmitted]);

  // パスワード強度バー (0~4) → 0~100% 変換
  const passwordStrengthPercent = (passwordScore / 4) * 100;

  // モーション設定
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
      bgGradient="linear(to-tr, teal.300, blue.200, white)"
      py={[8, 12]}
      px={4}
    >
      {/* 大きめのヘッダー */}
      <Heading
        textAlign="center"
        color="white"
        mb={[6, 10]}
        fontSize={["3xl", "4xl", "5xl"]}
        textShadow="1px 1px 2px rgba(0,0,0,0.3)"
      >
        {t("registerTitle")}
      </Heading>

      {/* 中央にカード状のフォーム */}
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
            {t("registerTitle")} {/* "ユーザー登録" */}
          </Heading>

          <form onSubmit={handleRegister}>
            {/* メール */}
            <FormControl mb={4} isInvalid={!!emailError}>
              <FormLabel fontWeight="bold">{t("emailLabel")}</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FaEnvelope color="gray.400" />
                </InputLeftElement>
                <Input
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  variant="outline"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </InputGroup>
              {emailError && <FormErrorMessage>{emailError}</FormErrorMessage>}
            </FormControl>

            {/* パスワード */}
            <FormControl mb={4} isInvalid={!!passwordError}>
              <FormLabel fontWeight="bold">{t("passwordLabel")}</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FaLock color="gray.400" />
                </InputLeftElement>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("passwordPlaceholder")}
                  variant="outline"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <InputRightElement>
                  <Button variant="ghost" size="sm" onClick={togglePasswordVisibility}>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </Button>
                </InputRightElement>
              </InputGroup>
              {/* エラーメッセージ */}
              {passwordError && <FormErrorMessage>{passwordError}</FormErrorMessage>}
            </FormControl>

            {/* パスワード強度バー */}
            {password.length > 0 && (
              <Box mb={4}>
                <Text fontSize="sm" color="gray.600">
                  パスワード強度:
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
                <Text fontSize="sm" color="gray.500" mt={1}>
                  {["とても弱い", "弱い", "普通", "強い", "とても強い"][passwordScore]}
                </Text>
              </Box>
            )}

            {/* パスワード(確認) */}
            <FormControl mb={4} isInvalid={!!confirmPasswordError}>
              <FormLabel fontWeight="bold">パスワード（確認）</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FaLock color="gray.400" />
                </InputLeftElement>
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="もう一度パスワードを入力"
                  variant="outline"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <InputRightElement>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleConfirmPasswordVisibility}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </Button>
                </InputRightElement>
              </InputGroup>
              {/* エラーメッセージ */}
              {confirmPasswordError && (
                <FormErrorMessage>{confirmPasswordError}</FormErrorMessage>
              )}
            </FormControl>

            {/* 名前（必須） */}
            <FormControl
              mb={6}
              isInvalid={!!nameError}
            >
              <FormLabel fontWeight="bold">名前</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FaUser color="gray.400" />
                </InputLeftElement>
                <Input
                  type="text"
                  placeholder="お名前をご入力ください"
                  variant="outline"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  // フォーム送信時にエラーチェックをするだけでなく、
                  // onBlurで一度でも触れたときにエラー表示を開始する
                  onBlur={() => setNameTouched(true)}
                  required
                />
              </InputGroup>
              {nameError && <FormErrorMessage>{nameError}</FormErrorMessage>}
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              w="full"
              isLoading={isLoading}
              size="md"
              boxShadow="md"
            >
              {t("registerButton")} {/* "ユーザー登録" */}
            </Button>
          </form>

          <Divider my={6} />

          {/* Googleアカウントで登録 */}
          <Button
            variant="outline"
            w="full"
            size="md"
            leftIcon={<FaGoogle />}
            isLoading={isLoading}
            onClick={handleGoogleSignup}
            _hover={{ bg: "gray.100" }}
          >
            Googleアカウントで登録
          </Button>

          <Text fontSize="sm" textAlign="center" mt={4} color="gray.700">
            {t("alreadyHaveAccount")}{" "}
            <ChakraLink
              as={NextLink}
              href={`/${locale}/auth/login`}
              color="blue.500"
              textDecoration="underline"
            >
              {t("goToLogin")}
            </ChakraLink>
          </Text>
        </MotionBox>
      </Flex>
    </Box>
  );
}