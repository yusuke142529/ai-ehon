"use client";

import { useTranslations } from "next-intl";

/**
 * i18n対応: テーマオプション
 */
export function useThemeOptions() {
  const t = useTranslations("theme");

  const themeCategories = [
    {
      // 例: "愛・友情・助け合い"
      category: t("loveCategory"),
      options: [
        { value: "love",               label: t("love") },
        { value: "friendship",         label: t("friendship") },
        { value: "helping_each_other", label: t("helping_each_other") },
        { value: "parent_child_bond",  label: t("parent_child_bond") },
        { value: "greetings_manners",  label: t("greetings_manners") },
        { value: "honesty_sincerity",  label: t("honesty_sincerity") },
      ],
    },
    {
      // 例: "心の成長・内面"
      category: t("heartGrowthCategory"),
      options: [
        { value: "courage",            label: t("courage") },
        { value: "kindness",           label: t("kindness") },
        { value: "hope",               label: t("hope") },
        { value: "gratitude",          label: t("gratitude") },
        { value: "diversity",          label: t("diversity") },
        { value: "selfesteem",         label: t("selfesteem") },
        { value: "laughter_humor",     label: t("laughter_humor") },
        { value: "words_communication",label: t("words_communication") },
        { value: "inner_growth",       label: t("inner_growth") },
        { value: "thank_you_feeling",  label: t("thank_you_feeling") },
        { value: "awareness",          label: t("awareness") },
      ],
    },
    {
      // 例: "挑戦・学び・創造"
      category: t("challengeLearningCategory"),
      options: [
        { value: "curiosity_inquiry", label: t("curiosity_inquiry") },
        { value: "challenge_failure", label: t("challenge_failure") },
        { value: "artistic_sense",    label: t("artistic_sense") },
        { value: "freedom_of_idea",   label: t("freedom_of_idea") },
        { value: "travel_adventure",  label: t("travel_adventure") },
        { value: "joy_of_learning",   label: t("joy_of_learning") },
        { value: "caution_bravery",   label: t("caution_bravery") },
      ],
    },
    {
      // 例: "社会・世界とのつながり"
      category: t("societyCategory"),
      options: [
        { value: "harmony_with_nature",    label: t("harmony_with_nature") },
        { value: "cultural_understanding", label: t("cultural_understanding") },
        { value: "respect_for_life",       label: t("respect_for_life") },
        { value: "cooperation",           label: t("cooperation") },
        { value: "future_hope",           label: t("future_hope") },
      ],
    },
  ];

  return {
    themeCategories,
  };
}