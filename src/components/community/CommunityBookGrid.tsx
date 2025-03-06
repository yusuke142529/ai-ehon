"use client";

import React, { useEffect } from "react";
import {
  SimpleGrid,
  Box,
  Text,
  Flex,
  Avatar,
  IconButton,
  useColorModeValue,
  HStack,
  Badge,
} from "@chakra-ui/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FaHeart, FaRegHeart, FaComment } from "react-icons/fa";

import BookCard from "@/components/BookCard";

/** Book 型定義 */
interface Book {
  id: number;
  title: string;
  coverImageUrl?: string | null;
  communityAt?: Date | null;
  pages?: {
    pageNumber: number;
    imageUrl?: string | null;
  }[];
  theme?: string | null;
  genre?: string | null;
  targetAge?: string | null;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count: {
    likes: number;
    comments: number;
  };
  comments: {
    id: number;
    text: string;
    createdAt: Date;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  }[];
}

/** Props 型定義 */
interface CommunityBookGridProps {
  books: Book[];
  likedBooks: Record<number, boolean>;
  onToggleLike: (bookId: number) => Promise<void>;
  locale: string;
  /** isLoading は使わないなら削除 (必要なら残す) */
  isLoading: boolean; 
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * CommunityBookGrid
 * - コミュニティに公開された絵本一覧をカード表示
 */
export default function CommunityBookGrid({
  books,
  likedBooks,
  onToggleLike,
  locale,
  // isLoading, // 使わないなら削除
  setIsLoading,
}: CommunityBookGridProps) {
  const t = useTranslations("Community");

  // ① useColorModeValue は最初に呼び出しておく
  const commentBg = useColorModeValue("gray.50", "gray.800");
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  // デバッグ用ログなどに利用
  useEffect(() => {
    console.log("CommunityBookGrid books:", books);
    // 必要に応じてローディングを解除
    setIsLoading(false);
  }, [books, setIsLoading]);

  // 絵本がない場合の表示
  if (books.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text fontSize="lg">{t("noBooks")}</Text>
      </Box>
    );
  }

  // 日付フォーマット用の関数
  const formatDate = (date?: Date | null) => {
    if (!date) return "";
    const d = new Date(date);

    if (locale === "ja") {
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    } else {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }
  };

  return (
    <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={10} mb={8}>
      {books.map((book) => {
        // ページを pageNumber 昇順でソート
        const sortedPages = book.pages
          ? [...book.pages].sort((a, b) => a.pageNumber - b.pageNumber)
          : [];

        // 表紙画像ロジック
        let coverImage = "/images/sample-cover.png";

        // 1) 最初のページに imageUrl があればそれを使用
        if (sortedPages.length > 0 && sortedPages[0].imageUrl) {
          coverImage = sortedPages[0].imageUrl;
        }
        // 2) coverImageUrl があれば使用 (空文字は除外)
        else if (book.coverImageUrl && book.coverImageUrl.trim() !== "") {
          coverImage = book.coverImageUrl;
        }

        return (
          <Box key={book.id} mb={20}>
            {/* カバー画像 + タイトルカード */}
            <Link href={`/${locale}/ehon/${book.id}/viewer`} passHref>
              <BookCard title={book.title} coverImage={coverImage} />
            </Link>

            {/* 追加情報カード */}
            <Box
              mt={8}
              mb={4}
              mx="auto"
              width="90%"
              maxW="240px"
              bg={cardBg}
              borderRadius="md"
              boxShadow="md"
              borderWidth="1px"
              borderColor={borderColor}
              overflow="hidden"
            >
              {/* ユーザー情報 */}
              <Flex p={3} borderBottomWidth="1px" borderColor={borderColor} align="center">
                <Avatar
                  src={book.user.image || "/images/default-avatar.png"}
                  size="xs"
                  mr={2}
                />
                <Text fontSize="xs" fontWeight="medium" noOfLines={1} flex="1">
                  {book.user.name || t("anonymousUser")}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {formatDate(book.communityAt)}
                </Text>
              </Flex>

              {/* いいね・コメント数 */}
              <Flex p={3} justify="space-between" align="center">
                <HStack spacing={4}>
                  {/* いいねボタン */}
                  <Flex align="center">
                    <IconButton
                      aria-label={
                        likedBooks[book.id] ? t("unlikeBook") : t("likeBook")
                      }
                      icon={likedBooks[book.id] ? <FaHeart /> : <FaRegHeart />}
                      variant="ghost"
                      colorScheme="pink"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggleLike(book.id);
                      }}
                    />
                    <Text fontSize="sm">{book._count.likes}</Text>
                  </Flex>

                  {/* コメント数 */}
                  <Flex align="center">
                    <FaComment color="gray" size="14px" />
                    <Text fontSize="sm" ml={1}>
                      {book._count.comments}
                    </Text>
                  </Flex>
                </HStack>

                {/* 対象年齢があれば表示 */}
                {book.targetAge && (
                  <Badge fontSize="xs" colorScheme="green">
                    {book.targetAge}
                  </Badge>
                )}
              </Flex>

              {/* 最新コメント（あれば） */}
              {book.comments.length > 0 && (
                <Box bg={commentBg} p={2} fontSize="xs">
                  <Flex align="center" mb={1}>
                    <Avatar
                      src={book.comments[0].user.image || "/images/default-avatar.png"}
                      size="2xs"
                      mr={1}
                    />
                    <Text fontWeight="bold" fontSize="xx-small">
                      {book.comments[0].user.name || t("anonymousUser")}:
                    </Text>
                  </Flex>
                  <Text noOfLines={2} pl={5}>
                    {book.comments[0].text}
                  </Text>
                </Box>
              )}
            </Box>
          </Box>
        );
      })}
    </SimpleGrid>
  );
}
