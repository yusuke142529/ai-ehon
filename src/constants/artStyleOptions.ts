//src/constants/artStyleOptions.ts

"use client";

import { useTranslations } from "next-intl";

/**
 * i18n対応した「アートスタイル」定義
 * 
 * - 旧コードにあった animeStyles / pastelStyles を置き換え
 * - label は i18nキーから取得
 */
export function useArtStyleOptions() {
  const t = useTranslations("artStyle");

  // アニメ系スタイル (id: 1〜3)
  const animeStyles = [
    { id: 1, label: t("anime1") }, 
    { id: 2, label: t("anime2") },
    { id: 3, label: t("anime3") }
  ];

  // パステル・水彩系スタイル (id: 4〜13)
  const pastelStyles = [
    { id: 4,  label: t("pastel4") },
    { id: 5,  label: t("pastel5") },
    { id: 6,  label: t("pastel6") },
    { id: 7,  label: t("pastel7") },
    { id: 8,  label: t("pastel8") },
    { id: 9,  label: t("pastel9") },
    { id: 10, label: t("pastel10") },
    { id: 11, label: t("pastel11") },
    { id: 12, label: t("pastel12") },
    { id: 13, label: t("pastel13") }
  ];

  // カテゴリ配列
  const styleCategories = [
    {
      value: "anime",
      label: t("animeCategoryLabel"), // 例: "アニメ系スタイル"
      styles: animeStyles
    },
    {
      value: "pastel",
      label: t("pastelCategoryLabel"), // 例: "パステル・水彩系スタイル"
      styles: pastelStyles
    }
  ];

  return {
    styleCategories
  };
}