"use client";

import React, { FormEvent, useState } from "react";
// import { useRouter } from "next/navigation"; // 未使用なら削除
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Spinner,
} from "@chakra-ui/react";
import { useTranslations } from "next-intl";

export default function ChangePasswordPage() {
  const t = useTranslations("common");
  // const router = useRouter(); // 使っていなければ削除

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/user/changePassword", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || t("changePasswordFailed"));
      }
      setFeedback(t("changePasswordSuccess"));
      // 例: "パスワードを変更しました"
      setCurrentPassword("");
      setNewPassword("");
    } catch (error: unknown) {
      let message = t("changePasswordFailed");
      if (error instanceof Error) {
        message = error.message;
      }
      setFeedback(message);
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
        <FormControl mb={4}>
          <FormLabel>{t("changePasswordCurrent")}</FormLabel>
          {/* 例: "現在のパスワード" */}
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </FormControl>

        <FormControl mb={4}>
          <FormLabel>{t("changePasswordNew")}</FormLabel>
          {/* 例: "新しいパスワード" */}
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </FormControl>

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