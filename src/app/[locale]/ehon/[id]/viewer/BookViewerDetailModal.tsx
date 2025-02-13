"use client";

import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  Heading,
  SimpleGrid,
  Box,
  Tooltip,
  IconButton,
  useBreakpointValue,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FaHeart, FaRegHeart } from "react-icons/fa";

// i18n 用フック
import { useArtStyleOptions } from "@/constants/artStyleOptions";
import { useThemeOptions } from "@/constants/themeOptions";
import { useGenreOptions } from "@/constants/genreOptions";
import { useCharacterOptions } from "@/constants/characterOptions";
import { useTranslations } from "next-intl";

type BookDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  bookId: number;
  title: string;
  theme?: string;
  genre?: string;
  characters?: string;
  // artStyleCategory 削除、artStyleId のみ管理
  artStyleId?: number;
  targetAge?: string;
  pageCount?: number;
  createdAt?: string;
  isFavorite?: boolean;
  /**
   * ★ locale を受け取れるようにする（オプション）
   */
  locale?: string;
};

const heartVariants = {
  unchecked: {
    scale: 1,
  },
  checked: {
    scale: [1, 1.4, 1],
    transition: { duration: 0.3 },
  },
};

const MotionIconButton = motion(IconButton);

export default function BookViewerDetailModal({
  isOpen,
  onClose,
  bookId,
  title,
  theme,
  genre,
  characters,
  artStyleId,
  targetAge,
  pageCount,
  createdAt,
  isFavorite,
  locale,
}: BookDetailModalProps) {
  const t = useTranslations("common");
  const [favorite, setFavorite] = useState<boolean>(!!isFavorite);

  const modalSize = useBreakpointValue({ base: "sm", md: "md", lg: "lg" });
  const overlayBg = useColorModeValue("rgba(0,0,0,0.4)", "rgba(0,0,0,0.6)");
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const toast = useToast();

  // 各種オプション取得（単一配列として artStyles を取得）
  const { themeCategories } = useThemeOptions();
  const { genreCategories } = useGenreOptions();
  const { artStyles } = useArtStyleOptions();
  const { animalGroups } = useCharacterOptions();

  function getThemeLabel(themeValue?: string) {
    if (!themeValue) return t("notSet");
    for (const cat of themeCategories) {
      for (const opt of cat.options) {
        if (opt.value === themeValue) {
          return opt.label;
        }
      }
    }
    return themeValue;
  }

  function getGenreLabel(genreValue?: string) {
    if (!genreValue) return t("notSet");
    for (const cat of genreCategories) {
      for (const opt of cat.options) {
        if (opt.value === genreValue) {
          return opt.label;
        }
      }
    }
    return genreValue;
  }

  function getCharacterLabel(charValue?: string) {
    if (!charValue) return t("notSet");
    for (const group of animalGroups) {
      for (const animal of group.animals) {
        if (animal.value === charValue) {
          return animal.label;
        }
      }
    }
    return charValue;
  }

  function getArtStyleLabel(styleId?: number) {
    if (!styleId) return t("notSet");
    const styleObj = artStyles.find((s) => s.id === styleId);
    if (!styleObj) return t("notSet");
    return styleObj.label;
  }

  const themeLabel = getThemeLabel(theme);
  const genreLabel = getGenreLabel(genre);
  const characterLabel = getCharacterLabel(characters);
  const artStyleLabel = getArtStyleLabel(artStyleId);

  const dataList = [
    { label: t("creationDate"), value: createdAt || t("notSet") },
    { label: t("themeLabel"), value: themeLabel },
    { label: t("genreLabel"), value: genreLabel },
    { label: t("characterLabel"), value: characterLabel },
    { label: t("artStyleLabel"), value: artStyleLabel },
    { label: t("targetAgeLabel"), value: targetAge || t("notSet") },
    {
      label: t("pageCountLabel"),
      value: pageCount ? t("pages", { count: pageCount }) : t("notSet"),
    },
  ];

  const handleToggleFavorite = async () => {
    try {
      if (!bookId) throw new Error("bookId is missing");
      const res = await fetch(`/api/ehon/${bookId}/favorite`, { method: "POST" });
      if (!res.ok) {
        throw new Error(`Failed. Status=${res.status}`);
      }
      const result = await res.json();
      if (result.ok) {
        setFavorite(result.isFavorite);
        toast({
          description: result.isFavorite
            ? t("favoriteAdded")
            : t("favoriteRemoved"),
          status: result.isFavorite ? "success" : "info",
          duration: 2000,
          isClosable: true,
        });
      } else {
        throw new Error("API returned failure");
      }
    } catch (err) {
      console.error(err);
      toast({
        description: t("favoriteRegisterError"),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={modalSize}
      isCentered
      closeOnOverlayClick
    >
      <ModalOverlay bg={overlayBg} />
      <ModalContent borderRadius="md" overflow="hidden">
        <ModalHeader
          px={4}
          py={2}
          borderBottomWidth="1px"
          fontSize="md"
          fontWeight="semibold"
        >
          {t("bookDetail")}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody px={4} py={3}>
          <Box mb={3}>
            <Heading as="h2" fontSize="lg" mb={1}>
              {title}
            </Heading>
            {favorite && (
              <Text fontSize="sm" color="pink.500">
                {t("favoriteAlready")}
              </Text>
            )}
            {locale && (
              <Text fontSize="xs" color="gray.500">
                Locale: {locale}
              </Text>
            )}
          </Box>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
            {dataList.map((item, idx) => (
              <Box key={idx}>
                <Text fontSize="xs" fontWeight="bold" color={labelColor} mb={1}>
                  {item.label}
                </Text>
                <Text fontSize="sm" lineHeight="shorter">
                  {item.value}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </ModalBody>
        <ModalFooter
          display="flex"
          justifyContent="space-between"
          px={4}
          py={2}
          borderTopWidth="1px"
        >
          <Button variant="outline" size="sm" onClick={onClose}>
            {t("close")}
          </Button>
          <Tooltip
            label={favorite ? t("removeFavoriteTooltip") : t("addFavoriteTooltip")}
            hasArrow
            placement="top"
          >
            <MotionIconButton
              aria-label={
                favorite ? t("removeFavoriteTooltip") : t("addFavoriteTooltip")
              }
              icon={favorite ? <FaHeart /> : <FaRegHeart />}
              colorScheme={favorite ? "pink" : "gray"}
              variant="solid"
              size="md"
              color={favorite ? "red.500" : "white"}
              whileTap={{ scale: 0.9 }}
              variants={heartVariants}
              animate={favorite ? "checked" : "unchecked"}
              onClick={handleToggleFavorite}
            />
          </Tooltip>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}