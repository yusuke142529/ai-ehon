"use client";

import { useTranslations } from "next-intl";

/**
 * i18n対応: キャラクター(動物)オプション
 */
export function useCharacterOptions() {
  const t = useTranslations("character"); 
  // ↑ "character"というキー名でロケールファイルを用意した想定

  // Mammals (哺乳類)
  const mammals = [
    { value: "Cat",          label: t("cat") },
    { value: "Dog",          label: t("dog") },
    { value: "Fox",          label: t("fox") },
    { value: "Rabbit",       label: t("rabbit") },
    { value: "Raccoon",      label: t("raccoon") },
    { value: "Raccoon Dog",  label: t("raccoonDog") },
    { value: "Squirrel",     label: t("squirrel") },
    { value: "Deer",         label: t("deer") },
    { value: "Hedgehog",     label: t("hedgehog") },
    { value: "Mouse",        label: t("mouse") },
    { value: "Bear",         label: t("bear") },
    { value: "Wolf",         label: t("wolf") },
    { value: "Panda",        label: t("panda") },
    { value: "Koala",        label: t("koala") },
    { value: "Giraffe",      label: t("giraffe") },
    { value: "Elephant",     label: t("elephant") },
    { value: "Lion",         label: t("lion") },
    { value: "Tiger",        label: t("tiger") },
    { value: "Leopard",      label: t("leopard") },
    { value: "Cheetah",      label: t("cheetah") },
    { value: "Kangaroo",     label: t("kangaroo") },
    { value: "Horse",        label: t("horse") },
    { value: "Zebra",        label: t("zebra") },
    { value: "Donkey",       label: t("donkey") },
    { value: "Sheep",        label: t("sheep") },
    { value: "Pig",          label: t("pig") },
    { value: "Cow",          label: t("cow") },
    { value: "Goat",         label: t("goat") },
    { value: "Hamster",      label: t("hamster") },
    { value: "Monkey",       label: t("monkey") },
    { value: "Gorilla",      label: t("gorilla") },
    { value: "Chimpanzee",   label: t("chimpanzee") },
    { value: "Hippopotamus", label: t("hippopotamus") },
    { value: "Rhinoceros",   label: t("rhinoceros") },
    { value: "Bison",        label: t("bison") },
    { value: "Bat",          label: t("bat") },
  ];

  // Birds (鳥類)
  const birds = [
    { value: "Chicken", label: t("chicken") },
    { value: "Duck",    label: t("duck") },
    { value: "Goose",   label: t("goose") },
    { value: "Owl",     label: t("owl") },
    { value: "Eagle",   label: t("eagle") },
    { value: "Falcon",  label: t("falcon") },
    { value: "Penguin", label: t("penguin") },
  ];

  // Reptiles & Amphibians (爬虫類・両生類)
  const reptiles = [
    { value: "Snake",      label: t("snake") },
    { value: "Frog",       label: t("frog") },
    { value: "Crocodile",  label: t("crocodile") },
    { value: "Turtle",     label: t("turtle") },
  ];

  // Marine Mammals (海の哺乳類)
  const marineMammals = [
    { value: "Dolphin", label: t("dolphin") },
    { value: "Whale",   label: t("whale") },
    { value: "Seal",    label: t("seal") },
  ];

  // 動物グループ配列 (ラベルを i18n化)
  const animalGroups = [
    {
      value: "mammals",
      label: t("mammalsGroup"), // ex: "哺乳類 (Mammals)"
      animals: mammals,
    },
    {
      value: "birds",
      label: t("birdsGroup"), // ex: "鳥類 (Birds)"
      animals: birds,
    },
    {
      value: "reptiles",
      label: t("reptilesGroup"), // ex: "爬虫類・両生類 (Reptiles & Amphibians)"
      animals: reptiles,
    },
    {
      value: "marine",
      label: t("marineGroup"), // ex: "海の哺乳類 (Marine Mammals)"
      animals: marineMammals,
    },
  ];

  return {
    animalGroups,
  };
}