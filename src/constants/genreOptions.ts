"use client";

import { useTranslations } from "next-intl";

/**
 * i18n対応: ジャンルオプション
 */
export function useGenreOptions() {
  const t = useTranslations("genre");

  const genreCategories = [
    {
      // 例: "ファンタジー・非日常"
      category: t("fantasyCategory"),
      options: [
        { value: "fantasy",   label: t("fantasy") },
        { value: "adventure", label: t("adventure") },
        { value: "mystery",   label: t("mystery") },
        { value: "comedy",    label: t("comedy") },
        { value: "horror",    label: t("horror") },
        { value: "romance",   label: t("romance") },
      ],
    },
    {
      // 例: "ハラハラ・ドキドキ"
      category: t("thrillingCategory"),
      options: [
        { value: "suspense_thriller", label: t("suspense_thriller") },
        { value: "hero",              label: t("hero") },
        { value: "robot_mecha",       label: t("robot_mecha") },
        { value: "fairy_tale_remake", label: t("fairy_tale_remake") },
        { value: "pirates",           label: t("pirates") },
        { value: "space_sci_fi",      label: t("space_sci_fi") },
      ],
    },
    {
      // 例: "不思議ワールド"
      category: t("mysteriousCategory"),
      options: [
        { value: "time_travel",         label: t("time_travel") },
        { value: "occult_supernatural", label: t("occult_supernatural") },
        { value: "battle_action",       label: t("battle_action") },
        { value: "fairy",               label: t("fairy") },
        { value: "daily_life_cozy",     label: t("daily_life_cozy") },
      ],
    },
  ];

  return {
    genreCategories,
  };
}