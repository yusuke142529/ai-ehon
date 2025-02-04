"use client";

import React from "react";
import {
  Box,
  Text,
  Heading,
  Button,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerFooter,
  SimpleGrid,
  useDisclosure,
  useColorModeValue
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { ChevronRightIcon } from "@chakra-ui/icons";
import { FaCheck } from "react-icons/fa";

// i18n
import { useTranslations } from "next-intl";

const MotionBox = motion(Box);

/** 
 * コンポーネントのProps
 * @param selectedAge 現在選択中の対象年齢。"" の場合は未選択。
 * @param onChange    対象年齢が変更された時に呼ばれるコールバック
 */
type TargetAgeDrawerSelectProps = {
  selectedAge?: string;
  onChange: (value: string) => void;
};

export default function TargetAgeDrawerSelect({
  selectedAge,
  onChange
}: TargetAgeDrawerSelectProps) {
  const t = useTranslations("common");

  const { isOpen, onOpen, onClose } = useDisclosure();

  // Drawer を開くボタンの表示文言
  let buttonLabel = t("btnSelectTargetAge"); // 例: "対象年齢を選ぶ"
  if (selectedAge) {
    buttonLabel = t("selected", { value: selectedAge });
  }

  // i18n対応した対象年齢データ
  // value は実際の内部値、label は翻訳キーで取得
  const targetAgeCategories = [
    {
      category: t("targetAgeCategoryTitle"), // ex: "対象年齢一覧"
      options: [
        { value: "",      label: t("targetAgeOptionNone") }, // ex: "未選択"
        { value: "0-2才", label: t("age0_2") },
        { value: "3-5才", label: t("age3_5") },
        { value: "6-8才", label: t("age6_8") },
        { value: "9-12才", label: t("age9_12") },
        { value: "全年齢", label: t("ageAll") }
      ]
    }
  ];

  // ユーザーがどれかをクリックしたとき
  const handleSelect = (value: string) => {
    onChange(value);
    onClose();
  };

  // 対象年齢カテゴリを描画
  const renderTargetAgeCategories = () => {
    return targetAgeCategories.map((cat) => (
      <Box
        key={cat.category}
        mb={6}
        bg={useColorModeValue("gray.50", "gray.800")}
        p={2}
        borderRadius="md"
      >
        <Heading
          size="sm"
          mb={2}
          borderBottomWidth="1px"
          borderColor={useColorModeValue("gray.300", "gray.600")}
          pb={1}
        >
          {cat.category}
        </Heading>
        <SimpleGrid columns={[2, 3, 4]} spacing={4}>
          {cat.options.map((opt) => {
            const isSelected = opt.value === selectedAge;
            return (
              <MotionBox
                key={opt.value}
                position="relative"
                p={4}
                borderRadius="md"
                borderWidth={isSelected ? "2px" : "1.5px"}
                borderColor={
                  isSelected
                    ? "teal.500"
                    : useColorModeValue("gray.200", "gray.600")
                }
                bg={useColorModeValue("whiteAlpha.900", "gray.700")}
                cursor="pointer"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.2 }}
                onClick={() => handleSelect(opt.value)}
                _hover={{ boxShadow: "lg" }}
              >
                {isSelected && (
                  <Box position="absolute" top="2" right="2" color="teal.500">
                    <FaCheck />
                  </Box>
                )}
                <Text
                  fontSize="sm"
                  fontWeight="semibold"
                  color={useColorModeValue("gray.800", "whiteAlpha.900")}
                >
                  {opt.label}
                </Text>
              </MotionBox>
            );
          })}
        </SimpleGrid>
      </Box>
    ));
  };

  return (
    <>
      {/* Drawerを開くボタン */}
      <Button
        size="sm"
        variant="outline"
        rightIcon={<ChevronRightIcon />}
        onClick={onOpen}
        sx={{
          transition: "all 0.2s",
          _hover: { transform: "translateY(-1px)", boxShadow: "md" }
        }}
      >
        {buttonLabel}
      </Button>

      <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          {/* Drawerタイトル */}
          <DrawerHeader borderBottomWidth="1px">
            {t("drawerTitleTargetAge")}
            {/* 例: "対象年齢を選ぶ" */}
          </DrawerHeader>

          {/* メイン */}
          <DrawerBody>{renderTargetAgeCategories()}</DrawerBody>

          {/* フッター */}
          <DrawerFooter borderTopWidth="1px">
            <Button variant="outline" mr={3} onClick={onClose}>
              {t("drawerCancel")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}