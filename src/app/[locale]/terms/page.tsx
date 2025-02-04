"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Heading,
  Text,
  Link as ChakraLink,
  IconButton,
  Collapse,
  Flex,
  VStack,
  useColorModeValue
} from "@chakra-ui/react";
import { ChevronDownIcon, ChevronUpIcon, ArrowUpIcon } from "@chakra-ui/icons";

// スムーズスクロール用
const scrollToId = (id: string) => {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
  }
};

export default function TermsPage() {
  const t = useTranslations("termsPage");

  // sections は配列 → t.raw
  const sections = t.raw("sections") as Array<{
    heading: string;
    content: string;
  }>;

  const title = t("title");
  const updatedAt = t("updatedAt");

  // アコーディオン開閉の管理
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const handleToggle = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  const containerBg = useColorModeValue("white", "gray.800");
  const headingColor = useColorModeValue("gray.800", "whiteAlpha.900");

  return (
    <Box
      id="topOfPage"
      minH="100vh"
      bg={containerBg}
      display="flex"
      flexDirection="column"
    >
      <Box flex="1">
        <Box maxW="800px" mx="auto" pt={10} pb={4} px={{ base: 4, md: 6 }}>
          {/* ページタイトル */}
          <Heading as="h1" size="xl" mb={2} textAlign="center" color={headingColor}>
            {title}
          </Heading>
          <Text fontSize="sm" color="gray.500" mb={6} textAlign="center">
            {updatedAt}
          </Text>

          {/* === 目次 / TOC === */}
          <Box
            bg={useColorModeValue("gray.50", "gray.700")}
            p={3}
            borderRadius="md"
            mb={6}
          >
            <Heading as="h3" size="sm" mb={2}>
              {t("tocTitle") || "目次"}
            </Heading>
            <VStack align="start" spacing={1}>
              {sections.map((sec, idx) => (
                <ChakraLink
                  key={idx}
                  onClick={() => scrollToId(`terms-section-${idx}`)}
                  color={useColorModeValue("blue.600", "blue.300")}
                  fontSize="sm"
                  _hover={{ textDecoration: "underline" }}
                  cursor="pointer"
                >
                  {sec.heading}
                </ChakraLink>
              ))}
            </VStack>
          </Box>

          {/* === セクション本文 (アコーディオン) === */}
          {sections.map((sec, idx) => {
            const isOpen = openIndex === idx;
            return (
              <Box key={idx} mb={6} id={`terms-section-${idx}`}>
                <Flex
                  align="center"
                  justify="space-between"
                  cursor="pointer"
                  bg={useColorModeValue("gray.100", "gray.600")}
                  p={3}
                  borderRadius="md"
                  _hover={{ bg: useColorModeValue("gray.200", "gray.500") }}
                  onClick={() => handleToggle(idx)}
                >
                  <Heading as="h2" size="sm">
                    {sec.heading}
                  </Heading>
                  {isOpen ? (
                    <ChevronUpIcon boxSize={5} color="blue.400" />
                  ) : (
                    <ChevronDownIcon boxSize={5} color="blue.400" />
                  )}
                </Flex>

                <Collapse in={isOpen} animateOpacity>
                  <Box
                    p={3}
                    mt={2}
                    bg={useColorModeValue("gray.50", "gray.700")}
                    borderRadius="md"
                  >
                    <Text whiteSpace="pre-wrap" fontSize="sm">
                      {sec.content}
                    </Text>
                  </Box>
                </Collapse>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Back to top ボタン */}
      <IconButton
        aria-label="Back to top"
        icon={<ArrowUpIcon />}
        position="fixed"
        bottom={10}
        right={10}
        colorScheme="blue"
        onClick={() => scrollToId("topOfPage")}
      />
    </Box>
  );
}