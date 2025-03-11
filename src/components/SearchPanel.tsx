"use client";

import React, { useState } from "react";
import {
  Box,
  Heading,
  FormLabel,
  Checkbox,
  Button,
  Text,
  Flex,
  useDisclosure,
  Collapse,
  Icon,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Select,
  useColorModeValue,
} from "@chakra-ui/react";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { FaDragon } from "react-icons/fa";
import { BsBook, BsFillFileEarmarkTextFill } from "react-icons/bs";
import { MdOutlinePalette, MdTrendingUp } from "react-icons/md";
import { GiAges } from "react-icons/gi";
import { useTranslations } from "next-intl";

// DrawerSelect
import CharacterDrawerSelect from "./CharacterDrawerSelect";
import ThemeDrawerSelect from "./ThemeDrawerSelect";
import GenreDrawerSelect from "./GenreDrawerSelect";
import ArtStyleDrawerSelect from "./ArtStyleDrawerSelect";
import TargetAgeDrawerSelect from "./TargetAgeDrawerSelect";

/** 検索パラメータ型 */
export type SearchParams = {
  theme?: string;
  genre?: string;
  characters?: string;
  artStyleId?: string;
  pageCount?: string;
  targetAge?: string;
  onlyFavorite?: boolean;
  sortBy?: string; // (latest, popular, title)
};

type SearchPanelProps = {
  onSearch: (params: SearchParams) => void;
  isLoading?: boolean;
  showSortOptions?: boolean;
  showFavoriteFilter?: boolean;

  initialTheme?: string;
  initialGenre?: string;
  initialCharacters?: string;
  initialArtStyleId?: number;
  initialPageCount?: number;
  initialTargetAge?: string;
  initialSortBy?: string;
};

