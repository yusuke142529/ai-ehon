// src/components/community/CommunityHero.tsx
"use client";

import { Box, Container, Heading, Text } from "@chakra-ui/react";

interface CommunityHeroProps {
  locale: string;
  translations: {
    title: string;
    subtitle: string;
  };
}

export default function CommunityHero({ translations }: CommunityHeroProps) {
  return (
    <Box 
      pt={{ base: 8, md: 12 }} 
      pb={{ base: 6, md: 8 }}
      bg="white"
      position="relative"
    >
      <Container maxW="container.xl" position="relative" zIndex={1}>
        {/* シンプル化されたヘッダー */}
        <Box textAlign="center" mb={4}>
          <Heading
            as="h1"
            fontSize={{ base: "2xl", md: "3xl" }}
            fontWeight="bold"
            color="blue.600"
            mb={3}
          >
            {translations.title}
          </Heading>
          
          <Text
            fontSize={{ base: "md", md: "lg" }}
            textAlign="center"
            color="gray.600"
            maxW="700px"
            mx="auto"
          >
            {translations.subtitle}
          </Text>
        </Box>
      </Container>
    </Box>
  );
}