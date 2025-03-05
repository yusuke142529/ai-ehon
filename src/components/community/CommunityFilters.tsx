"use client";

import {
    Box,
    Flex,
    Select,
    Text,
    Heading,
    Badge,
    HStack,
    Tag,
    TagLabel,
    TagCloseButton,
    Divider,
    Collapse,
    Button,
    useDisclosure,
    useColorModeValue,
} from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { FaFilter, FaChevronDown, FaChevronUp } from "react-icons/fa";

interface CategoryOption {
    value: string;
    label: string;
    count: number;
}

interface CurrentFilters {
    category?: string;
    sort?: string;
    age?: string;
}

interface CommunityFiltersProps {
    categories: CategoryOption[];
    ageOptions: CategoryOption[];
    currentFilters: CurrentFilters;
    onFilterChange: (filterType: "category" | "sort" | "age", value: string | undefined) => void;
    totalCount: number;
    isLoading: boolean;
}

export default function CommunityFilters({
    categories,
    ageOptions,
    currentFilters,
    onFilterChange,
    totalCount,
    isLoading,
}: CommunityFiltersProps) {
    const t = useTranslations("Community");
    const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });

    const borderColor = useColorModeValue("gray.200", "gray.600");
    const bgColor = useColorModeValue("white", "gray.800");

    // ソートオプション
    const sortOptions = [
        { value: "latest", label: t("sortLatest") },
        { value: "popular", label: t("sortPopular") },
        { value: "title", label: t("sortTitle") },
    ];

    // カテゴリータグをクリックした時のハンドラ
    const handleCategoryClick = (category: string) => {
        if (currentFilters.category === category) {
            // 既に選択されている場合は解除
            onFilterChange("category", undefined);
        } else {
            // 新しく選択
            onFilterChange("category", category);
        }
    };

    // アクティブなフィルターの数を計算
    const activeFilterCount =
        (currentFilters.category ? 1 : 0) +
        (currentFilters.age ? 1 : 0) +
        (currentFilters.sort && currentFilters.sort !== "latest" ? 1 : 0);

    return (
        <Box
            mb={8}
            p={4}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="md"
            bg={bgColor}
            shadow="sm"
        >
            <Flex
                justify="space-between"
                align="center"
                onClick={onToggle}
                cursor="pointer"
                pb={2}
            >
                <HStack>
                    <Heading size="md">{t("filters")}</Heading>
                    {activeFilterCount > 0 && (
                        <Badge colorScheme="blue" fontSize="0.8em" borderRadius="full">
                            {activeFilterCount}
                        </Badge>
                    )}
                </HStack>

                <Flex align="center">
                    <Text color="gray.500" mr={2} fontSize="sm">
                        {t("totalBooks", { count: totalCount })}
                    </Text>
                    {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                </Flex>
            </Flex>

            <Collapse in={isOpen} animateOpacity>
                <Divider my={3} />

                {/* ソートコントロール */}
                <Flex
                    direction={{ base: "column", md: "row" }}
                    justify="space-between"
                    align={{ base: "flex-start", md: "center" }}
                    mb={4}
                    wrap="wrap"
                    gap={2}
                >
                    <Box flex="1" minW={{ base: "full", md: "200px" }}>
                        <Text fontSize="sm" fontWeight="medium" mb={1}>
                            {t("sortBy")}
                        </Text>
                        <Select
                            value={currentFilters.sort || "latest"}
                            onChange={(e) => onFilterChange("sort", e.target.value)}
                            size="sm"
                            isDisabled={isLoading}
                        >
                            {sortOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Select>
                    </Box>

                    <Box flex="1" minW={{ base: "full", md: "200px" }}>
                        <Text fontSize="sm" fontWeight="medium" mb={1}>
                            {t("ageFilter")}
                        </Text>
                        <Select
                            value={currentFilters.age || ""}
                            onChange={(e) =>
                                onFilterChange("age", e.target.value ? e.target.value : undefined)
                            }
                            size="sm"
                            placeholder={t("allAges")}
                            isDisabled={isLoading}
                        >
                            {ageOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label} ({option.count})
                                </option>
                            ))}
                        </Select>
                    </Box>

                    {/* フィルターリセットボタン */}
                    {activeFilterCount > 0 && (
                        <Button
                            size="sm"
                            variant="outline"
                            colorScheme="red"
                            onClick={() => {
                                onFilterChange("category", undefined);
                                onFilterChange("age", undefined);
                                onFilterChange("sort", "latest");
                            }}
                            isDisabled={isLoading}
                            leftIcon={<FaFilter />}
                        >
                            {t("resetFilters")}
                        </Button>
                    )}
                </Flex>

                {/* カテゴリータグ */}
                <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={2}>
                        {t("categories")}
                    </Text>
                    <Flex wrap="wrap" gap={2}>
                        {categories.map((category) => (
                            <Tag
                                key={category.value}
                                size="md"
                                variant={currentFilters.category === category.value ? "solid" : "subtle"}
                                colorScheme={currentFilters.category === category.value ? "blue" : "gray"}
                                cursor="pointer"
                                onClick={() => handleCategoryClick(category.value)}
                                _hover={{ opacity: 0.8 }}
                            >
                                <TagLabel>
                                    {category.label} ({category.count})
                                </TagLabel>
                                {currentFilters.category === category.value && (
                                    <TagCloseButton
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onFilterChange("category", undefined);
                                        }}
                                    />
                                )}
                            </Tag>
                        ))}
                    </Flex>
                </Box>
            </Collapse>
        </Box>
    );
}