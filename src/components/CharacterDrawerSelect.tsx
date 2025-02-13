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
import { FaDragon, FaCheck } from "react-icons/fa";
import { useTranslations } from "next-intl";

// 静的 import を削除し、useCharacterOptions フックを使用
import { useCharacterOptions } from "@/constants/characterOptions";

const MotionBox = motion(Box);

/**
 * CharacterDrawerSelectProps に `disabled?: boolean;` を追加
 */
type CharacterDrawerSelectProps = {
  selectedCharacter?: string;
  onChange: (value: string) => void;
  disabled?: boolean; // ← ここがポイント
};

export default function CharacterDrawerSelect({
  selectedCharacter,
  onChange,
  disabled,
}: CharacterDrawerSelectProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const t = useTranslations("common");

  // i18n化された動物グループ配列を取得
  const { animalGroups } = useCharacterOptions();

  // ボタン表示ラベルを切り替え
  let buttonLabel = t("btnSelectCharacter"); 
  if (selectedCharacter) {
    buttonLabel = t("selected", { value: selectedCharacter });
  }

  // 動物(キャラクター)をクリックして選択
  const handleSelect = (value: string) => {
    onChange(value);
    onClose();
  };

  // 動物グループを描画
  const renderAnimalGroups = () => {
    return animalGroups.map((group) => (
      <Box
        key={group.value}
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
          {group.label}
        </Heading>
        <SimpleGrid columns={[2, 3, 4]} spacing={4}>
          {group.animals.map((animal) => {
            const isSelected = animal.value === selectedCharacter;
            return (
              <MotionBox
                key={animal.value}
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
                onClick={() => handleSelect(animal.value)}
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
                  {animal.label}
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
      {/* 受け取った disabled を isDisabled に連動させる */}
      <Button
        size="sm"
        variant="outline"
        leftIcon={<FaDragon />}
        rightIcon={<ChevronRightIcon />}
        onClick={onOpen}
        isDisabled={disabled} // ← ここがポイント
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
            {t("drawerTitleCharacter")} 
            {/* ex: "キャラクターを選ぶ" */}
          </DrawerHeader>

          <DrawerBody>{renderAnimalGroups()}</DrawerBody>

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