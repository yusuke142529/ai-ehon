//src/components/ThemeDrawerSelect.tsx

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
import { useThemeOptions } from "@/constants/themeOptions"; // i18nフックでテーマ一覧を取得

const MotionBox = motion(Box);

type ThemeDrawerSelectProps = {
  selectedTheme?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export default function ThemeDrawerSelect({
  selectedTheme,
  onChange,
  disabled,
}: ThemeDrawerSelectProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const t = useTranslations("common");
  const { themeCategories } = useThemeOptions();

  // Hooksをトップレベルで呼び出し、結果を変数に格納
  const catBg = useColorModeValue("gray.50", "gray.800");
  const headingBorderColor = useColorModeValue("gray.300", "gray.600");
  const defaultBorderColor = useColorModeValue("gray.200", "gray.600");
  const cardBg = useColorModeValue("whiteAlpha.900", "gray.700");
  const textColor = useColorModeValue("gray.800", "whiteAlpha.900");

  // ボタンのラベル
  let buttonLabel = t("btnSelectTheme");
  if (selectedTheme) {
    buttonLabel = t("selected", { value: selectedTheme });
  }

  // テーマをクリックして選択
  const handleSelect = (value: string) => {
    onChange(value);
    onClose();
  };

  // テーマカテゴリの描画
  const renderThemeCategories = () => {
    return themeCategories.map((cat) => (
      <Box key={cat.category} mb={6} bg={catBg} p={2} borderRadius="md">
        <Heading
          size="sm"
          mb={2}
          borderBottomWidth="1px"
          borderColor={headingBorderColor}
          pb={1}
        >
          {cat.category}
        </Heading>
        <SimpleGrid columns={[2, 3, 4]} spacing={4}>
          {cat.options.map((opt) => {
            const isSelected = opt.value === selectedTheme;
            return (
              <MotionBox
                key={opt.value}
                position="relative"
                p={4}
                borderRadius="md"
                borderWidth={isSelected ? "2px" : "1.5px"}
                borderColor={isSelected ? "teal.500" : defaultBorderColor}
                bg={cardBg}
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
                  color={textColor}
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
      {/* ボタンに isDisabled={disabled} を渡す */}
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
            {t("drawerTitleTheme")}
          </DrawerHeader>

          <DrawerBody>{renderThemeCategories()}</DrawerBody>

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
