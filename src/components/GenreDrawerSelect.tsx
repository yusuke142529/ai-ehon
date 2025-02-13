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

// ★ 変更: 静的 `genreCategories` import を削除し、フックを呼ぶ
import { useGenreOptions } from "@/constants/genreOptions";

const MotionBox = motion(Box);

/** GenreDrawerSelectProps に disabled?: boolean を追加 */
type GenreDrawerSelectProps = {
  selectedGenre?: string;
  onChange: (value: string) => void;
  disabled?: boolean; // ← ここが重要
};

export default function GenreDrawerSelect({
  selectedGenre,
  onChange,
  disabled,
}: GenreDrawerSelectProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const t = useTranslations("common");

  // i18nフックでジャンルカテゴリを取得
  const { genreCategories } = useGenreOptions();

  // ボタンのラベル
  let buttonLabel = t("btnSelectGenre"); // 例: "ジャンルを選ぶ"
  if (selectedGenre) {
    // 例: "○○ を選択中"
    buttonLabel = t("selected", { value: selectedGenre });
  }

  // ジャンルをクリックして選択
  const handleSelect = (value: string) => {
    onChange(value);
    onClose();
  };

  // ジャンルカテゴリの描画
  const renderGenreCategories = () => {
    return genreCategories.map((cat) => (
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
            const isSelected = opt.value === selectedGenre;
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
      {/* isDisabled={disabled} を追加し、無効化を反映 */}
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
          <DrawerHeader borderBottomWidth="1px">
            {t("drawerTitleGenre")} 
            {/* 例: "ジャンルを選ぶ" */}
          </DrawerHeader>

          <DrawerBody>{renderGenreCategories()}</DrawerBody>

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