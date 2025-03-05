"use client";

import { Box, Container, Heading, Text, Flex, Badge, SimpleGrid, Button, useColorModeValue } from "@chakra-ui/react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { FaHeart } from "react-icons/fa";

const MotionBox = motion(Box);
const MotionHeading = motion(Heading);
const MotionText = motion(Text);
const MotionFlex = motion(Flex);

interface FeaturedBook {
    id: number;
    title: string;
    coverImageUrl?: string | null;
    user: {
        name: string | null;
    };
    _count: {
        likes: number;
    };
}

interface CommunityHeroProps {
    featuredBooks: FeaturedBook[];
    locale: string;
    translations: {
        title: string;
        subtitle: string;
        featured: string;
        viewAll: string;
        by: string;
        likes: string;
    };
}

export default function CommunityHero({ featuredBooks, locale, translations }: CommunityHeroProps) {
    const bgGradient = useColorModeValue(
        "linear(to-b, blue.100, blue.50, white)",
        "linear(to-b, blue.900, gray.800)"
    );

    const cardBg = useColorModeValue("white", "gray.700");
    const textColor = useColorModeValue("gray.700", "white");
    const subtitleColor = useColorModeValue("gray.600", "gray.300");

    return (
        <Box
            pt={{ base: 12, md: 20 }}
            pb={{ base: 10, md: 16 }}
            bgGradient={bgGradient}
            position="relative"
            overflow="hidden"
        >
            {/* 装飾用の背景要素 */}
            <Box
                position="absolute"
                top={0}
                right={0}
                bottom={0}
                left={0}
                bg="url(/images/community-pattern.svg) repeat"
                opacity={0.05}
                zIndex={0}
            />

            <Container maxW="container.xl" position="relative" zIndex={1}>
                {/* メインヘッダー */}
                <Flex direction="column" align="center" mb={{ base: 8, md: 12 }}>
                    <MotionHeading
                        as="h1"
                        fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
                        fontWeight="bold"
                        textAlign="center"
                        color={textColor}
                        mb={4}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        {translations.title}
                    </MotionHeading>

                    <MotionText
                        fontSize={{ base: "lg", md: "xl" }}
                        textAlign="center"
                        color={subtitleColor}
                        maxW="700px"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        {translations.subtitle}
                    </MotionText>
                </Flex>

                {/* 注目コンテンツセクション */}
                {featuredBooks.length > 0 && (
                    <Box mt={8}>
                        <Flex justify="space-between" align="center" mb={4}>
                            <Heading size="md" color={textColor}>
                                {translations.featured}
                            </Heading>
                            <Link href={`/${locale}/community?sort=popular`} passHref>
                                <Button size="sm" variant="outline" colorScheme="blue">
                                    {translations.viewAll}
                                </Button>
                            </Link>
                        </Flex>

                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                            {featuredBooks.map((book, idx) => (
                                <MotionFlex
                                    key={book.id}
                                    bg={cardBg}
                                    borderRadius="lg"
                                    overflow="hidden"
                                    shadow="md"
                                    direction="column"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.1 * idx }}
                                    _hover={{ transform: "translateY(-4px)", shadow: "lg" }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Box position="relative" height="200px" width="100%">
                                        {book.coverImageUrl ? (
                                            <Image
                                                src={book.coverImageUrl}
                                                alt={book.title}
                                                fill
                                                style={{ objectFit: "cover" }}
                                            />
                                        ) : (
                                            <Box bg="gray.200" height="full" width="full" />
                                        )}
                                        <Badge
                                            position="absolute"
                                            top={2}
                                            right={2}
                                            colorScheme="pink"
                                            display="flex"
                                            alignItems="center"
                                            px={2}
                                            py={1}
                                        >
                                            <FaHeart size={12} style={{ marginRight: '4px' }} />
                                            {book._count.likes}
                                        </Badge>
                                    </Box>

                                    <Box p={4} flex="1">
                                        <Heading size="md" mb={2} noOfLines={1}>
                                            {book.title}
                                        </Heading>
                                        <Text fontSize="sm" color="gray.500" mb={3}>
                                            {translations.by} {book.user.name || "Unknown"}
                                        </Text>
                                        <Link href={`/${locale}/ehon/${book.id}/viewer`} passHref>
                                            <Button colorScheme="blue" size="sm" width="full">
                                                読む
                                            </Button>
                                        </Link>
                                    </Box>
                                </MotionFlex>
                            ))}
                        </SimpleGrid>
                    </Box>
                )}
            </Container>
        </Box>
    );
}