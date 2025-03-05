"use client";

import { useState } from "react";
import { Box, Container, useToast } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

// コンポーネントをインポート
import CommunityFilters from "./CommunityFilters";
import CommunityBookGrid from "./CommunityBookGrid";
import CommunityPagination from "./CommunityPagination";

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

interface CategoryOption {
    value: string;
    label: string;
    count: number;
}

interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

interface CurrentFilters {
    category?: string;
    sort?: string;
    age?: string;
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
        filterType: 'category' | 'sort' | 'age',
        value: string | undefined
    ) => {
        setIsLoading(true);

        // 現在のフィルターから新しいURLパラメータを作成
        const newParams = new URLSearchParams();

        // 既存のフィルターを適用
        if (currentFilters.category && filterType !== 'category') {
            newParams.set('category', currentFilters.category);
        }
        if (currentFilters.sort && filterType !== 'sort') {
            newParams.set('sort', currentFilters.sort);
        }
        if (currentFilters.age && filterType !== 'age') {
            newParams.set('age', currentFilters.age);
        }

        // 新しいフィルター値を適用（undefined の場合はその条件を削除）
        if (value && filterType === 'category') {
            newParams.set('category', value);
        }
        if (value && filterType === 'sort') {
            newParams.set('sort', value);
        }
        if (value && filterType === 'age') {
            newParams.set('age', value);
        }

        // ページは1にリセット (フィルター変更時)
        newParams.set('page', '1');

        // URLナビゲーション
        router.push(`/${locale}/community?${newParams.toString()}`);
    };

    // ページ変更時の処理
    const handlePageChange = (newPage: number) => {
        setIsLoading(true);

        const newParams = new URLSearchParams();

        // 既存のフィルターを保持
        if (currentFilters.category) {
            newParams.set('category', currentFilters.category);
        }
        if (currentFilters.sort) {
            newParams.set('sort', currentFilters.sort);
        }
        if (currentFilters.age) {
            newParams.set('age', currentFilters.age);
        }

        // 新しいページ番号を設定
        newParams.set('page', newPage.toString());

        // URL移動
        router.push(`/${locale}/community?${newParams.toString()}`);
    };

    // いいね機能のハンドラ
    const handleToggleLike = async (bookId: number) => {
        try {
            // いいね状態をクライアントサイドで即時更新（楽観的UI更新）
            setLikedBooks(prev => ({
                ...prev,
                [bookId]: !prev[bookId]
            }));

            // APIリクエスト
            const res = await fetch(`/api/ehon/${bookId}/favorite`, {
                method: 'POST',
            });

            if (!res.ok) {
                // 失敗時は状態を元に戻す
                setLikedBooks(prev => ({
                    ...prev,
                    [bookId]: !prev[bookId]
                }));
                throw new Error('Failed to toggle like');
            }

            // 成功メッセージ
            const data = await res.json();
            toast({
                title: data.isFavorite ? t("likeAdded") : t("likeRemoved"),
                status: data.isFavorite ? "success" : "info",
                duration: 2000,
                isClosable: true,
            });

        } catch (error) {
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
                <CommunityFilters
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