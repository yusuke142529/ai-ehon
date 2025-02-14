"use client";

import React from "react";
import {
  Box,
  Text,
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
import { useArtStyleOptions } from "@/constants/artStyleOptions";

const MotionBox = motion(Box);

type ArtStyleDrawerSelectProps = {
  // selectedCategory は削除
  selectedStyleId?: number;
  onChange: (category: string, styleId: number) => void;
  disabled?: boolean;
};

export default function ArtStyleDrawerSelect({
  selectedStyleId,
  onChange,
  disabled,
}: ArtStyleDrawerSelectProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const t = useTranslations("common");

  // useArtStyleOptions フックを利用して artStyles を取得
  const { artStyles } = useArtStyleOptions();

  // ボタンラベルを決定
  let buttonLabel = t("btnSelectArtStyle"); // 例: "アートスタイルを選ぶ"
  if (typeof selectedStyleId === "number") {
    const styleItem = artStyles.find((s) => s.id === selectedStyleId);
    if (styleItem) {
      buttonLabel = t("selected", { value: styleItem.label });
    }
  }

  // スタイル選択時のハンドラ
  const handleSelect = (styleId: number) => {
    onChange("default", styleId);
    onClose();
  };

  // useColorModeValue をトップレベルで呼び出して変数に格納
  const borderColorDefault = useColorModeValue("gray.200", "gray.600");
  const bgColor = useColorModeValue("whiteAlpha.900", "gray.700");
  const textColor = useColorModeValue("gray.800", "whiteAlpha.900");

  // アートスタイル一覧の描画
  const renderArtStyles = () => (
    <SimpleGrid columns={[2, 2, 3]} spacing={4}>
      {artStyles.map((style) => {
        const isSelected = selectedStyleId === style.id;
        return (
          <MotionBox
            key={style.id}
            position="relative"
            p={4}
            borderRadius="md"
            borderWidth={isSelected ? "2px" : "1.5px"}
            borderColor={isSelected ? "teal.500" : borderColorDefault}
            bg={bgColor}
            cursor="pointer"
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2 }}
            onClick={() => handleSelect(style.id)}
            _hover={{ boxShadow: "lg" }}
          >
            {isSelected && (
              <Box position="absolute" top="2" right="2" color="teal.500">
                <FaCheck />
              </Box>
            )}
            <Text fontSize="sm" fontWeight="semibold" color={textColor}>
              {style.label}
            </Text>
          </MotionBox>
        );
      })}
    </SimpleGrid>
  );

  return (
    <>
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
            {t("drawerTitleArtStyle")}
          </DrawerHeader>

          <DrawerBody>{renderArtStyles()}</DrawerBody>

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