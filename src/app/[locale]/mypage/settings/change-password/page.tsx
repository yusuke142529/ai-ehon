"use client";

import React, { FormEvent, useState, useEffect } from "react";
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Spinner,
  FormErrorMessage,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Progress,
  useToast,
} from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

// フロント用ユーティリティ（i18n対応）
import { validatePassword } from "@/utils/passwordValidation";

export default function ChangePasswordPage() {
  const t = useTranslations("common");
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [currentPasswordError, setCurrentPasswordError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [newPasswordScore, setNewPasswordScore] = useState(0);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // リアルタイムバリデーション
  useEffect(() => {
    // 現在のパスワードチェック（必要に応じて簡易的なチェック）
    if (currentPassword.length === 0) {
      setCurrentPasswordError("");
    } else if (currentPassword.length < 4) {
      // 例: 「4文字未満は短すぎる」という簡易メッセージ
      setCurrentPasswordError(t("changePasswordCurrentTooShort"));
    } else {
      setCurrentPasswordError("");
    }

    // 新しいパスワードのバリデーション
    if (newPassword.length > 0) {
      const { error, score } = validatePassword(newPassword, t);
      setNewPasswordError(error);
      setNewPasswordScore(score);
    } else {
      setNewPasswordError("");
      setNewPasswordScore(0);
    }
  }, [currentPassword, newPassword, t]);

  // パスワード強度バー (0～4 → 0～100)
  const passwordStrengthPercent = (newPasswordScore / 4) * 100;

  // フォーム送信
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    // フロント側バリデーションエラーがあれば中断
    if (currentPasswordError || newPasswordError) {
      setIsLoading(false);
      setFeedback(t("fixFormErrors"));
      return;
    }

    // 必須項目が空の場合もエラー
    if (!currentPassword || !newPassword) {
      setIsLoading(false);
      setFeedback(t("missingRequiredFields"));
      return;
    }

    try {
      // PATCHリクエストでパスワードを更新
      const res = await fetch("/api/user/changePassword", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || t("changePasswordFailed"));
      }

      // 成功時
      setFeedback(t("changePasswordSuccess")); // 例: "パスワードを変更しました"
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordScore(0);

      toast({
        title: t("changePasswordSuccessToast"),
        // 例: "パスワード変更に成功しました"
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error: unknown) {
      let message = t("changePasswordFailed");
      if (error instanceof Error) {
        message = error.message;
      }
      setFeedback(message);

      toast({
        title: t("changePasswordFailedTitle"),
        description: message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Box maxW="500px" mx="auto" p={4}>
      <Heading size="lg" mb={6}>
        {t("changePasswordTitle")} 
        {/* 例: "パスワード変更" */}
      </Heading>

      <form onSubmit={handleSubmit}>
        {/* 現在のパスワード */}
        <FormControl mb={4} isInvalid={!!currentPasswordError}>
          <FormLabel>{t("changePasswordCurrent")}</FormLabel>
          {/* 例: "現在のパスワード" */}
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <FaLock color="gray.400" />
            </InputLeftElement>
            <Input
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <InputRightElement>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
              </Button>
            </InputRightElement>
          </InputGroup>
          {currentPasswordError && (
            <FormErrorMessage>{currentPasswordError}</FormErrorMessage>
          )}
        </FormControl>

        {/* 新しいパスワード */}
        <FormControl mb={4} isInvalid={!!newPasswordError}>
          <FormLabel>{t("changePasswordNew")}</FormLabel>
          {/* 例: "新しいパスワード" */}
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <FaLock color="gray.400" />
            </InputLeftElement>
            <Input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <InputRightElement>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
              </Button>
            </InputRightElement>
          </InputGroup>
        </FormControl>

        {/* パスワード強度バー表示 */}
        {newPassword.length > 0 && (
          <Box mb={4}>
            <Text fontSize="sm" color="gray.600">
              {t("passwordStrengthLabel")}
            </Text>
            <Progress
              value={passwordStrengthPercent}
              size="xs"
              colorScheme={
                newPasswordScore < 2
                  ? "red"
                  : newPasswordScore === 2
                  ? "yellow"
                  : "green"
              }
              borderRadius="md"
            />
          </Box>
        )}

        <Button type="submit" colorScheme="blue" disabled={isLoading}>
          {isLoading ? <Spinner size="sm" /> : t("changePasswordButton")}
          {/* 例: "変更" */}
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