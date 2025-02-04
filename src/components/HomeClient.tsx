"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Flex,
  useColorModeValue,
  usePrefersReducedMotion,
  Spinner,
  SimpleGrid,
  Divider,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";

import SearchPanel, { SearchParams } from "@/components/SearchPanel";
import BookCard from "@/components/BookCard";
import { UserNameClient } from "@/components/UserNameClient";

// タイピング見出し用 (ヒーロー)
const TypewriterNoSSR = dynamic(() => import("typewriter-effect"), { ssr: false });
const MotionBox = motion(Box);
const MotionHeading = motion(Heading);
const MotionText = motion(Text);
const MotionButton = motion(Button);

/** BookItem 型定義 */
interface BookItem {
  id: number;
  title: string;
  isPublished: boolean;
  pages?: {
    pageNumber: number;
    imageUrl: string;
  }[];
  theme?: string;
  genre?: string;
  characters?: string;
  artStyleCategory?: string;
  artStyleId?: number;
  targetAge?: string;
  pageCount?: number;
  likes?: any[];
  isFavorite?: boolean;
}

/** props */
interface TopPageProps {
  user: {
    id?: string | number;
    name?: string;
    email?: string;
    image?: string;
  } | null;
}

/**
 * トップページ (完成版)
 * - 未ログイン時: ヒーローセクション
 * - ログイン時: ユーザー絵本(初期8件) + LoadMore + 検索機能(ページング)
 */
