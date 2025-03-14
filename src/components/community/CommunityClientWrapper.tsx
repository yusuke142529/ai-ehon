"use client";

import { useState, useEffect, useCallback } from "react";
import { Box, Container, useToast } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import EnhancedCommunityFilters from "./EnhancedCommunityFilters";
import CommunityBookGrid from "./CommunityBookGrid";
import CommunityPagination from "./CommunityPagination";
import BookCommentModal from "./BookCommentModal";

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

export interface CategoryOption {
  value: string;
  label: string;
  count: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

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
  books: Book[];
  categories: CategoryOption[];
  ageOptions: CategoryOption[];
  pagination: PaginationInfo;
  currentFilters: CurrentFilters;
  totalCount: number;
  locale: string;
}

// Book["comments"] の要素型を再利用
type BookComment = Book["comments"][number];

/**
 * CommunityClientWrapper
 * - コミュニティページのメインロジック: 検索, ページネーション, いいね, etc.
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

  // 1) SSRから受け取った books をローカルステートに
  const [bookList, setBookList] = useState<Book[]>(books);

  // SSR props が変わるたびに再セット
  useEffect(() => {
    setBookList(books);
  }, [books]);

  // 2) いいね済みフラグ
  const [likedBooks, setLikedBooks] = useState<Record<number, boolean>>({});

  // ローディング制御
  const [isLoading, setIsLoading] = useState(false);

  /**
   * ページ変更 (ページネーション)
   */
  const handlePageChange = useCallback(
    (newPage: number) => {
      setIsLoading(true);

      // URLSearchParams
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
   * いいねトグル
   */
  const handleToggleLike = async (bookId: number) => {
    const index = bookList.findIndex((b) => b.id === bookId);
    if (index < 0) return;

    const oldLiked = likedBooks[bookId] ?? false;
    const oldLikeCount = bookList[index]._count.likes;

    // 楽観的UI
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

    try {
      const res = await fetch(`/api/ehon/${bookId}/like`, {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error("Failed to toggle like");
      }
      const data = await res.json();
      const finalIsLiked = !!data.isLiked;

      // 乖離補正
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

      // Toast
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
      // ロールバック
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

  // ローディング保険
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // コメント関連の状態と機能
  const [selectedBookForComments, setSelectedBookForComments] = useState<Book | null>(null);
  const [commentModalOpen, setCommentModalOpen] = useState(false);

  // BookComment の配列に型変更
  const [bookComments, setBookComments] = useState<BookComment[]>([]);

  // コメントモーダルを開く
  const handleOpenCommentModal = useCallback(
    async (book: Book) => {
      // 同じ本を再度選択した場合は状態を更新しない
      if (selectedBookForComments?.id === book.id && commentModalOpen) {
        return;
      }

      // まずモーダルを表示（UX向上のため）
      setSelectedBookForComments(book);
      // 初期表示用に既存のコメントをセット（最新2件しか持っていないかもしれない）
      setBookComments(book.comments || []);
      setCommentModalOpen(true);

      // refreshComments はモーダル内の useEffect で自動的に呼ばれるのでここでは呼ばない
    },
    [selectedBookForComments, commentModalOpen]
  );

  // コメントの再取得
  const refreshComments = useCallback(async () => {
    if (!selectedBookForComments) return;

    try {
      const res = await fetch(`/api/ehon/${selectedBookForComments.id}/comment`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      const comments: BookComment[] = await res.json();

      // コメント一覧と絵本リストの更新
      setBookComments(comments);
      setBookList((prev) =>
        prev.map((b) =>
          b.id === selectedBookForComments.id
            ? {
                ...b,
                comments: comments.slice(0, 2),
                _count: { ...b._count, comments: comments.length },
              }
            : b
        )
      );
    } catch (error) {
      console.error("Error refreshing comments:", error);
    }
  }, [selectedBookForComments]);

  // コメント追加
  const handleAddComment = async (bookId: number, text: string) => {
    try {
      const res = await fetch(`/api/ehon/${bookId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Failed to add comment");

      const newComment: BookComment = await res.json();

      // コメント一覧を更新
      setBookComments((prev) => [newComment, ...prev]);

      // 絵本リストのコメント数と最新コメントを更新
      setBookList((prev) =>
        prev.map((b) =>
          b.id === bookId
            ? {
                ...b,
                comments: [newComment, ...(b.comments || [])].slice(0, 2),
                _count: { ...b._count, comments: b._count.comments + 1 },
              }
            : b
        )
      );
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  };

  return (
    <Box py={2} bg="white">
      <Container maxW="container.xl">
        {/* フィルター */}
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
          onOpenCommentModal={handleOpenCommentModal}
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

        {/* コメントモーダル */}
        {selectedBookForComments && (
          <BookCommentModal
            isOpen={commentModalOpen}
            onClose={() => setCommentModalOpen(false)}
            bookId={selectedBookForComments.id}
            bookTitle={selectedBookForComments.title}
            comments={bookComments}
            onAddComment={handleAddComment}
            refreshComments={refreshComments}
            locale={locale}
          />
        )}
      </Container>
    </Box>
  );
}
