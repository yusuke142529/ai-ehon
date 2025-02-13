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
  useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { ChevronRightIcon } from "@chakra-ui/icons";
import { FaCheck } from "react-icons/fa";

// i18n
import { useTranslations } from "next-intl";

const MotionBox = motion(Box);

type TargetAgeDrawerSelectProps = {
  /** 現在選択中の対象年齢。"" の場合は未選択。 */
  selectedAge?: string;
  /** 対象年齢が変更された時に呼ばれるコールバック */
  onChange: (value: string) => void;
  /** ボタンや操作を無効化したい時 */
  disabled?: boolean;
  /** ★ Label を外部から指定したい場合（任意） */
  label?: string; // ← ここを追加
};

export default function TargetAgeDrawerSelect({
  selectedAge,
  onChange,
  disabled,
  label,
}: TargetAgeDrawerSelectProps) {
  const t = useTranslations("common");
  const { isOpen, onOpen, onClose } = useDisclosure();

  // i18n対応した対象年齢データ
  const targetAgeCategories = [
    {
      category: t("targetAgeCategoryTitle"), // ex: "対象年齢一覧"
      options: [
        { value: "", label: t("targetAgeOptionNone") }, // ex: "未選択"
        { value: "0-2才", label: t("age0_2") },
        { value: "3-5才", label: t("age3_5") },
        { value: "6-8才", label: t("age6_8") },
        { value: "9-12才", label: t("age9_12") },
        { value: "全年齢", label: t("ageAll") },
      ],
    },
  ];

  // 呼び出し元から label が来ていればそれを優先表示。なければデフォルト文言
  // 例: "対象年齢を選ぶ"
  let buttonLabel = label || t("btnSelectTargetAge");

  // すでに年齢が選択されていれば、"○○を選択中" のように表示
  if (selectedAge) {
    buttonLabel = t("selected", { value: selectedAge });
  }

  const handleSelect = (value: string) => {
    onChange(value);
    onClose();
  };

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
      {/* Drawerを開くボタン: disabled を連動 + label 表示 */}
      <Button
        size="sm"
        variant="outline"
        rightIcon={<ChevronRightIcon />}
        onClick={onOpen}
        isDisabled={disabled}
        sx={{
          transition: "all 0.2s",
          _hover: { transform: "translateY(-1px)", boxShadow: "md" },
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