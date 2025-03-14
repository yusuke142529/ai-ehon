"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Box,
  Text,
  Textarea,
  VStack,
  HStack,
  Avatar,
  Divider,
  useToast,
  Spinner,
  Flex,
} from "@chakra-ui/react";
import { useTranslations } from "next-intl";

// コメントの型定義
type Comment = {
  id: number;
  text: string;
  createdAt: string | Date;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
};

type BookCommentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  bookId: number;
  bookTitle: string;
  comments: Comment[];
  onAddComment: (bookId: number, text: string) => Promise<void>;
  refreshComments: () => Promise<void>;
  locale: string; // ロケール情報
};

export default function BookCommentModal({
  isOpen,
  onClose,
  bookId,
  bookTitle,
  comments,
  onAddComment,
  refreshComments,
  locale,
}: BookCommentModalProps) {
  const t = useTranslations("Community");
  const toast = useToast();
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // モーダルを開いたときに一度だけコメントを再取得
  useEffect(() => {
    // isOpen が true に変わった時のみ実行（初回表示または閉じた後の再表示時）
    if (isOpen) {
      let isMounted = true;
      
      const fetchComments = async () => {
        setIsLoading(true);
        try {
          // コンポーネントがまだマウントされている場合のみ処理を実行
          if (isMounted) {
            await refreshComments();
          }
        } catch (error) {
          console.error("Error refreshing comments:", error);
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      };
      
      fetchComments();
      
      // クリーンアップ関数：コンポーネントがアンマウントされた場合
      return () => {
        isMounted = false;
      };
    }
    // refreshComments は依存配列から除外
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, bookId]); // bookId のみを依存配列に含める

  // コメント送信処理
  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onAddComment(bookId, newComment);
      setNewComment("");
      toast({
        title: t("commentAddSuccess", { defaultValue: "コメントを投稿しました" }),
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: t("commentAddError", { defaultValue: "コメントの投稿に失敗しました" }),
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 日付フォーマット
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    
    if (locale === "ja") {
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    } else {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t("commentsFor", { title: bookTitle, defaultValue: `「${bookTitle}」へのコメント` })}</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {/* コメント入力欄 */}
          <Box mb={6}>
            <Text fontWeight="bold" mb={2}>
              {t("addNewComment", { defaultValue: "新しいコメントを追加" })}
            </Text>
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t("commentPlaceholder", { defaultValue: "コメントを入力してください..." })}
              mb={2}
            />
            <Button
              colorScheme="blue"
              isLoading={isSubmitting}
              onClick={handleSubmit}
              isDisabled={!newComment.trim()}
            >
              {t("submitComment", { defaultValue: "コメントを投稿" })}
            </Button>
          </Box>
          
          <Divider my={4} />
          
          {/* コメント一覧 */}
          <Text fontWeight="bold" mb={3}>
            {t("allComments", { count: comments.length, defaultValue: `コメント (${comments.length}件)` })}
          </Text>
          
          {isLoading ? (
            <Box textAlign="center" py={4}>
              <Spinner />
            </Box>
          ) : comments.length > 0 ? (
            <VStack spacing={4} align="stretch" maxH="400px" overflowY="auto">
              {comments.map((comment) => (
                <Box key={comment.id} p={3} borderWidth="1px" borderRadius="md">
                  <HStack spacing={3} mb={2}>
                    <Avatar
                      size="sm"
                      src={comment.user.image || "/images/default-avatar.png"}
                    />
                    <Box>
                      <Text fontWeight="bold" fontSize="sm">
                        {comment.user.name || t("anonymousUser", { defaultValue: "匿名ユーザー" })}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {formatDate(comment.createdAt)}
                      </Text>
                    </Box>
                  </HStack>
                  <Text fontSize="sm" whiteSpace="pre-wrap">{comment.text}</Text>
                </Box>
              ))}
            </VStack>
          ) : (
            <Flex
              direction="column"
              align="center"
              justify="center"
              p={6}
              borderWidth="1px"
              borderRadius="md"
              borderStyle="dashed"
              borderColor="gray.300"
            >
              <Text color="gray.500" textAlign="center">
                {t("noCommentsYet", { defaultValue: "まだコメントはありません" })}
              </Text>
              <Text fontSize="sm" color="gray.400" mt={1}>
                {t("beFirstToComment", { defaultValue: "最初のコメントを投稿してみましょう！" })}
              </Text>
            </Flex>
          )}
        </ModalBody>
        
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            {t("close", { defaultValue: "閉じる" })}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}