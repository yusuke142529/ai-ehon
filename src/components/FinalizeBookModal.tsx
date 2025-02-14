//src/components/FinalizeBookModal.tsx

"use client";

import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";

// Book情報の型
type BookInfo = {
  id: number;
  title: string;
  isPublished: boolean;
};

// コンポーネントの props 定義
type FinalizeBookModalProps = {
  isOpen: boolean; // モーダル表示状態
  onClose: () => void; // モーダルを閉じるコールバック
  book: BookInfo; // 対象の絵本情報
};

/**
 * 絵本“完成”を最終確認するモーダルコンポーネント
 */
export default function FinalizeBookModal({
  isOpen,
  onClose,
  book,
}: FinalizeBookModalProps) {
  const t = useTranslations("common"); // "common" namespaceの文言を取得
  const locale = useLocale(); // 例: "ja" or "en"
  const router = useRouter();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(false);

  // “完成”処理
  async function handleFinalize() {
    setIsLoading(true);
    try {
      // 既に完成済みの場合
      if (book.isPublished) {
        toast({
          title: t("editBookAlreadyFinalized"), // 例: "すでに完成済みです"
          status: "info",
          duration: 3000,
          isClosable: true,
        });
        onClose();
        return;
      }

      // API呼び出し: POST /api/ehon/[id]/finalize
      const res = await fetch(`/api/ehon/${book.id}/finalize`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error(t("finalizeBookError"));
        // 例: "絵本の完成に失敗しました。"
      }

      // 成功時
      toast({
        title: t("finalizeBookSuccess"),
        // 例: "絵本を完成しました！"
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // モーダルを閉じる
      onClose();

      // 完成後はビューワーページへ
      router.push(`/${locale}/ehon/${book.id}/viewer`);
    } catch (err: unknown) {
      let errorMessage = "Unknown error occurred.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast({
        title: t("errorTitle"), // 例: "エラー"
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t("finalizeHeading")}</ModalHeader>
        {/* 例: "絵本を完成させる" */}

        <ModalBody>
          <Text>
            {book.title} {t("finalizeConfirmDesc")}
          </Text>
          {/* 例: "{title}を本当に完成しますか？完成すると編集できなくなります。" */}
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            {t("cancelBtn")}
            {/* 例: "キャンセル" */}
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleFinalize}
            isLoading={isLoading}
          >
            {t("finalizeButton")}
            {/* 例: "完成する" */}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
