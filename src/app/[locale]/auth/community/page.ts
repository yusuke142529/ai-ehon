// src/app/[locale]/auth/community/page.tsx

import { prisma } from "@/lib/prismadb";
import Link from "next/link";
import { Box, Heading, Text, SimpleGrid } from "@chakra-ui/react";

/**
 * SSG 用に全ロケールの静的パスを生成
 * ここでは例として、"ja" と "en" をサポート
 */
export function generateStaticParams() {
  return [{ locale: "ja" }, { locale: "en" }];
}

/**
 * コミュニティ投稿一覧ページ
 * このページはサーバーコンポーネントとして実装されているため、
 * "use client" は記述せず、generateStaticParams() などサーバー機能を利用可能。
 */
export default async function CommunityPage({
  params: { locale },
}: {
  params: { locale: "ja" | "en" };
}) {
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
            <Text fontWeight="bold" mb={2}>
              {book.title}
            </Text>
            <Link href={`/${locale}/ehon/${book.id}/viewer`}>
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