"use client";

import { Box, Container, Flex, Skeleton, SkeletonText, SimpleGrid } from "@chakra-ui/react";

export default function LoadingFallback() {
    return (
        <Box py={8}>
            <Container maxW="container.xl">
                {/* フィルターのスケルトン */}
                <Skeleton height="100px" width="100%" mb={8} borderRadius="md" />

                {/* 絵本グリッドのスケルトン */}
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6} mb={8}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Flex
                            key={i}
                            direction="column"
                            borderWidth="1px"
                            borderRadius="md"
                            overflow="hidden"
                        >
                            <Skeleton height="200px" width="100%" />
                            <Box p={4}>
                                <SkeletonText mt={2} noOfLines={2} spacing="2" />
                                <SkeletonText mt={4} noOfLines={1} spacing="2" />
                            </Box>
                            <Skeleton height="40px" mt="auto" />
                        </Flex>
                    ))}
                </SimpleGrid>

                {/* ページネーションのスケルトン */}
                <Flex justify="center" mt={8}>
                    <Skeleton height="40px" width="300px" />
                </Flex>
            </Container>
        </Box>
    );
}