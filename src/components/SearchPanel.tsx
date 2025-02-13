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
  useColorModeValue,
  Icon,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb
} from "@chakra-ui/react";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { FaDragon } from "react-icons/fa";
import { BsBook, BsFillFileEarmarkTextFill } from "react-icons/bs";
import { MdOutlinePalette } from "react-icons/md";
import { GiAges } from "react-icons/gi";
import { useTranslations } from "next-intl";

// DrawerSelect 各種
import CharacterDrawerSelect from "./CharacterDrawerSelect";
import ThemeDrawerSelect from "./ThemeDrawerSelect";
import GenreDrawerSelect from "./GenreDrawerSelect";

// 修正: カテゴリ廃止 → ArtStyleDrawerSelect は artStyleId のみ管理する仕様に変更
import ArtStyleDrawerSelect from "./ArtStyleDrawerSelect";
import TargetAgeDrawerSelect from "./TargetAgeDrawerSelect";

/** 検索パラメータ型 */
export type SearchParams = {
  theme?: string;
  genre?: string;
  characters?: string;
  artStyleId?: string;       // 数値を文字列化 (例: "1", "10")
  pageCount?: string;        // 1〜30
  targetAge?: string;
  onlyFavorite?: boolean;
};

type SearchPanelProps = {
  onSearch: (params: SearchParams) => void;
  isLoading?: boolean;
};

export default function SearchPanel({ onSearch, isLoading }: SearchPanelProps) {
  const t = useTranslations("common");

  const { isOpen: isDetailOpen, onToggle: onDetailToggle } = useDisclosure();

  // ▼ 基本検索
  const [selectedTheme, setSelectedTheme] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [onlyFavorite, setOnlyFavorite] = useState(false);

  // ▼ 詳細検索
  const [selectedCharacter, setSelectedCharacter] = useState("");

  // 修正: アートスタイルは artStyleId のみ管理する
  const [artStyleId, setArtStyleId] = useState<number | undefined>(undefined);

  // ページ数: 0=未選択, 1〜30=指定
  const [pageCount, setPageCount] = useState(0);

  // 対象年齢: ""=未選択
  const [targetAge, setTargetAge] = useState("");

  // 検索実行
  const handleSearch = () => {
    onSearch({
      theme: selectedTheme || undefined,
      genre: selectedGenre || undefined,
      characters: selectedCharacter || undefined,
      artStyleId: artStyleId != null ? String(artStyleId) : undefined,
      pageCount: pageCount === 0 ? undefined : String(pageCount),
      targetAge: targetAge || undefined,
      onlyFavorite
    });
  };

  // リセット
  const handleReset = () => {
    setSelectedTheme("");
    setSelectedGenre("");
    setOnlyFavorite(false);
    setSelectedCharacter("");
    setArtStyleId(undefined);
    setPageCount(0);
    setTargetAge("");
    onSearch({});
  };

  return (
    <Box
      mb={6}
      p={4}
      borderRadius="md"
      bg={useColorModeValue("gray.50", "gray.800")}
      boxShadow="sm"
    >
      {/* タイトル */}
      <Heading size="md" mb={3} display="flex" alignItems="center" gap={2}>
        <Icon as={BsBook} />
        {t("searchHeading")}
      </Heading>

      {/* 基本検索 (テーマ・ジャンル・お気に入り) */}
      <Flex wrap="wrap" align="flex-end" gap={4} mb={3}>
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

        {/* お気に入り */}
        <Box display="flex" alignItems="center" gap={2}>
          <Checkbox
            size="sm"
            colorScheme="pink"
            isChecked={onlyFavorite}
            onChange={(e) => setOnlyFavorite(e.target.checked)}
          />
          <Text fontSize="sm">{t("searchFavoriteOnly")}</Text>
        </Box>

        {/* 検索ボタン */}
        <Button
          size="sm"
          colorScheme="blue"
          onClick={handleSearch}
          isLoading={isLoading}
          sx={{
            transition: "all 0.2s ease",
            _hover: { transform: "translateY(-1px)", boxShadow: "md" }
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
            _hover: { transform: "translateY(-1px)", boxShadow: "md" }
          }}
        >
          {t("searchBtnReset")}
        </Button>

        {/* 詳細検索トグル */}
        <Button
          size="sm"
          variant="ghost"
          rightIcon={isDetailOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          onClick={onDetailToggle}
          sx={{
            transition: "all 0.2s ease",
            _hover: { transform: "translateY(-1px)", boxShadow: "md" }
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

          {/* アートスタイル (修正: カテゴリ廃止、artStyleId のみ) */}
          <Box mb={4}>
            <FormLabel fontSize="sm" display="flex" alignItems="center" gap={1}>
              <Icon as={MdOutlinePalette} />
              {t("searchLabelArtStyle")}
            </FormLabel>
            <ArtStyleDrawerSelect
              selectedCategory="" // カテゴリは不要なため空文字を指定
              selectedStyleId={artStyleId}
              onChange={(_unusedCategory, id) => setArtStyleId(id)}
            />
          </Box>

          {/* ページ数: 0=未選択 */}
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
                _hover: { transform: "translateY(-1px)", boxShadow: "md" }
              }}
            >
              <SliderTrack bg="pink.100">
                <SliderFilledTrack bg="pink.300" />
              </SliderTrack>
              <SliderThumb boxSize={4} />
            </Slider>
          </Box>

          {/* 対象年齢 (ドロワー) */}
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