export default function TopPage({ user }: TopPageProps) {
  const t = useTranslations("common");
  const locale = useLocale();
  const prefersReducedMotion = usePrefersReducedMotion();
  const overlayBg = useColorModeValue("rgba(0,0,0,0.4)", "rgba(0,0,0,0.6)");

  // ============================
  // 1) ユーザー絵本 (初期8件 + LoadMore)
  // ============================
  const [userBooks, setUserBooks] = useState<BookItem[]>([]);
  const [userBooksPage, setUserBooksPage] = useState(1);
  const [isUserBooksEnd, setIsUserBooksEnd] = useState(false);
  const userBooksLimit = 8;

  // ============================
  // 2) 検索機能 (ページング)
  // ============================
  const [searchResults, setSearchResults] = useState<BookItem[] | null>(null);
  const [searchPage, setSearchPage] = useState(1);
  const [searchParamsState, setSearchParamsState] = useState<SearchParams | null>(null);
  const [isSearchEnd, setIsSearchEnd] = useState(false);
  const searchLimit = 8;

  // ============================
  // ローディング管理
  // ============================
  const [isLoading, setIsLoading] = useState(false);

  // ============================
  // 初期表示: ユーザー絵本を8件取得
  // ============================
  useEffect(() => {
    if (!user) return; // 未ログインなら取得しない

    async function fetchInitialUserBooks() {
      try {
        setIsLoading(true);

        // page=1 & limit=8
        const urlParams = new URLSearchParams();
        urlParams.set("userId", String(user.id));
        urlParams.set("page", "1");
        urlParams.set("limit", String(userBooksLimit));

        const res = await fetch(`/api/ehon?${urlParams.toString()}`);
        if (!res.ok) {
          throw new Error("Initial user books fetch failed");
        }
        const data: BookItem[] = await res.json();

        setUserBooks(data);
        setUserBooksPage(1);
        setIsUserBooksEnd(data.length < userBooksLimit); // 8件未満 => もう終わり
      } catch (err) {
        console.error(err);
        alert("初期絵本の取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    }

    fetchInitialUserBooks();
  }, [user]);

  // ============================
  // ユーザー絵本: Load More
  // ============================
  async function handleLoadMoreUserBooks() {
    if (!user || isUserBooksEnd) return;

    const nextPage = userBooksPage + 1;
    setIsLoading(true);

    try {
      const urlParams = new URLSearchParams();
      urlParams.set("userId", String(user.id));
      urlParams.set("page", String(nextPage));
      urlParams.set("limit", String(userBooksLimit));

      const res = await fetch(`/api/ehon?${urlParams.toString()}`);
      if (!res.ok) {
        throw new Error("Load more user books failed");
      }
      const newData: BookItem[] = await res.json();

      if (newData.length < userBooksLimit) {
        setIsUserBooksEnd(true);
      }
      setUserBooks(prev => [...prev, ...newData]);
      setUserBooksPage(nextPage);

    } catch (err) {
      console.error(err);
      alert("さらに読み込めませんでした (ユーザー絵本)");
    } finally {
      setIsLoading(false);
    }
  }

  // ============================
  // 検索実行
  // ============================
  async function handleSearch(params: SearchParams) {
    setIsLoading(true);
    setIsSearchEnd(false);
    setSearchPage(1);
    setSearchParamsState(params);

    try {
      const urlParams = new URLSearchParams();
      if (params.theme) urlParams.set("theme", params.theme);
      if (params.genre) urlParams.set("genre", params.genre);
      if (params.characters) urlParams.set("characters", params.characters);
      if (params.artStyleCategory) urlParams.set("artStyleCategory", params.artStyleCategory);
      if (params.artStyleId) urlParams.set("artStyleId", String(params.artStyleId));
      if (params.pageCount) urlParams.set("pageCount", params.pageCount);
      if (params.targetAge) urlParams.set("targetAge", params.targetAge);
      if (params.onlyFavorite) urlParams.set("favorite", "true");

      urlParams.set("page", "1");
      urlParams.set("limit", String(searchLimit));

      const res = await fetch(`/api/ehon?${urlParams.toString()}`);
      if (!res.ok) throw new Error("Search request failed");

      const data: BookItem[] = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error(err);
      alert("検索に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }

  // ============================
  // 検索結果: Load More
  // ============================
  async function handleLoadMoreSearch() {
    if (!searchParamsState || isSearchEnd) return;

    const nextPage = searchPage + 1;
    setIsLoading(true);

    try {
      const urlParams = new URLSearchParams();
      // 検索params
      if (searchParamsState.theme) urlParams.set("theme", searchParamsState.theme);
      if (searchParamsState.genre) urlParams.set("genre", searchParamsState.genre);
      if (searchParamsState.characters) urlParams.set("characters", searchParamsState.characters);
      if (searchParamsState.artStyleCategory) {
        urlParams.set("artStyleCategory", searchParamsState.artStyleCategory);
      }
      if (searchParamsState.artStyleId) {
        urlParams.set("artStyleId", String(searchParamsState.artStyleId));
      }
      if (searchParamsState.pageCount) {
        urlParams.set("pageCount", searchParamsState.pageCount);
      }
      if (searchParamsState.targetAge) {
        urlParams.set("targetAge", searchParamsState.targetAge);
      }
      if (searchParamsState.onlyFavorite) {
        urlParams.set("favorite", "true");
      }

      urlParams.set("page", String(nextPage));
      urlParams.set("limit", String(searchLimit));

      const res = await fetch(`/api/ehon?${urlParams.toString()}`);
      if (!res.ok) throw new Error("Load more search failed");

      const newData: BookItem[] = await res.json();

      if (newData.length < searchLimit) {
        setIsSearchEnd(true);
      }
      setSearchResults(prev => {
        if (!prev) return newData;
        return [...prev, ...newData];
      });
      setSearchPage(nextPage);

    } catch (err) {
      console.error(err);
      alert("さらに読み込めませんでした (検索結果)");
    } finally {
      setIsLoading(false);
    }
  }

  // ============================
  // 未ログイン => ヒーロー
  // ============================
  if (!user) {
    return (
      <Box
        as="main"
        w="full"
        minH="100vh"
        position="relative"
        color="white"
        bg="gray.800"
        overflow="hidden"
      >
        {/* 背景動画 */}
        <Box
          as="video"
          poster="/images/hero-background-fallback.jpg"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          position="absolute"
          top={0}
          left={0}
          w="full"
          h="full"
          objectFit="cover"
          zIndex={0}
        >
          <source src="/videos/Magical_Storybook_Adventure_vp9.webm" type="video/webm" />
          <source src="/videos/Magical_Storybook_Adventure_h265.mp4" type="video/mp4" />
          <img src="/images/hero-background-fallback.jpg" alt="fallback" />
        </Box>
        <Box position="absolute" top={0} left={0} w="full" h="full" bg={overlayBg} zIndex={1} />
        <HeroSection prefersReducedMotion={prefersReducedMotion} />
      </Box>
    );
  }

  // ============================
  // ログイン時: 絵本一覧(初期8件) + 検索(ページング)
  // ============================
  return (
    <Box
      as="main"
      w="full"
      minH="100vh"
      bg={useColorModeValue("white", "gray.900")}
      color={useColorModeValue("gray.800", "gray.100")}
    >
      <Container maxW="6xl" py={10}>
        <LoggedInSection
          user={user}
          userBooks={userBooks}
          onLoadMoreUserBooks={handleLoadMoreUserBooks}
          isUserBooksEnd={isUserBooksEnd}
          searchResults={searchResults}
          onSearch={handleSearch}
          onLoadMoreSearch={handleLoadMoreSearch}
          isSearchEnd={isSearchEnd}
          isLoading={isLoading}
        />
      </Container>
    </Box>
  );
}

/** ヒーローセクション */
function HeroSection({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  const t = useTranslations("Hero");
  const locale = useLocale();

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1, y: 0,
      transition: prefersReducedMotion ? { duration: 0 } : { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <Container
      maxW="3xl"
      position="relative"
      zIndex={2}
      h="100vh"
      display="flex"
      justifyContent="center"
      alignItems="center"
      textAlign="center"
    >
      <MotionBox initial="hidden" animate="visible" variants={containerVariants}>
        <MotionHeading
          as="h1"
          fontSize={{ base: "3xl", md: "5xl" }}
          fontWeight="extrabold"
          mb={4}
        >
          <TypewriterNoSSR
            options={{
              strings: [ t("typewriter1"), t("typewriter2"), t("typewriter3") ],
              autoStart: true,
              loop: true,
              deleteSpeed: 30,
              delay: 50,
            }}
          />
        </MotionHeading>

        <MotionText
          fontSize={{ base: "md", md: "xl" }}
          mb={8}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {t("subtitle")}
        </MotionText>

        <Flex direction={{ base: "column", md: "row" }} gap={4} justify="center" align="center">
          <Link href={`/${locale}/auth/register`} passHref>
            <MotionButton size="lg" bg="teal.500" color="white" boxShadow="xl">
              {t("registerButton")}
            </MotionButton>
          </Link>

          <Link href={`/${locale}/samples`} passHref>
            <MotionButton size="lg" bg="orange.400" color="white" boxShadow="xl">
              {t("sampleButton")}
            </MotionButton>
          </Link>
        </Flex>
      </MotionBox>
    </Container>
  );
}

/** ログイン後のメインセクション */
function LoggedInSection({
  user,
  userBooks,
  onLoadMoreUserBooks,
  isUserBooksEnd,
  searchResults,
  onSearch,
  onLoadMoreSearch,
  isSearchEnd,
  isLoading,
}: {
  user: { id?: string | number; name?: string; email?: string };
  userBooks: BookItem[];
  onLoadMoreUserBooks: () => void;
  isUserBooksEnd: boolean;
  searchResults: BookItem[] | null;
  onSearch: (params: SearchParams) => void;
  onLoadMoreSearch: () => void;
  isSearchEnd: boolean;
  isLoading: boolean;
}) {
  const t = useTranslations("common");
  const locale = useLocale();

  return (
    <>
      <Heading size="md" mb={2}>
        {t.rich("welcomeMessage", {
          name: <UserNameClient key="userNameClient" defaultName={user.name || "名無し"} />,
        })}
      </Heading>
      <Text fontSize="sm" color="gray.600" mb={4}>
        {t("createInvite")}
      </Text>

      <Link href={`/${locale}/ehon/create`}>
        <Button colorScheme="blue" size="md" boxShadow="sm" mb={6}>
          {t("createNewBook")}
        </Button>
      </Link>

      {/* 検索パネル */}
      <SearchPanel onSearch={onSearch} isLoading={isLoading} />

      {/* ローディング中スピナー */}
      {isLoading && (
        <Box mt={4}>
          <Spinner size="sm" mr={2} />
          <Text as="span" fontSize="sm">
            {t("searchingMsg")}
          </Text>
        </Box>
      )}

      <Divider my={6} />

      {/* (A) 検索中 => 検索結果(ページング), (B) なければユーザー絵本(初期8件 + LoadMore) */}
      {searchResults ? (
        <SearchResultsView
          books={searchResults}
          onLoadMore={onLoadMoreSearch}
          isSearchEnd={isSearchEnd}
          isLoading={isLoading}
        />
      ) : (
        <UserBooksView
          books={userBooks}
          onLoadMoreUserBooks={onLoadMoreUserBooks}
          isEnd={isUserBooksEnd}
          isLoading={isLoading}
        />
      )}
    </>
  );
}

/** 検索結果表示 + LoadMore */
function SearchResultsView({
  books,
  onLoadMore,
  isSearchEnd,
  isLoading,
}: {
  books: BookItem[];
  onLoadMore: () => void;
  isSearchEnd: boolean;
  isLoading: boolean;
}) {
  const t = useTranslations("common");
  const locale = useLocale();

  return (
    <Box mt={2}>
      <Heading size="lg" mb={4} color="blue.500">
        {t("searchResultTitle")}
      </Heading>

      {books.length > 0 ? (
        <>
          <SimpleGrid columns={[1, 2, 3]} spacing={4}>
            {books.map((book) => {
              const coverImage = book.pages?.[0]?.imageUrl || "/images/sample-cover.png";
              return (
                <Link key={book.id} href={`/${locale}/ehon/${book.id}/viewer`}>
                  <BookCard id={book.id} title={book.title} coverImage={coverImage} />
                </Link>
              );
            })}
          </SimpleGrid>

          {/* Load More (検索) */}
          {!isSearchEnd && (
            <Flex justify="center" mt={6}>
              <Button onClick={onLoadMore} isLoading={isLoading} colorScheme="teal" size="sm">
                {t("loadMore")}
              </Button>
            </Flex>
          )}
        </>
      ) : (
        <Text color="gray.500">{t("searchNoResult")}</Text>
      )}
    </Box>
  );
}

/** ユーザー絵本一覧 (初期8件 + LoadMore) */
function UserBooksView({
  books,
  onLoadMoreUserBooks,
  isEnd,
  isLoading,
}: {
  books: BookItem[];
  onLoadMoreUserBooks: () => void;
  isEnd: boolean;
  isLoading: boolean;
}) {
  const t = useTranslations("common");
  const locale = useLocale();

  return (
    <Box mt={2}>
      <Heading size="lg" mb={4}>
        {t("yourBooksTitle")}
      </Heading>

      {books.length > 0 ? (
        <>
          <SimpleGrid columns={[1, 2, 3]} spacing={4}>
            {books.map((book) => {
              const coverImage = book.pages?.[0]?.imageUrl || "/images/sample-cover.png";
              return (
                <Link key={book.id} href={`/${locale}/ehon/${book.id}/viewer`}>
                  <BookCard id={book.id} title={book.title} coverImage={coverImage} />
                </Link>
              );
            })}
          </SimpleGrid>

          {/* Load More (ユーザー絵本) */}
          {!isEnd && (
            <Flex justify="center" mt={6}>
              <Button onClick={onLoadMoreUserBooks} isLoading={isLoading} colorScheme="blue" size="sm">
                {t("loadMore")}
              </Button>
            </Flex>
          )}
        </>
      ) : (
        <Text color="gray.500">
          {t("noBooksYet")}
          <br />
          <Link href={`/${locale}/ehon/create`}>
            <Button mt={2} colorScheme="blue" size="sm">
              {t("createNewBook")}
            </Button>
          </Link>
        </Text>
      )}
    </Box>
  );
}