"use client";

import { useState } from "react";
import { Box, Container, useToast } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

// コンポーネントをインポート
import EnhancedCommunityFilters from "./EnhancedCommunityFilters"; // SearchPanelを活用した新しいコンポーネント
import CommunityBookGrid from "./CommunityBookGrid";
import CommunityPagination from "./CommunityPagination";

/** Book 型 */
export interface Book {
  id: number;
  title: string;
  coverImageUrl?: string | null;
  communityAt?: Date | null;
  theme?: string | null;
  genre?: string | null;
  targetAge?: string | null;
  artStyleId?: number | null;
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

/** カテゴリの型 */
export interface CategoryOption {
  value: string;
  label: string;
  count: number;
}

/** ページネーションなど共通 */
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * コミュニティページ用のフィルター情報
 * - EnhancedCommunityFilters と共有する
 */
export interface CurrentFilters {
  category?: string;
  sort?: string;
  age?: string;
  character?: string;
  artStyleId?: string;
  pageCount?: string;

  // 必要に応じて追加
  theme?: string;
  genre?: string;
}

interface CommunityClientWrapperProps {
  books: Book[];
  categories: CategoryOption[];
  ageOptions: CategoryOption[];
  pagination: PaginationInfo;
  currentFilters: CurrentFilters;
  totalCount: number;
  locale: string;
}

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
  
  // ユーザーのいいね操作を追跡する状態
  const [likedBooks, setLikedBooks] = useState<Record<number, boolean>>({});
  // クライアントサイドでのローディング状態
  const [isLoading, setIsLoading] = useState(false);

  // フィルター変更時の処理
  const handleFilterChange = (
    filterType: keyof CurrentFilters,
    value: string | undefined
  ) => {
    setIsLoading(true);

    // 検索パラメータの管理
    const newParams = new URLSearchParams();

    // フィルターキー
    const filterKeys: (keyof CurrentFilters)[] = [
      "category", "sort", "age", "character",
      "artStyleId", "pageCount", "theme", "genre",
    ];

    // 既存のフィルターを適用 (変更対象以外)
    filterKeys.forEach((key) => {
      if (key !== filterType && currentFilters[key]) {
        newParams.set(key, currentFilters[key]!);
      }
    });

    // 新しいフィルター値を適用
    if (value) {
      newParams.set(filterType, value);
    }

    // ページは1にリセット
    newParams.set("page", "1");

    // URLナビゲーション
    router.push(`/${locale}/community?${newParams.toString()}`);
  };

  // ページ変更時の処理
  const handlePageChange = (newPage: number) => {
    setIsLoading(true);

    const newParams = new URLSearchParams();
    const filterKeys: (keyof CurrentFilters)[] = [
      "category", "sort", "age", "character",
      "artStyleId", "pageCount", "theme", "genre",
    ];

    filterKeys.forEach((key) => {
      if (currentFilters[key]) {
        newParams.set(key, currentFilters[key]!);
      }
    });

    newParams.set("page", newPage.toString());
    router.push(`/${locale}/community?${newParams.toString()}`);
  };

  // いいね機能のハンドラ
  const handleToggleLike = async (bookId: number) => {
    try {
      setLikedBooks((prev) => ({
        ...prev,
        [bookId]: !prev[bookId],
      }));
      
      const res = await fetch(`/api/ehon/${bookId}/favorite`, {
        method: "POST",
      });

      if (!res.ok) {
        // 失敗時は状態を元に戻す
        setLikedBooks((prev) => ({
          ...prev,
          [bookId]: !prev[bookId],
        }));
        throw new Error("Failed to toggle like");
      }

      const data = await res.json();
      toast({
        title: data.isFavorite ? t("likeAdded") : t("likeRemoved"),
        status: data.isFavorite ? "success" : "info",
        duration: 2000,
        isClosable: true,
      });
    } catch {
      toast({
        title: t("likeError"),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box py={8} bg="white">
      <Container maxW="container.xl">
        {/* フィルターセクション */}
        <EnhancedCommunityFilters
          categories={categories}
          ageOptions={ageOptions}
          currentFilters={currentFilters}
          onFilterChange={handleFilterChange}
          totalCount={totalCount}
          isLoading={isLoading}
        />

        {/* 絵本グリッド */}
        <CommunityBookGrid
          books={books}
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
