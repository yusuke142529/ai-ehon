// src/constants/artStyleOptions.ts

"use client";

import { useTranslations } from "next-intl";

/**
 * i18n対応した「アートスタイル」定義
 * 
 * - 単一配列に11のスタイルを集約
 * - label は i18nキー (style1, style2, ... style11) から取得
 */
export function useArtStyleOptions() {
  const t = useTranslations("artStyle");

  // 単一配列で全スタイルを管理
  const artStyles = [
    { id: 1,  label: t("style1") },  // 例: "アニメ風 (Anime Style)"
    { id: 2,  label: t("style2") },  // 例: "漫画風 (Manga Style)"
    { id: 3,  label: t("style3") },  // 例: "油絵 (Oil Painting Style)"
    { id: 4,  label: t("style4") },  // 例: "水彩画 (Watercolor Style)"
    { id: 5,  label: t("style5") },  // 例: "フォトリアル (Photorealistic Style)"
    { id: 6,  label: t("style6") },  // 例: "CG風 (CG Style)"
    { id: 7,  label: t("style7") },  // 例: "ピクセルアート (Pixel Art Style)"
    { id: 8,  label: t("style8") },  // 例: "ポップアート (Pop Art Style)"
    { id: 9,  label: t("style9") },  // 例: "水墨画 (Ink Wash Style)"
    { id: 10, label: t("style10") }, // 例: "チャコール・鉛筆スケッチ (Charcoal / Pencil Sketch Style)"
    { id: 11, label: t("style11") }, // 例: "パステル画 (Pastel Style)"
  ];

  // 単一配列をそのまま返す
  return {
    artStyles,
  };
}