export default function SearchPanel({
  onSearch,
  isLoading = false,
  showSortOptions = false,
  showFavoriteFilter = true,

  initialTheme = "",
  initialGenre = "",
  initialCharacters = "",
  initialArtStyleId,
  initialPageCount,
  initialTargetAge = "",
  initialSortBy = "latest",
}: SearchPanelProps) {
  const t = useTranslations("common");
  
  // useDisclosure から isDetailOpen, onDetailToggle を取得
  const { isOpen: isDetailOpen, onToggle: onDetailToggle } = useDisclosure();

  // 色
  const containerBg = useColorModeValue("gray.50", "gray.800");
  const sortBoxBorderColor = useColorModeValue("blue.300", "blue.600");
  const sortBoxTextColor = useColorModeValue("blue.600", "blue.200");
  const sortSelectBorderColor = useColorModeValue("blue.200", "blue.500");
  const sortSelectFocusColor = useColorModeValue("blue.400", "blue.300");
  const sortSelectTextColor = useColorModeValue("blue.800", "blue.100");
  const sortSelectBg = useColorModeValue("white", "blue.700");
  const sortSelectHoverBorderColor = useColorModeValue("blue.300", "blue.400");

  // ステート
  const [selectedTheme, setSelectedTheme] = useState(initialTheme);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [onlyFavorite, setOnlyFavorite] = useState(false);

  const [selectedCharacter, setSelectedCharacter] = useState(initialCharacters);
  const [artStyleId, setArtStyleId] = useState<number | undefined>(initialArtStyleId);
  const [pageCount, setPageCount] = useState(initialPageCount ?? 0);
  const [targetAge, setTargetAge] = useState(initialTargetAge);
  const [sortBy, setSortBy] = useState(initialSortBy);

  // 検索ボタン
  const handleSearch = () => {
    const params: SearchParams = {
      theme: selectedTheme || undefined,
      genre: selectedGenre || undefined,
      characters: selectedCharacter || undefined,
      artStyleId: artStyleId != null ? String(artStyleId) : undefined,
      pageCount: pageCount === 0 ? undefined : String(pageCount),
      targetAge: targetAge || undefined,
    };

    if (showFavoriteFilter) {
      params.onlyFavorite = onlyFavorite;
    }
    if (showSortOptions) {
      params.sortBy = sortBy;
    }

    console.log("[SearchPanel] handleSearch ->", params);
    onSearch(params);
  };

  // リセットボタン
  const handleReset = () => {
    setSelectedTheme("");
    setSelectedGenre("");
    setSelectedCharacter("");
    setArtStyleId(undefined);
    setPageCount(0);
    setTargetAge("");

    if (showFavoriteFilter) {
      setOnlyFavorite(false);
    }
    if (showSortOptions) {
      setSortBy("latest");
    }

    console.log("[SearchPanel] handleReset -> {}");
    onSearch({});
  };

  return (
    <Box mb={6} p={4} borderRadius="md" bg={containerBg} boxShadow="sm">
      {/* タイトル */}
      <Heading size="md" mb={3} display="flex" alignItems="center" gap={2}>
        <Icon as={BsBook} />
        {t("searchHeading")}
      </Heading>

      {/* 基本検索 */}
      <Flex wrap="wrap" align="flex-end" gap={4} mb={3}>
        {showSortOptions && (
          <Box
            borderWidth="1px"
            borderColor={sortBoxBorderColor}
            borderRadius="md"
            px={2}
            py={1}
          >
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color={sortBoxTextColor}
              display="flex"
              alignItems="center"
              gap={1}
              mb={1}
            >
              <Icon as={MdTrendingUp} boxSize={4} />
              {t("communitySortBy", { defaultValue: "並び順" })}
            </Text>
            <Select
              size="sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              borderColor={sortSelectBorderColor}
              focusBorderColor={sortSelectFocusColor}
              fontWeight="medium"
              color={sortSelectTextColor}
              bg={sortSelectBg}
              _hover={{ borderColor: sortSelectHoverBorderColor }}
              _focus={{ boxShadow: "0 0 0 1px #4299E1" }}
            >
              <option value="latest">
                {t("communitySortLatest", { defaultValue: "新着順" })}
              </option>
              <option value="popular">
                {t("communitySortPopular", { defaultValue: "人気順" })}
              </option>
              <option value="title">
                {t("communitySortTitle", { defaultValue: "タイトル順" })}
              </option>
            </Select>
          </Box>
        )}

        {/* テーマ */}
        <Box>
          <FormLabel fontSize="xs" color="gray.500" mb={1}>
            {t("searchLabelTheme")}
          </FormLabel>
          <ThemeDrawerSelect
            selectedTheme={selectedTheme}
            onChange={(val) => setSelectedTheme(val)}
          />
        </Box>

        {/* ジャンル */}
        <Box>
          <FormLabel fontSize="xs" color="gray.500" mb={1}>
            {t("searchLabelGenre")}
          </FormLabel>
          <GenreDrawerSelect
            selectedGenre={selectedGenre}
            onChange={(val) => setSelectedGenre(val)}
          />
        </Box>

        {/* お気に入り (コミュニティでは非表示) */}
        {showFavoriteFilter && (
          <Box display="flex" alignItems="center" gap={2}>
            <Checkbox
              size="sm"
              colorScheme="pink"
              isChecked={onlyFavorite}
              onChange={(e) => setOnlyFavorite(e.target.checked)}
            />
            <Text fontSize="sm">{t("searchFavoriteOnly")}</Text>
          </Box>
        )}

        {/* 検索ボタン */}
        <Button
          size="sm"
          colorScheme="blue"
          onClick={handleSearch}
          isLoading={isLoading}
          sx={{
            transition: "all 0.2s ease",
            _hover: { transform: "translateY(-1px)", boxShadow: "md" },
          }}
        >
          {t("searchBtnSearch")}
        </Button>

        {/* リセットボタン */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleReset}
          sx={{
            transition: "all 0.2s ease",
            _hover: { transform: "translateY(-1px)", boxShadow: "md" },
          }}
        >
          {t("searchBtnReset")}
        </Button>

        {/* 詳細検索トグル */}
        <Button
          size="sm"
          variant="ghost"
          rightIcon={isDetailOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          onClick={onDetailToggle}  // ← 修正: ここを onDetailToggle に
          sx={{
            transition: "all 0.2s ease",
            _hover: { transform: "translateY(-1px)", boxShadow: "md" },
          }}
        >
          {isDetailOpen ? t("searchDetailClose") : t("searchDetailOpen")}
        </Button>
      </Flex>

      {/* 詳細検索 */}
      <Collapse in={isDetailOpen} animateOpacity>
        <Box p={3} borderWidth="1px" borderRadius="md" mb={3}>
          {/* キャラクター */}
          <Box mb={4}>
            <FormLabel fontSize="sm" display="flex" alignItems="center" gap={1}>
              <Icon as={FaDragon} />
              {t("searchLabelCharacter")}
            </FormLabel>
            <CharacterDrawerSelect
              selectedCharacter={selectedCharacter}
              onChange={(val) => setSelectedCharacter(val)}
            />
          </Box>

          {/* アートスタイル */}
          <Box mb={4}>
            <FormLabel fontSize="sm" display="flex" alignItems="center" gap={1}>
              <Icon as={MdOutlinePalette} />
              {t("searchLabelArtStyle")}
            </FormLabel>
            <ArtStyleDrawerSelect
              selectedStyleId={artStyleId}
              onChange={(_cat, id) => setArtStyleId(id)}
            />
          </Box>

          {/* ページ数 */}
          <Box mb={4}>
            <FormLabel fontSize="sm" display="flex" alignItems="center" gap={1}>
              <Icon as={BsFillFileEarmarkTextFill} />
              {t("searchLabelPages")}
            </FormLabel>
            <Text fontSize="sm" mb={2}>
              {pageCount === 0
                ? t("noSelection")
                : t("searchLabelPagesUnit", { count: pageCount })}
            </Text>
            <Slider
              min={0}
              max={30}
              step={1}
              value={pageCount}
              onChange={(val) => setPageCount(val)}
              focusThumbOnChange={false}
              sx={{
                transition: "all 0.2s",
                _hover: { transform: "translateY(-1px)", boxShadow: "md" },
              }}
            >
              <SliderTrack bg="pink.100">
                <SliderFilledTrack bg="pink.300" />
              </SliderTrack>
              <SliderThumb boxSize={4} />
            </Slider>
          </Box>

          {/* 対象年齢 */}
          <Box>
            <FormLabel fontSize="sm" display="flex" alignItems="center" gap={1}>
              <Icon as={GiAges} />
              {t("searchLabelTargetAge")}
            </FormLabel>
            <TargetAgeDrawerSelect
              selectedAge={targetAge}
              onChange={(val) => setTargetAge(val)}
              label={t("searchLabelTargetAge")}
            />
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}
