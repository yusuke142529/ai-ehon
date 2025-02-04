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
  InputGroup,
  InputLeftElement,
  FormErrorMessage
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import NextLink from "next/link";
import { useTranslations, useLocale } from "next-intl"; 
// ↑ ★ ここでuseLocale()をimport

import { FaEnvelope } from "react-icons/fa";

const MotionBox = motion(Box);

export default function ForgotPasswordPage() {
  const t = useTranslations("common");
  const locale = useLocale(); // ★ 追加：現在のロケールを取得
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  // 簡易リアルタイムバリデーション
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.length > 0 && !emailRegex.test(email)) {
      setEmailError(t("forgotPasswordEmailFormatError"));
    } else {
      setEmailError("");
    }
  }, [email, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (emailError) {
      toast({
        title: t("forgotPasswordInputErrorTitle"),
        description: t("forgotPasswordInputErrorDesc"),
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setIsLoading(false);

      if (!res.ok) {
        throw new Error(data.error || t("forgotPasswordToastFailDesc"));
      }

      toast({
        title: t("forgotPasswordToastSuccessTitle"),
        description: t("forgotPasswordToastSuccessDesc"),
        status: "success",
        duration: 4000,
        isClosable: true,
      });

      // ★ 修正: router.push("/auth/login") -> ロケール付URLへ
      router.push(`/${locale}/auth/login`);

    } catch (err: any) {
      setIsLoading(false);
      toast({
        title: t("forgotPasswordToastFailTitle"),
        description: err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  }

  // フォームのアニメーション
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
      {/* ヘッダー */}
      <Heading
        textAlign="center"
        color="white"
        mb={[6, 10]}
        fontSize={["3xl", "4xl", "5xl"]}
        textShadow="1px 1px 2px rgba(0,0,0,0.3)"
      >
        {t("forgotPasswordTitle")}
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
            {t("forgotPasswordTitle")}
          </Heading>

          <form onSubmit={handleSubmit}>
            <FormControl mb={6} isInvalid={!!emailError}>
              <FormLabel fontWeight="bold">
                {t("forgotPasswordEmailLabel")}
              </FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FaEnvelope color="gray.400" />
                </InputLeftElement>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={t("forgotPasswordPlaceholder")}
                  variant="outline"
                />
              </InputGroup>
              {emailError && <FormErrorMessage>{emailError}</FormErrorMessage>}
            </FormControl>
            <Button
              type="submit"
              colorScheme="blue"
              w="full"
              isLoading={isLoading}
              boxShadow="md"
            >
              {t("forgotPasswordSendButton")}
            </Button>
          </form>

          <Text fontSize="sm" textAlign="center" mt={6} color="gray.700">
            {t("forgotPasswordBackToLogin")}{" "}
            <ChakraLink
              as={NextLink}
              href={`/${locale}/auth/login`} // ★ ここもロケール付に変更
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