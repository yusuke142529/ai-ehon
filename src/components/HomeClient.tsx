"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image"; // ← next/image を導入
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

// typewriter-effect は SSR を除外して動的 import
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
  isCommunity: boolean;
  pages?: {
    pageNumber: number;
    imageUrl: string;
  }[];
  theme?: string;
  genre?: string;
  characters?: string;
  artStyleId?: number;
  targetAge?: string;
  pageCount?: number;
  likes?: unknown[];
  isFavorite?: boolean;
}

/** ユーザーの型定義 (idは string) */
interface UserProfile {
  id?: string;
  name?: string;
  email?: string;
  image?: string;
}

/**
 * TopPageProps
 * - user: ログインユーザー (null の場合は未ログイン)
 * - userEhons: ログインユーザーが持つ絵本 (SSR/CSR で取得済み)
 */
interface TopPageProps {
  user: UserProfile | null;
  userEhons?: BookItem[];
}

/**
 * HomeClient (トップページ用コンポーネント)
 * - 未ログイン時: ヒーローセクションを表示
 * - ログイン時: ユーザー絵本一覧 & 検索機能を表示
 */
export default function HomeClient({ user, userEhons }: TopPageProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const overlayBg = useColorModeValue("rgba(0,0,0,0.4)", "rgba(0,0,0,0.6)");
  const mainBg = useColorModeValue("white", "gray.900");
  const mainColor = useColorModeValue("gray.800", "gray.100");

  // 未ログインの場合 → ヒーローセクションのみ表示
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
          {/* fallback を next/image で対応 */}
          <Box position="relative" width="100%" height="100%">
            <Image
              src="/images/hero-background-fallback.jpg"
              alt="fallback"
              fill
              style={{ objectFit: "cover" }}
            />
          </Box>
        </Box>

        {/* オーバーレイ */}
        <Box position="absolute" top={0} left={0} w="full" h="full" bg={overlayBg} zIndex={1} />

        <HeroSection prefersReducedMotion={prefersReducedMotion} />
      </Box>
    );
  }

  // ログイン時 → 絵本一覧＋検索機能表示
  return (
    <Box
      as="main"
      w="full"
      minH="100vh"
      bg={mainBg}
      color={mainColor}
    >
      <Container maxW="6xl" py={10}>
        <LoggedInSection user={user} userEhons={userEhons} />
      </Container>
    </Box>
  );
}

/** ヒーローセクション (未ログイン用) */
function HeroSection({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  const t = useTranslations("Hero");
  const locale = useLocale();

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
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
        <MotionHeading as="h1" fontSize={{ base: "3xl", md: "5xl" }} fontWeight="extrabold" mb={4}>
          <TypewriterNoSSR
            options={{
              strings: [t("typewriter1"), t("typewriter2"), t("typewriter3")],
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

/** ログイン後のセクション */
function LoggedInSection({
  user,
  userEhons,
}: {
  user: UserProfile;
  userEhons?: BookItem[];
}) {
  const t = useTranslations("common");
  const locale = useLocale();

  // ユーザー絵本一覧
  const [userBooks, setUserBooks] = useState<BookItem[]>(userEhons ?? []);
  const [userBooksPage, setUserBooksPage] = useState(1);
  const [isUserBooksEnd, setIsUserBooksEnd] = useState(false);
  const userBooksLimit = 8;

  // 検索結果
  const [searchResults, setSearchResults] = useState<BookItem[] | null>(null);
  const [searchPage, setSearchPage] = useState(1);
  const [searchParamsState, setSearchParamsState] = useState<SearchParams | null>(null);
  const [isSearchEnd, setIsSearchEnd] = useState(false);
  const searchLimit = 8;

  const [isLoading, setIsLoading] = useState(false);

  // 初期のユーザー絵本を再取得
  useEffect(() => {
    if (!user.id) return;
    async function fetchInitialUserBooks(userId: string) {
      try {
        setIsLoading(true);
        const urlParams = new URLSearchParams();
        urlParams.set("userId", userId);
        urlParams.set("page", "1");
        urlParams.set("limit", String(userBooksLimit));

        const res = await fetch(`/api/ehon?${urlParams.toString()}`);
        if (!res.ok) throw new Error("Initial user books fetch failed");
        const data: BookItem[] = await res.json();

        setUserBooks(data);
        setUserBooksPage(1);
        setIsUserBooksEnd(data.length < userBooksLimit);
      } catch (err) {
        console.error(err);
        alert("初期絵本の取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    }
    fetchInitialUserBooks(user.id);
  }, [user.id]);

  async function handleLoadMoreUserBooks() {
    if (!user.id || isUserBooksEnd) return;
    setIsLoading(true);
    const nextPage = userBooksPage + 1;

    try {
      const urlParams = new URLSearchParams();
      urlParams.set("userId", user.id);
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
      setUserBooks((prev) => [...prev, ...newData]);
      setUserBooksPage(nextPage);
    } catch (err) {
      console.error(err);
      alert("さらに読み込めませんでした (ユーザー絵本)");
    } finally {
      setIsLoading(false);
    }
  }

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

  async function handleLoadMoreSearch() {
    if (!searchParamsState || isSearchEnd) return;
    setIsLoading(true);
    const nextPage = searchPage + 1;

    try {
      const urlParams = new URLSearchParams();
      if (searchParamsState.theme) urlParams.set("theme", searchParamsState.theme);
      if (searchParamsState.genre) urlParams.set("genre", searchParamsState.genre);
      if (searchParamsState.characters) {
        urlParams.set("characters", searchParamsState.characters);
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
      setSearchResults((prev) => (prev ? [...prev, ...newData] : newData));
      setSearchPage(nextPage);
    } catch (err) {
      console.error(err);
      alert("さらに読み込めませんでした (検索結果)");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Heading size="md" mb={2}>
        {t.rich("welcomeMessage", {
          name: () => (
            <UserNameClient defaultName={user.name || "名無し"}>
              {user.name || "名無し"}
            </UserNameClient>
          ),
        })}
      </Heading>

      <Text fontSize="sm" color="gray.600" mb={4}>
        {t("createInvite")}
      </Text>

      {/* 新規絵本作成ボタン */}
      <Link href={`/${locale}/ehon/create`}>
        <Button colorScheme="blue" size="md" boxShadow="sm" mb={6}>
          {t("createNewBook")}
        </Button>
      </Link>

      {/* 検索パネル */}
      <SearchPanel onSearch={handleSearch} isLoading={isLoading} />

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

      {searchResults ? (
        <SearchResultsView
          books={searchResults}
          onLoadMore={handleLoadMoreSearch}
          isSearchEnd={isSearchEnd}
          isLoading={isLoading}
        />
      ) : (
        <UserBooksView
          books={userBooks}
          onLoadMoreUserBooks={handleLoadMoreUserBooks}
          isEnd={isUserBooksEnd}
          isLoading={isLoading}
        />
      )}
    </>
  );
}

/** 検索結果表示用 */
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
                  <BookCard title={book.title} coverImage={coverImage} />
                </Link>
              );
            })}
          </SimpleGrid>

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

/** ユーザー絵本一覧表示用 */
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
                 <BookCard title={book.title} coverImage={coverImage} />
                </Link>
              );
            })}
          </SimpleGrid>

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