"use client";

import { useState, useEffect, useCallback } from "react";
import { Box, Container, useToast } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import EnhancedCommunityFilters from "./EnhancedCommunityFilters";
import CommunityBookGrid from "./CommunityBookGrid";
import CommunityPagination from "./CommunityPagination";

/** 
 * Book type (拡張版)
 * CommunityBookGrid で user, comments などを使うので、それらを含む
 */
export interface Book {
  id: number;
  title: string;
  coverImageUrl?: string | null;
  communityAt?: Date | null;
  pages?: {
    pageNumber: number;
    imageUrl?: string | null;
  }[];
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

/** Category option type */
export interface CategoryOption {
  value: string;
  label: string;
  count: number;
}

/** Pagination info */
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/** CurrentFilters (検索フィルタ) */
export interface CurrentFilters {
  sort?: string;
  age?: string;
  characters?: string;
  artStyleId?: string;
  pageCount?: string;
  theme?: string;
  genre?: string;
}

interface CommunityClientWrapperProps {
  books: Book[]; // こちらも拡張版 Book[]
  categories: CategoryOption[];
  ageOptions: CategoryOption[];
  pagination: PaginationInfo;
  currentFilters: CurrentFilters;
  totalCount: number;
  locale: string;
}

/**
 * CommunityClientWrapper
 * - コミュニティページでの検索・ページネーション・いいねトグルなど
 */
export default function CommunityClientWrapper({
  books,
  categories,
  ageOptions,
  pagination,
  currentFilters,
  totalCount,
  locale,
}: CommunityClientWrapperProps) {
  const t = useTranslations("Community");
  const router = useRouter();
  const toast = useToast();

  // 1) SSR から受け取った books をローカル state に (いいね数の楽観的UIなど)
  const [bookList, setBookList] = useState<Book[]>(() => books);

  // SSRで新しいbooksが来たら更新 (検索パラメータ変化など)
  useEffect(() => {
    setBookList(books);
  }, [books]);

  // 2) likedBooks: Bookごとのいいねフラグ
  const [likedBooks, setLikedBooks] = useState<Record<number, boolean>>({});

  // ローディング制御
  const [isLoading, setIsLoading] = useState(false);
  const [navigationInProgress, setNavigationInProgress] = useState(false);

  /**
   * ページ変更 (ページネーション)
   */
  const handlePageChange = useCallback(
    (newPage: number) => {
      setIsLoading(true);
      setNavigationInProgress(true);

      // クエリパラメータ
      const newParams = new URLSearchParams();
      if (currentFilters.sort) newParams.set("sort", currentFilters.sort);
      if (currentFilters.age) newParams.set("age", currentFilters.age);
      if (currentFilters.characters) newParams.set("characters", currentFilters.characters);
      if (currentFilters.artStyleId) newParams.set("artStyleId", currentFilters.artStyleId);
      if (currentFilters.pageCount) newParams.set("pageCount", currentFilters.pageCount);
      if (currentFilters.theme) newParams.set("theme", currentFilters.theme);
      if (currentFilters.genre) newParams.set("genre", currentFilters.genre);

      newParams.set("page", newPage.toString());
      router.push(`/${locale}/community?${newParams.toString()}`);
    },
    [currentFilters, locale, router]
  );

  /**
   * いいねトグル処理
   */
  const handleToggleLike = async (bookId: number) => {
    // bookId の Book を検索
    const index = bookList.findIndex((b) => b.id === bookId);
    if (index < 0) return;

    const oldLiked = likedBooks[bookId] ?? false;
    const oldLikeCount = bookList[index]._count.likes;

    // 1) 楽観的UI: likedBooks[bookId] を反転, like数を +1/-1
    const newLiked = !oldLiked;
    const newLikeCount = newLiked
      ? oldLikeCount + 1
      : Math.max(0, oldLikeCount - 1);

    setLikedBooks((prev) => ({ ...prev, [bookId]: newLiked }));
    setBookList((prev) => {
      const arr = [...prev];
      arr[index] = {
        ...arr[index],
        _count: {
          ...arr[index]._count,
          likes: newLikeCount,
        },
      };
      return arr;
    });

    // 2) トグルAPI呼び出し
    try {
      const res = await fetch(`/api/ehon/${bookId}/like`, {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error("Failed to toggle like");
      }
      const data = await res.json();
      const finalIsLiked = !!data.isLiked;

      // サーバーとの乖離を補正
      if (finalIsLiked !== newLiked) {
        const correctedCount = finalIsLiked
          ? oldLikeCount + 1
          : Math.max(0, oldLikeCount - 1);

        setLikedBooks((prev) => ({ ...prev, [bookId]: finalIsLiked }));
        setBookList((prev) => {
          const arr = [...prev];
          arr[index] = {
            ...arr[index],
            _count: {
              ...arr[index]._count,
              likes: correctedCount,
            },
          };
          return arr;
        });
      }

      // Toast 表示
      if (finalIsLiked) {
        toast({
          title: t("likeAdded", { defaultValue: "いいねしました" }),
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      } else {
        toast({
          title: t("likeRemoved", { defaultValue: "いいねを取り消しました" }),
          status: "info",
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error(err);
      // 失敗 → ロールバック
      toast({
        title: t("likeError", { defaultValue: "いいね操作に失敗しました" }),
        status: "error",
        duration: 3000,
        isClosable: true,
      });

      setLikedBooks((prev) => ({ ...prev, [bookId]: oldLiked }));
      setBookList((prev) => {
        const arr = [...prev];
        arr[index] = {
          ...arr[index],
          _count: {
            ...arr[index]._count,
            likes: oldLikeCount,
          },
        };
        return arr;
      });
    }
  };

  // SSR更新後のローディング解除
  useEffect(() => {
    if (navigationInProgress) {
      setIsLoading(false);
      setNavigationInProgress(false);
    }
  }, [bookList, navigationInProgress]);

  // 保険的にローディング停止
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
        setNavigationInProgress(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return (
    <Box py={8} bg="white">
      <Container maxW="container.xl">
        {/* 絞り込みフィルター */}
        <EnhancedCommunityFilters
          categories={categories}
          ageOptions={ageOptions}
          locale={locale}
          isLoading={isLoading}
          totalCount={totalCount}
          theme={currentFilters.theme}
          genre={currentFilters.genre}
          characters={currentFilters.characters}
          artStyleId={currentFilters.artStyleId}
          pageCount={currentFilters.pageCount}
          age={currentFilters.age}
          sort={currentFilters.sort}
        />

        {/* Book一覧 */}
        <CommunityBookGrid
          books={bookList}
          likedBooks={likedBooks}
          onToggleLike={handleToggleLike}
          locale={locale}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />

        {/* ページネーション */}
        {pagination.totalPages > 1 && (
          <CommunityPagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            hasNextPage={pagination.hasNextPage}
            hasPrevPage={pagination.hasPrevPage}
            onPageChange={handlePageChange}
          />
        )}
      </Container>
    </Box>
  );
}
