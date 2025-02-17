"use client";
export const dynamic = "force-dynamic";

import React, { useState } from "react";
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  useToast,
  FormErrorMessage,
  Spinner,
} from "@chakra-ui/react";
// 使う分だけ import する
import { useTranslations } from "next-intl";

/**
 * メール認証の再送ページ:
 *  - /api/user/resendVerification へ POST を行い、メールを再送する
 */
export default function ResendVerificationPage() {
  // Next-Intl
  const t = useTranslations("common");

  // Chakra UI
  const toast = useToast();

  // ローカル状態
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  // メール簡易バリデーション
  function validateEmail(value: string) {
    if (!value) return t("emailRequired"); // "メールアドレスは必須です"
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return t("invalidEmailFormat");
    return "";
  }

  // 再送ボタン押下時
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback("");

    // バリデーション
    const err = validateEmail(email);
    setEmailError(err);
    if (err) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/user/resendVerification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t("resendEmailFailed"));
      }

      // 成功メッセージ
      toast({
        title: t("resendEmailSuccessTitle"),
        description: t("resendEmailSuccessDesc"),
        status: "success",
        duration: 4000,
        isClosable: true,
      });

      setFeedback("");
      setEmail("");
    } catch (error: unknown) {
      let msg = t("resendEmailFailed");
      if (error instanceof Error) {
        msg = error.message;
      }
      setFeedback(msg);
      toast({
        title: t("resendEmailFailedTitle"),
        description: msg,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Box maxW="md" mx="auto" mt={[6, 10]} p={4}>
      <Heading size="lg" mb={4} textAlign="center">
        {t("resendVerificationTitle")}
      </Heading>

      <form onSubmit={handleSubmit}>
        <FormControl mb={4} isInvalid={!!emailError}>
          <FormLabel>{t("emailLabel")}</FormLabel>
          <Input
            type="email"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {emailError && <FormErrorMessage>{emailError}</FormErrorMessage>}
        </FormControl>

        <Button
          type="submit"
          colorScheme="blue"
          disabled={isLoading}
          isLoading={isLoading}
        >
          {isLoading ? <Spinner size="sm" /> : t("resendVerificationButton")}
        </Button>
      </form>

      {feedback && (
        <Text mt={4} color="red.500">
          {feedback}
        </Text>
      )}
    </Box>
  );
}
