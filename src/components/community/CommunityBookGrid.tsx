"use client";

import React, { useEffect } from "react";
import {
  SimpleGrid,
  Box,
  Text,
  Flex,
  Heading,
  Badge,
  Avatar,
  Button,
  IconButton,
  Card,
  CardBody,
  CardFooter,
  Divider,
  Tooltip,
  useColorModeValue,
  Skeleton,
  SkeletonText,
  VStack,
} from "@chakra-ui/react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { FaHeart, FaRegHeart, FaComment, FaEye } from "react-icons/fa";

// 型定義
interface Book {
  id: number;
  title: string;
  coverImageUrl?: string | null;
  communityAt?: Date | null;
  theme?: string | null;
  genre?: string | null;
  targetAge?: string | null;
  artStyleId?: number | null;
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
  books: Book[];
  likedBooks: Record<number, boolean>;
  onToggleLike: (bookId: number) => Promise<void>;
  locale: string;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

// モーション対応コンポーネント
const MotionCard = motion(Card);

export default function CommunityBookGrid({
  books,
  likedBooks,
  onToggleLike,
  locale,
  isLoading,
  setIsLoading,
}: CommunityBookGridProps) {
  const t = useTranslations("Community");
  
  const cardBg = useColorModeValue("white", "gray.700");
  const textColor = useColorModeValue("gray.700", "white");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const commentBg = useColorModeValue("gray.50", "gray.800");

  // 日付フォーマット用の簡易関数
  const formatDate = (date?: Date | null) => {
    if (!date) return "";
    
    const d = new Date(date);
    
    if (locale === "ja") {
      // 日本語フォーマット: yyyy年MM月dd日
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    } else {
      // 英語フォーマット: MMM dd, yyyy
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }
  };

  // ページ読み込み完了時にローディング状態を解除
  useEffect(() => {
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

  return (
    <SimpleGrid 
      columns={{ base: 1, sm: 2, md: 3, lg: 4 }} 
      spacing={6}
      mb={8}
    >
      {books.map((book, index) => (
        <MotionCard
          key={book.id}
          maxW="100%"
          overflow="hidden"
          bg={cardBg}
          shadow="md"
          borderColor={borderColor}
          borderWidth="1px"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.05 }}
          _hover={{ transform: "translateY(-4px)", shadow: "lg" }}
        >
          {/* カバー画像 */}
          <Box position="relative" height="200px" width="100%">
            <Skeleton isLoaded={!isLoading} height="100%">
              {book.coverImageUrl ? (
                <Image
                  src={book.coverImageUrl}
                  alt={book.title}
                  fill
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <Box bg="gray.200" height="full" width="full" />
              )}
            </Skeleton>
            
            {/* ジャンル・テーマのバッジ */}
            {!isLoading && (book.genre || book.theme) && (
              <Badge
                position="absolute"
                top={2}
                left={2}
                colorScheme="blue"
                fontSize="xs"
                px={2}
                py={1}
                borderRadius="md"
              >
                {book.genre || book.theme}
              </Badge>
            )}
            
            {/* 対象年齢のバッジ */}
            {!isLoading && book.targetAge && (
              <Badge
                position="absolute"
                bottom={2}
                right={2}
                colorScheme="green"
                fontSize="xs"
                px={2}
                py={1}
                borderRadius="md"
              >
                {book.targetAge}
              </Badge>
            )}
          </Box>
          
          <CardBody py={3}>
            <SkeletonText isLoaded={!isLoading} noOfLines={2} spacing={2}>
              <Heading size="md" mb={2} noOfLines={2} color={textColor}>
                {book.title}
              </Heading>
            </SkeletonText>
            
            <Skeleton isLoaded={!isLoading} mt={2} height={isLoading ? "20px" : "auto"}>
              <Flex align="center" mb={2}>
                <Avatar
                  src={book.user.image || "/images/default-avatar.png"}
                  size="xs"
                  mr={2}
                />
                <Text fontSize="sm" color="gray.500">
                  {book.user.name || t("anonymousUser")}
                </Text>
              </Flex>
            </Skeleton>
            
            <Skeleton isLoaded={!isLoading} height={isLoading ? "20px" : "auto"}>
              <Text fontSize="xs" color="gray.500" mt={1}>
                {t("postedOn")} {formatDate(book.communityAt)}
              </Text>
            </Skeleton>
          </CardBody>
          
          <Divider />
          
          {/* コメント表示エリア */}
          {!isLoading && book.comments.length > 0 && (
            <Box p={3} bg={commentBg}>
              <Text fontSize="xs" fontWeight="bold" mb={2}>
                {t("recentComments")}:
              </Text>
              
              <VStack align="stretch" spacing={2}>
                {book.comments.slice(0, 1).map((comment) => (
                  <Box
                    key={comment.id}
                    fontSize="xs"
                    p={2}
                    borderRadius="md"
                    bg={cardBg}
                    borderWidth="1px"
                    borderColor={borderColor}
                  >
                    <Flex align="center" mb={1}>
                      <Avatar
                        src={comment.user.image || "/images/default-avatar.png"}
                        size="2xs"
                        mr={1}
                      />
                      <Text fontWeight="bold" fontSize="xx-small">
                        {comment.user.name || t("anonymousUser")}
                      </Text>
                    </Flex>
                    <Text noOfLines={2}>{comment.text}</Text>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}
          
          <Divider />
          
          {/* フッター: いいね数、コメント数、読むボタン */}
          <CardFooter pt={2} pb={3} px={3} justifyContent="space-between">
            <Flex align="center">
              <Skeleton isLoaded={!isLoading} width={isLoading ? "60px" : "auto"}>
                <Tooltip label={likedBooks[book.id] ? t("unlikeBook") : t("likeBook")}>
                  <IconButton
                    aria-label={likedBooks[book.id] ? t("unlikeBook") : t("likeBook")}
                    icon={likedBooks[book.id] ? <FaHeart /> : <FaRegHeart />}
                    variant="ghost"
                    colorScheme="pink"
                    size="sm"
                    mr={1}
                    onClick={() => onToggleLike(book.id)}
                  />
                </Tooltip>
                <Text fontSize="sm" mr={3}>
                  {book._count.likes}
                </Text>
              </Skeleton>
              
              <Skeleton isLoaded={!isLoading} width={isLoading ? "60px" : "auto"}>
                <Flex align="center">
                  <FaComment color="gray.500" size="14px" />
                  <Text fontSize="sm" ml={1}>
                    {book._count.comments}
                  </Text>
                </Flex>
              </Skeleton>
            </Flex>
            
            <Skeleton isLoaded={!isLoading} width={isLoading ? "80px" : "auto"}>
              <Link href={`/${locale}/ehon/${book.id}/viewer`} passHref>
                <Button
                  size="sm"
                  colorScheme="blue"
                  variant="outline"
                  leftIcon={<FaEye />}
                >
                  {t("read")}
                </Button>
              </Link>
            </Skeleton>
          </CardFooter>
        </MotionCard>
      ))}
    </SimpleGrid>
  );
}