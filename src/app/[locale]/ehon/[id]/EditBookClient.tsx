"use client";

import React, { useState } from "react";
import {
  Box,
  Heading,
  Text,
  Input,
  Textarea,
  Button,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Image,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tooltip,
  UnorderedList,
  ListItem
} from "@chakra-ui/react";
import { InfoIcon } from "@chakra-ui/icons";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type PageData = {
  id: number;
  pageNumber: number;
  text: string;
  imageUrl: string;         // 元画像
  prompt: string;
  tempNewImageUrls?: string[]; // 再生成された画像の配列
};

type BookData = {
  id: number;
  title: string;
  userName: string;
  isPublished: boolean;
  isCommunity: boolean;
};

type RegenerateMode = "samePrompt" | "withFeedback";

import { useUserSWR } from "@/hook/useUserSWR";

export default function EditBookClient({
  book,
  pages,
}: {
  book: BookData;
  pages: PageData[];
}) {
  const t = useTranslations("common");
  const router = useRouter();
  const toast = useToast();

  // -----------------------------
  // State管理
  // -----------------------------
  const [title, setTitle] = useState(book.title);

  // ページリスト＋新規生成候補
  const [pageList, setPageList] = useState(
    pages.map((p) => ({
      ...p,
      tempNewImageUrls: p.tempNewImageUrls || [],
    }))
  );

  // ページ本文の管理
  const [pageTextMap, setPageTextMap] = useState<Record<number, string>>(
    pages.reduce((acc, p) => {
      acc[p.id] = p.text;
      return acc;
    }, {} as Record<number, string>)
  );

  // モーダル表示制御
  const { isOpen, onOpen, onClose } = useDisclosure();

  // 現在どのページを再生成するか
  const [currentPageId, setCurrentPageId] = useState<number | null>(null);

  // どの画像をベースに再生成するか (元画像 or tempNewImageUrls の1つ)
  const [currentBaseImageUrl, setCurrentBaseImageUrl] = useState<string>("");

  // 再生成モード ("samePrompt" or "withFeedback")
  const [regenMode, setRegenMode] = useState<RegenerateMode | null>(null);

  // 修正要望
  const [feedback, setFeedback] = useState<string>("");

  // ローディングフラグ
  const [isSaving, setIsSaving] = useState(false);

  // SWR: ユーザー情報再取得
  const { mutate } = useUserSWR();

  // -----------------------------
  // タイトル更新
  // -----------------------------
  const handleUpdateTitle = async () => {
    try {
      setIsSaving(true);
      const res = await fetch(`/api/ehon/${book.id}/update-title`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) {
        throw new Error(t("editBookTitleUpdateFail"));
      }
      toast({ title: t("editBookTitleUpdateSuccess"), status: "success" });
      router.refresh();
    } catch (err) {
      console.error(err);
      toast({ title: t("errorTitle"), description: String(err), status: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  // -----------------------------
  // ページ本文保存
  // -----------------------------
  const handleSavePageText = async (pageId: number, newText: string) => {
    try {
      setIsSaving(true);
      const res = await fetch(`/api/ehon/${book.id}/update-page-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, text: newText }),
      });
      if (!res.ok) {
        throw new Error(t("editBookPageTextFail"));
      }
      toast({ title: t("editBookPageTextSuccess", { pageId }), status: "success" });
      router.refresh();
    } catch (err) {
      console.error(err);
      toast({ title: t("errorTitle"), description: String(err), status: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  // -----------------------------
  // (1) 「この画像をベースに再生成」ボタン -> モーダルオープン
  // -----------------------------
  const openRegenerateModal = (pageId: number, baseImageUrl: string) => {
    setCurrentPageId(pageId);
    setCurrentBaseImageUrl(baseImageUrl); // ベースとなる画像URLを保存
    setRegenMode(null);
    setFeedback("");
    onOpen();
  };

  // -----------------------------
  // (2) モーダルで「再生成」実行
  // -----------------------------
  const handleRegenerate = async () => {
    if (currentPageId == null || !currentBaseImageUrl) return;

    if (!regenMode) {
      toast({ title: "再生成方法を選択してください", status: "warning" });
      return;
    }

    try {
      setIsSaving(true);

      // 同じプロンプト or 修正要望を反映
      if (regenMode === "samePrompt") {
        // POST /regenerate-page-image
        const res = await fetch(`/api/ehon/${book.id}/regenerate-page-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pageId: currentPageId,
            baseImageUrl: currentBaseImageUrl,
          }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || t("editBookImageRegenFail"));
        }
        const data = await res.json();
        const newImageUrl = data.newImageUrl || "";

        // 新しい画像を tempNewImageUrls に追加
        setPageList((prev) =>
          prev.map((pg) =>
            pg.id === currentPageId
              ? {
                  ...pg,
                  tempNewImageUrls: [...pg.tempNewImageUrls, newImageUrl],
                }
              : pg
          )
        );
      } else {
        // 修正要望を反映
        if (!feedback.trim()) {
          throw new Error(t("editBookFeedbackRequired"));
        }
        const res = await fetch(`/api/ehon/${book.id}/refine-and-regenerate-page-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pageId: currentPageId,
            baseImageUrl: currentBaseImageUrl,
            feedback,
          }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || t("editBookImageRegenFail"));
        }
        const data = await res.json();
        const { newImageUrl, newScenePrompt } = data;

        // 新シーンプロンプトを更新 & 新画像を追加
        setPageList((prev) =>
          prev.map((pg) =>
            pg.id === currentPageId
              ? {
                  ...pg,
                  prompt: newScenePrompt,
                  tempNewImageUrls: [...pg.tempNewImageUrls, newImageUrl],
                }
              : pg
          )
        );
      }

      // ポイント消費 → ユーザー情報再取得
      await mutate();

      toast({
        title: t("editBookImageRegenSuccess", { pageId: currentPageId }),
        status: "success",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: t("errorTitle"),
        description: String(err),
        status: "error",
      });
    } finally {
      setIsSaving(false);
      onClose();
    }
  };

  // -----------------------------
  // 新しい画像を「採用」
  // -----------------------------
  const handleAcceptNewImage = async (pageId: number, newImageUrl: string) => {
    try {
      setIsSaving(true);
      const res = await fetch(`/api/ehon/${book.id}/apply-new-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, newImageUrl }),
      });
      if (!res.ok) {
        throw new Error(t("editBookImageApplyFail"));
      }
      toast({ title: t("editBookImageApplySuccess", { pageId }), status: "success" });

      setPageList((prev) =>
        prev.map((pg) =>
          pg.id === pageId
            ? {
                ...pg,
                imageUrl: newImageUrl, // 採用したので元画像を更新
                tempNewImageUrls: [],
              }
            : pg
        )
      );

      router.refresh();
    } catch (err) {
      console.error(err);
      toast({
        title: t("errorTitle"),
        description: String(err),
        status: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // -----------------------------
  // 新しい画像を破棄
  // -----------------------------
  const handleDiscardNewImage = (pageId: number, discardIndex: number) => {
    setPageList((prev) =>
      prev.map((pg) => {
        if (pg.id !== pageId) return pg;
        const arr = [...pg.tempNewImageUrls];
        arr.splice(discardIndex, 1);
        return { ...pg, tempNewImageUrls: arr };
      })
    );
  };

  // -----------------------------
  // 絵本を完成 => isPublished=true
  // -----------------------------
  const handleFinalizeBook = async () => {
    try {
      setIsSaving(true);
      const res = await fetch(`/api/ehon/${book.id}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        throw new Error(t("editBookFinalizeFail"));
      }
      toast({ title: t("editBookFinalizeSuccess"), status: "success" });
      router.refresh();
    } catch (err) {
      console.error(err);
      toast({
        title: t("errorTitle"),
        description: String(err),
        status: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // -----------------------------
  // レンダリング
  // -----------------------------
  return (
    <Box maxW="800px" mx="auto" p={4}>
      {/* 情報メッセージ */}
      <Alert status="info" mb={6} borderRadius="md">
        <AlertIcon />
        <Box flex="1">
          <AlertTitle>{t("regenHintTitle")}</AlertTitle>
          <AlertDescription>{t("regenHintDescription")}</AlertDescription>
        </Box>
      </Alert>

      <Heading size="lg" mb={4}>
        {t("editBookPageTitle")}
      </Heading>
      <Text fontSize="sm" color="gray.600" mb={8}>
        {t("editBookAuthor", { name: book.userName || "???" })}
      </Text>

      {/* タイトル編集 */}
      <Box mb={8}>
        <Text fontWeight="bold" mb={2}>
          {t("editBookTitleLabel")}
        </Text>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("editBookTitlePlaceholder")}
          mb={2}
        />
        <Button
          size="sm"
          colorScheme="blue"
          isLoading={isSaving}
          onClick={handleUpdateTitle}
        >
          {t("editBookTitleSave")}
        </Button>
      </Box>

      {/* ページ一覧 */}
      <VStack spacing={6} align="stretch">
        {pageList.map((page) => (
          <Card key={page.id} bg="white" variant="outline">
            <CardHeader>
              <Heading size="md">
                {t("editBookPageLabel", { pageNum: page.pageNumber })}
              </Heading>
            </CardHeader>

            <CardBody>
              <Box mb={4}>
                <Text fontWeight="bold" mb={1}>
                  {t("editBookPageImage")}
                </Text>
                <Text fontSize="sm" mb={1} color="gray.500">
                  {t("editBookExistingImage")}
                </Text>

                {/* --- 1) 元画像の表示 + 再生成ボタン --- */}
                <Image
                  src={page.imageUrl || "/images/sample-cover.png"}
                  alt={`page ${page.pageNumber}`}
                  maxW="100%"
                  mb={2}
                />
                <HStack mb={5}>
                  {/* この画像から再生成ボタン */}
                  <Button
                    size="xs"
                    variant="outline"
                    colorScheme="purple"
                    isLoading={isSaving}
                    onClick={() => openRegenerateModal(page.id, page.imageUrl)}
                  >
                    この画像から再生成
                  </Button>
                </HStack>

                {/* --- 2) 再生成された画像の一覧 --- */}
                {page.tempNewImageUrls.length > 0 && (
                  <>
                    <Text fontSize="sm" mb={1} color="gray.500">
                      {t("editBookRegeneratedImage")}
                    </Text>
                    <VStack align="start" spacing={3}>
                      {page.tempNewImageUrls.map((url, idx) => (
                        <Box key={idx} borderWidth="1px" p={2} w="100%">
                          <Image
                            src={url}
                            alt={`page${page.pageNumber}_regen#${idx}`}
                            maxW="100%"
                            mb={2}
                          />
                          <HStack>
                            {/* この画像から再生成 */}
                            <Button
                              size="xs"
                              variant="outline"
                              colorScheme="purple"
                              isLoading={isSaving}
                              onClick={() => openRegenerateModal(page.id, url)}
                            >
                              この画像から再生成
                            </Button>
                            {/* 採用 */}
                            <Button
                              size="xs"
                              colorScheme="green"
                              isLoading={isSaving}
                              onClick={() => handleAcceptNewImage(page.id, url)}
                            >
                              {t("editBookAcceptNewImage")}
                            </Button>
                            {/* 破棄 */}
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => handleDiscardNewImage(page.id, idx)}
                            >
                              {t("editBookDiscardNewImage")}
                            </Button>
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  </>
                )}
              </Box>

              {/* ページ本文 */}
              <Box>
                <Text fontWeight="bold" mb={1}>
                  {t("editBookPageText")}
                </Text>
                <Textarea
                  value={pageTextMap[page.id]}
                  onChange={(e) =>
                    setPageTextMap((prev) => ({
                      ...prev,
                      [page.id]: e.target.value,
                    }))
                  }
                />
              </Box>
            </CardBody>
            <CardFooter>
              <HStack spacing={3}>
                <Button
                  size="sm"
                  colorScheme="blue"
                  isLoading={isSaving}
                  onClick={() => handleSavePageText(page.id, pageTextMap[page.id])}
                >
                  {t("editBookPageTextSave")}
                </Button>
              </HStack>
            </CardFooter>
          </Card>
        ))}
      </VStack>

      {/* 絵本を完成 */}
      <Box mt={8}>
        <Button colorScheme="orange" isLoading={isSaving} onClick={handleFinalizeBook}>
          {t("editBookGoFinalize")}
        </Button>
      </Box>

      {/* ---------------------- */}
      {/* 再生成モーダル         */}
      {/* ---------------------- */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t("editBookRegenModalTitle")}</ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            {/* 画像生成AIの特性に関する注意文 */}
            <Box mb={4} p={2} borderWidth="1px" borderRadius="md" bg="yellow.50">
              <Text fontWeight="bold" mb={1}>
                {t("editBookAiDisclaimerTitle")}
              </Text>
              <Text fontSize="sm" color="gray.800">
                {t("editBookAiDisclaimerText")}
              </Text>
            </Box>

            {/* 「同じプロンプト」ボタン */}
            <Box
              as="button"
              onClick={() => setRegenMode("samePrompt")}
              borderWidth="2px"
              borderColor={regenMode === "samePrompt" ? "purple.500" : "gray.200"}
              bg={regenMode === "samePrompt" ? "purple.50" : "white"}
              p={4}
              borderRadius="md"
              textAlign="left"
              w="100%"
              mb={4}
              transition="all 0.2s ease-in-out"
            >
              <Text fontWeight="bold" fontSize="md" color="purple.800">
                {t("editBookRegenSamePromptTitle")}
              </Text>
              <Text fontSize="sm" color="gray.600" mt={1}>
                {t("editBookRegenSamePromptDesc")}
              </Text>
            </Box>

            {/* 「修正要望を反映」ボタン */}
            <Box
              as="button"
              onClick={() => setRegenMode("withFeedback")}
              borderWidth="2px"
              borderColor={regenMode === "withFeedback" ? "purple.500" : "gray.200"}
              bg={regenMode === "withFeedback" ? "purple.50" : "white"}
              p={4}
              borderRadius="md"
              textAlign="left"
              w="100%"
              transition="all 0.2s ease-in-out"
            >
              <Text fontWeight="bold" fontSize="md" color="purple.800">
                {t("editBookRegenFeedbackTitle")}
              </Text>
              <Text fontSize="sm" color="gray.600" mt={1}>
                {t("editBookRegenFeedbackDesc")}
              </Text>
            </Box>

            {regenMode === "withFeedback" && (
              <Box mt={4}>
                <Text fontSize="sm" mb={1}>
                  {t("editBookRefineFeedbackLabel")}
                </Text>

                <Textarea
                  placeholder={t("editBookRefineFeedbackPlaceholder")}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </Box>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              {t("cancelButton")}
            </Button>
            <Button colorScheme="purple" isLoading={isSaving} onClick={handleRegenerate}>
              {t("editBookRegenConfirmBtn")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}