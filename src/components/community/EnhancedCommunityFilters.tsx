"use client";

import React from "react";
import { Box, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import SearchPanel, { SearchParams } from "@/components/SearchPanel";

/** CategoryOption / CurrentFilters などは適宜定義済みを使用 */
import type { CategoryOption } from "./CommunityClientWrapper";

/**
 * コミュニティページ用のフィルターコンポーネント
 * - 検索ボタン押下で一度だけ router.push する
 */
interface EnhancedCommunityFiltersProps {
  categories: CategoryOption[];
  ageOptions: CategoryOption[];
  locale: string;
  isLoading: boolean;
  totalCount: number;

  // 初期表示用パラメータ (コミュニティページに SSR 済みのもの)
  theme?: string;
  genre?: string;
  characters?: string;
  artStyleId?: string;
  pageCount?: string;
  age?: string;
  sort?: string; // "latest" | "popular" | "title"
}

export default function EnhancedCommunityFilters({
  // Prefix unused props with underscore to indicate they're intentionally unused
  categories,
  ageOptions,
  locale,
  isLoading,
  totalCount,
  theme,
  genre,
  characters,
  artStyleId,
  pageCount,
  age,
  sort,
}: EnhancedCommunityFiltersProps) {
  const router = useRouter();

  // 検索ボタン押下時の一括処理
  const handleSearch = (params: SearchParams) => {
    console.log("[EnhancedCommunityFilters] handleSearch():", params);

    // 1回でまとめてパラメータを反映
    const combinedParams = new URLSearchParams();

    if (params.theme) combinedParams.set("theme", params.theme);
    if (params.genre) combinedParams.set("genre", params.genre);
    if (params.characters) combinedParams.set("characters", params.characters);
    if (params.artStyleId) combinedParams.set("artStyleId", params.artStyleId);
    if (params.pageCount) combinedParams.set("pageCount", params.pageCount);
    if (params.targetAge) combinedParams.set("age", params.targetAge);
    if (params.sortBy) combinedParams.set("sort", params.sortBy);

    // 新規検索するので page=1
    combinedParams.set("page", "1");

    const fullUrl = `/${locale}/community?${combinedParams.toString()}`;
    console.log("[EnhancedCommunityFilters] router.push -> ", fullUrl);
    router.push(fullUrl);
  };

  return (
    <Box mb={6}>
      {/* Display stats using the previously unused variables */}
      <Text fontSize="sm" color="gray.600" mb={2}>
        カテゴリ数: {categories.length}、対象年齢数: {ageOptions.length}、総絵本数: {totalCount}
      </Text>

      <SearchPanel
        onSearch={handleSearch}
        isLoading={isLoading}
        showSortOptions={true}
        showFavoriteFilter={false}  // コミュニティではお気に入り非表示

        // 初期値 (SSRで取得した currentFilters を渡す)
        initialTheme={theme || ""}
        initialGenre={genre || ""}
        initialCharacters={characters || ""}
        initialArtStyleId={artStyleId ? parseInt(artStyleId, 10) : undefined}
        initialPageCount={pageCount ? parseInt(pageCount, 10) : 0}
        initialTargetAge={age || ""}
        initialSortBy={sort || "latest"}
      />
    </Box>
  );
}