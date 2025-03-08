"use client";

import React from "react";
import { Box, Text } from "@chakra-ui/react";
// import { useTranslations } from "next-intl";

import SearchPanel, { SearchParams } from "@/components/SearchPanel";
import type { CategoryOption, CurrentFilters } from "./CommunityClientWrapper"; 
// ↑ CommunityClientWrapper.tsx で export した型を取り込み

interface EnhancedCommunityFiltersProps {
  categories: CategoryOption[];
  ageOptions: CategoryOption[];
  currentFilters: CurrentFilters;
  onFilterChange: (filterType: keyof CurrentFilters, value: string | undefined) => void;
  totalCount: number;
  isLoading: boolean;
}

/**
 * EnhancedCommunityFilters - コミュニティページ用のフィルターコンポーネント
 * SearchPanel.tsx を活用した簡略化バージョン
 */
export default function EnhancedCommunityFilters({
  currentFilters,
  onFilterChange,
  isLoading,
  categories,
  ageOptions,
  totalCount,
}: EnhancedCommunityFiltersProps) {

  // SearchPanel からの検索パラメータを受け取った時のハンドラ
  const handleSearch = (params: SearchParams) => {
    if (params.theme !== undefined) {
      onFilterChange("theme", params.theme);
    }
    if (params.genre !== undefined) {
      onFilterChange("genre", params.genre);
    }
    if (params.characters !== undefined) {
      onFilterChange("character", params.characters);
    }
    if (params.artStyleId !== undefined) {
      onFilterChange("artStyleId", params.artStyleId);
    }
    if (params.pageCount !== undefined) {
      onFilterChange("pageCount", params.pageCount);
    }
    if (params.targetAge !== undefined) {
      onFilterChange("age", params.targetAge);
    }
    if (params.sortBy !== undefined) {
      onFilterChange("sort", params.sortBy);
    }

    // コミュニティページでは「onlyFavorite」は無視する想定
  };

  return (
    <Box mb={6}>
      {/* categories, ageOptions, totalCount を使って簡単な統計情報を表示 */}
      <Text fontSize="sm" color="gray.600" mb={2}>
        カテゴリ数: {categories.length}、対象年齢数: {ageOptions.length}、総絵本数: {totalCount}
      </Text>

      <SearchPanel
        onSearch={handleSearch}
        isLoading={isLoading}
        showSortOptions={true}
        showFavoriteFilter={false}  // コミュニティではお気に入りフィルタ非表示

        // currentFilters の値を SearchPanel の初期状態に渡す
        initialTheme={currentFilters.theme}
        initialGenre={currentFilters.genre}
        initialCharacters={currentFilters.character}
        initialArtStyleId={
          currentFilters.artStyleId
            ? parseInt(currentFilters.artStyleId, 10)
            : undefined
        }
        initialPageCount={
          currentFilters.pageCount
            ? parseInt(currentFilters.pageCount, 10)
            : 0
        }
        initialTargetAge={currentFilters.age}
        initialSortBy={currentFilters.sort}
      />
    </Box>
  );
}
