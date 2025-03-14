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
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Button,
} from "@chakra-ui/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FaHeart, FaRegHeart, FaComment } from "react-icons/fa";
import { useRouter } from "next/navigation";

import BookCard from "@/components/BookCard";

/** Book type definition */
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

interface CommunityBookGridProps {
  /** SSRで取得したBook一覧 */
  books: Book[];
  /** フロントでどの本をいいね済みか記録するためのstate */
  likedBooks: Record<number, boolean>;
  /** いいねトグルを呼び出す関数（親コンポーネントで実装） */
  onToggleLike: (bookId: number) => Promise<void>;
  locale: string;
  /** ローディング中かどうか */
  isLoading: boolean;
  /** ローディング状態を変更する関数 */
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  /** コメントモーダルを開く関数 */
  onOpenCommentModal: (book: Book) => void;
}

/**
 * CommunityBookGrid
 * - コミュニティページ用の絵本一覧グリッド表示
 * - いいねボタン、コメント数、最新コメントなどを表示
 */
export default function CommunityBookGrid({
  books,
  likedBooks,
  onToggleLike,
  locale,
  isLoading,
  setIsLoading,
  onOpenCommentModal,
}: CommunityBookGridProps) {
  const t = useTranslations("Community");
  const router = useRouter();

  // UIカラーの取得
  const commentBg = useColorModeValue("gray.50", "gray.800");
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  // books が更新されたら isLoading を解除
  useEffect(() => {
    if (books && isLoading) {
      setIsLoading(false);
    }
  }, [books, isLoading, setIsLoading]);

  // ローディング中のUI
  if (isLoading) {
    return (
      <Center py={10}>
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="blue.500"
          size="xl"
        />
      </Center>
    );
  }

  // 本が0件の場合
  if (books.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Alert status="info" borderRadius="md" maxW="md" mx="auto">
          <AlertIcon />
          <Text fontSize="md" fontWeight="medium">
            {t("noBooks", { defaultValue: "検索条件に一致する絵本が見つかりませんでした。" })}
          </Text>
        </Alert>
        <Button
          mt={6}
          colorScheme="blue"
          size="sm"
          onClick={() => {
            // 検索条件リセット
            router.push(`/${locale}/community`);
          }}
        >
          {t("resetSearch", { defaultValue: "検索条件をリセット" })}
        </Button>
      </Box>
    );
  }

  // 日付フォーマットのヘルパー
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
        // ページを昇順ソート
        const sortedPages = book.pages
          ? [...book.pages].sort((a, b) => a.pageNumber - b.pageNumber)
          : [];

        // 表紙画像の決定
        let coverImage = "/images/sample-cover.png";
        if (sortedPages.length > 0 && sortedPages[0].imageUrl) {
          coverImage = sortedPages[0].imageUrl!;
        } else if (book.coverImageUrl?.trim()) {
          coverImage = book.coverImageUrl;
        }

        return (
          <Box key={book.id} mb={20}>
            {/* カバー画像 */}
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
                  {book.user.name || t("anonymousUser", { defaultValue: "匿名ユーザー" })}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {formatDate(book.communityAt)}
                </Text>
              </Flex>

              {/* いいね数・コメント数 */}
              <Flex p={3} justify="space-between" align="center">
                <HStack spacing={4}>
                  {/* いいねボタン */}
                  <Flex align="center">
                    <IconButton
                      aria-label={
                        likedBooks[book.id]
                          ? t("unlikeBook", { defaultValue: "いいねを取り消す" })
                          : t("likeBook", { defaultValue: "いいねする" })
                      }
                      icon={likedBooks[book.id] ? <FaHeart /> : <FaRegHeart />}
                      variant="ghost"
                      colorScheme="pink"
                      size="sm"
                      onClick={(e) => {
                        // リンク押下を阻止
                        e.preventDefault();
                        e.stopPropagation();
                        onToggleLike(book.id);
                      }}
                    />
                    <Text fontSize="sm">{book._count.likes}</Text>
                  </Flex>

                  {/* コメント数（クリックでコメントモーダルを開く） */}
                  <Flex 
                    align="center" 
                    cursor="pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onOpenCommentModal(book);
                    }}
                  >
                    <FaComment color="gray" size="14px" />
                    <Text fontSize="sm" ml={1}>
                      {book._count.comments}
                    </Text>
                  </Flex>
                </HStack>

                {/* 対象年齢 */}
                {book.targetAge && (
                  <Badge fontSize="xs" colorScheme="green">
                    {book.targetAge}
                  </Badge>
                )}
              </Flex>

              {/* 最新コメント (あれば1件目を表示) */}
              {book.comments.length > 0 && (
                <Box bg={commentBg} p={2} fontSize="xs">
                  <Flex align="center" mb={1} justify="space-between">
                    <Flex align="center">
                      <Avatar
                        src={book.comments[0].user.image || "/images/default-avatar.png"}
                        size="2xs"
                        mr={1}
                      />
                      <Text fontWeight="bold" fontSize="xx-small">
                        {book.comments[0].user.name || t("anonymousUser", { defaultValue: "匿名ユーザー" })}:
                      </Text>
                    </Flex>
                    
                    {/* コメントを見るボタン */}
                    <Button
                      size="xs"
                      variant="link"
                      colorScheme="blue"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onOpenCommentModal(book);
                      }}
                    >
                      {t("viewAllComments", { defaultValue: "全て見る", count: book._count.comments })}
                    </Button>
                  </Flex>
                  <Text noOfLines={2} pl={5}>
                    {book.comments[0].text}
                  </Text>
                </Box>
              )}
              
              {/* コメントがない場合もボタンを表示 */}
              {book.comments.length === 0 && (
                <Button
                  mt={2}
                  size="xs"
                  width="full"
                  variant="outline"
                  colorScheme="blue"
                  leftIcon={<FaComment size="12px" />}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenCommentModal(book);
                  }}
                >
                  {t("addFirstComment", { defaultValue: "コメントを追加" })}
                </Button>
              )}
            </Box>
          </Box>
        );
      })}
    </SimpleGrid>
  );
}