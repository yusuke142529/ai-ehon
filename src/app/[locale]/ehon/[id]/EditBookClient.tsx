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
  useDisclosure,
} from "@chakra-ui/react";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useUserSWR } from "@/hook/useUserSWR";
import { BookStatus } from "@prisma/client";

// ★ 分割したモーダルコンポーネントをインポート
import RegenerateModal, { RegenerateMode } from "./RegenerateModal";

// 新しいコンポーネントをインポート
import VisibilitySelector from "@/components/VisibilitySelector";
import ShareOptions from "@/components/ShareOptions";

// ======================================
// 型定義
// ======================================
type PageData = {
  id: number;
  pageNumber: number;
  text: string;
  imageUrl: string;
  prompt: string;
  tempNewImageUrls?: string[];
};

type BookData = {
  id: number;
  title: string;
  userName: string;
  isPublished: boolean;
  isCommunity: boolean;
  status?: string; // 追加：公開ステータス
};

export default function EditBookClient({
  book,
  pages,
}: {
  book: BookData;
  pages: PageData[];
}) {
  // `useTranslations("common")` が返す関数をフルに受け取る
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

  // ローディングフラグ（保存中など）
  const [isSaving, setIsSaving] = useState(false);
  
  // 絵本のステータス状態
  const [bookStatus, setBookStatus] = useState(book.status || "PRIVATE");

  // SWR: ユーザー情報
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
      toast({
        title: t("editBookPageTextSuccess", { pageId }),
        status: "success",
      });
      router.refresh();
    } catch (err) {
      console.error(err);
      toast({ title: t("errorTitle"), description: String(err), status: "error" });
    } finally {
      setIsSaving(false);
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
      toast({
        title: t("editBookImageApplySuccess", { pageId }),
        status: "success",
      });

      setPageList((prev) =>
        prev.map((pg) =>
          pg.id === pageId
            ? {
                ...pg,
                imageUrl: newImageUrl,
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
  // ステータス変更ハンドラ
  // -----------------------------
  const handleStatusChange = (newStatus: string) => {
    setBookStatus(newStatus);
  };

  // -----------------------------
  // 画像再生成モーダル関連
  // -----------------------------
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentPageId, setCurrentPageId] = useState<number | null>(null);
  const [currentBaseImageUrl, setCurrentBaseImageUrl] = useState<string>("");
  const [regenMode, setRegenMode] = useState<RegenerateMode | null>(null);
  const [feedback, setFeedback] = useState<string>("");

  // モーダルを開く
  const openRegenerateModal = (pageId: number, baseImageUrl: string) => {
    setCurrentPageId(pageId);
    setCurrentBaseImageUrl(baseImageUrl);
    setRegenMode(null);
    setFeedback("");
    onOpen();
  };

  // モーダルから呼ばれる「再生成実行」ロジック
  const handleRegenerate = async () => {
    if (currentPageId == null || !currentBaseImageUrl) return;
    if (!regenMode) {
      toast({ title: "再生成方法を選択してください", status: "warning" });
      return;
    }

    try {
      setIsSaving(true);

      if (regenMode === "samePrompt") {
        // 同じプロンプトで再生成
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
        // フィードバックを加えて再生成
        if (!feedback.trim()) {
          throw new Error(t("editBookFeedbackRequired"));
        }
        const res = await fetch(
          `/api/ehon/${book.id}/refine-and-regenerate-page-image`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pageId: currentPageId,
              baseImageUrl: currentBaseImageUrl,
              feedback,
            }),
          }
        );
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || t("editBookImageRegenFail"));
        }
        const data = await res.json();
        const { newImageUrl, newScenePrompt } = data;

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

      // ポイント消費 => ユーザー情報再取得
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
      
      {/* 公開設定コンポーネント */}
      <VisibilitySelector 
        bookId={book.id} 
        currentStatus={bookStatus as BookStatus}
        onStatusChange={(status) => handleStatusChange(status)}
      />
      
      {/* 共有オプションコンポーネント */}
      <ShareOptions 
        bookId={book.id}
        title={title}
        status={bookStatus}
      />

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
              {/* 既存画像 */}
              <Box mb={4}>
                <Text fontWeight="bold" mb={1}>
                  {t("editBookPageImage")}
                </Text>
                <Text fontSize="sm" mb={1} color="gray.500">
                  {t("editBookExistingImage")}
                </Text>

                <Image
                  src={page.imageUrl || "/images/sample-cover.png"}
                  alt={`page ${page.pageNumber}`}
                  maxW="100%"
                  mb={2}
                />
                <HStack mb={5}>
                  <Button
                    size="xs"
                    variant="outline"
                    colorScheme="purple"
                    isLoading={isSaving}
                    onClick={() => openRegenerateModal(page.id, page.imageUrl)}
                  >
                    {t("editBookImageRegenFromThis")}
                  </Button>
                </HStack>

                {/* 再生成された画像一覧 */}
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
                            <Button
                              size="xs"
                              variant="outline"
                              colorScheme="purple"
                              isLoading={isSaving}
                              onClick={() => openRegenerateModal(page.id, url)}
                            >
                              {t("editBookImageRegenFromThis")}
                            </Button>
                            <Button
                              size="xs"
                              colorScheme="green"
                              isLoading={isSaving}
                              onClick={() => handleAcceptNewImage(page.id, url)}
                            >
                              {t("editBookAcceptNewImage")}
                            </Button>
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

      {/* 画像再生成モーダル */}
      <RegenerateModal
        isOpen={isOpen}
        onClose={onClose}
        isSaving={isSaving}
        regenMode={regenMode}
        setRegenMode={setRegenMode}
        feedback={feedback}
        setFeedback={setFeedback}
        onRegenerate={handleRegenerate}
      />
    </Box>
  );
}