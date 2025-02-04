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
import { useTranslations } from "next-intl";

// ★ 変更: 静的な styleCategories import を削除し、useArtStyleOptions を使用
import { useArtStyleOptions } from "@/constants/artStyleOptions";

const MotionBox = motion(Box);

type ArtStyleDrawerSelectProps = {
  /** 選択中のカテゴリ (例: "anime", "pastel") */
  selectedCategory: string;
  /** 選択中のスタイルID (例: 1, 2, 10...) */
  selectedStyleId?: number;
  /** ユーザーがスタイルを選択したときに呼ばれるコールバック */
  onChange: (category: string, styleId: number) => void;
};

export default function ArtStyleDrawerSelect({
  selectedCategory,
  selectedStyleId,
  onChange,
}: ArtStyleDrawerSelectProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const t = useTranslations("common");

  // ▼ i18n後のアートスタイル配列を取得
  const { styleCategories } = useArtStyleOptions();

  // ドロワーを開くボタンの表示文言
  let buttonLabel = t("btnSelectArtStyle");  // "アートスタイルを選ぶ"
  if (selectedCategory && typeof selectedStyleId === "number") {
    // 選択中ラベルを探す
    const catObj = styleCategories.find((c) => c.value === selectedCategory);
    const styleItem = catObj?.styles.find((s) => s.id === selectedStyleId);
    if (styleItem) {
      buttonLabel = t("selected", { value: styleItem.label });
    }
  }

  // スタイルをクリックしたらカテゴリ + ID を親に返す
  const handleSelect = (catValue: string, styleIdNum: number) => {
    onChange(catValue, styleIdNum);
    onClose();
  };

  // styleCategories をカテゴリ単位で描画
  const renderStyleCategories = () => {
    return styleCategories.map((cat) => (
      <Box
        key={cat.value}
        mb={6}
        p={2}
        bg={useColorModeValue("gray.50", "gray.800")}
        borderRadius="md"
      >
        <Heading
          size="sm"
          mb={2}
          borderBottomWidth="1px"
          borderColor={useColorModeValue("gray.300", "gray.600")}
          pb={1}
        >
          {cat.label}
        </Heading>

        <SimpleGrid columns={[2, 2, 3]} spacing={4}>
          {cat.styles.map((sty) => {
            const isSelected =
              cat.value === selectedCategory && sty.id === selectedStyleId;

            return (
              <MotionBox
                key={sty.id}
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
                onClick={() => handleSelect(cat.value, sty.id)}
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
                  {sty.label}
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
      {/* ドロワーを開くボタン */}
      <Button
        size="sm"
        variant="outline"
        rightIcon={<ChevronRightIcon />}
        onClick={onOpen}
        sx={{
          transition: "all 0.2s",
          _hover: { transform: "translateY(-1px)", boxShadow: "md" },
        }}
      >
        {buttonLabel}
      </Button>

      {/* ドロワーコンポーネント */}
      <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            {t("drawerTitleArtStyle")}
            {/* "アートスタイルを選ぶ" */}
          </DrawerHeader>

          <DrawerBody>{renderStyleCategories()}</DrawerBody>

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