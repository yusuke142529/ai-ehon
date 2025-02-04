// src/app/community/page.tsx
import { prisma } from "@/lib/prismadb";
import Link from "next/link";
import { Box, Heading, Text, SimpleGrid } from "@chakra-ui/react";

export default async function CommunityPage() {
  // isCommunity=true の絵本を新しい順に一覧取得
  const books = await prisma.book.findMany({
    where: { isCommunity: true },
    orderBy: { communityAt: "desc" },
    select: {
      id: true,
      title: true,
      coverImageUrl: true,
      userId: true,
      communityAt: true,
    },
  });

  return (
    <Box p={4}>
      <Heading size="lg" mb={6}>コミュニティ投稿一覧</Heading>
      {books.length === 0 && <Text>まだ投稿された絵本はありません。</Text>}

      <SimpleGrid columns={[1, 2, 3]} spacing={4}>
        {books.map((book) => (
          <Box
            key={book.id}
            borderWidth="1px"
            borderRadius="md"
            overflow="hidden"
            p={4}
          >
            <Box mb={2}>
              {book.coverImageUrl ? (
                <img
                  src={book.coverImageUrl}
                  alt={book.title}
                  style={{ maxWidth: "100%", height: "auto" }}
                />
              ) : (
                <Box bg="gray.200" height="150px">
                  {/* no cover */}
                </Box>
              )}
            </Box>
            <Text fontWeight="bold" mb={2}>{book.title}</Text>
            {/* ここでユーザー名を表示したいなら Book -> user -> name を JOIN */}
            <Link href={`/ehon/${book.id}/viewer`}>
              <Text color="blue.600" textDecoration="underline">
                この絵本を読む
              </Text>
            </Link>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}