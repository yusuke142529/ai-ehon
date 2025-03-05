// src/app/[locale]/auth/community/page.tsx

import { prisma } from "@/lib/prismadb";
import Link from "next/link";
import Image from "next/image";
import { Box, Heading, Text, SimpleGrid } from "@chakra-ui/react";
import { BookStatus } from "@prisma/client";

/**
 * SSG 用に全ロケールの静的パスを生成
 * "ja" と "en" を例としてサポート
 */
export function generateStaticParams() {
  return [{ locale: "ja" }, { locale: "en" }];
}

/**
 * コミュニティ投稿一覧ページ (サーバーコンポーネント)
 */
export default async function CommunityPage({
  params: { locale },
}: {
  params: { locale: "ja" | "en" };
}) {
  // communityAt != null かつ PUBLIC でない絵本を新しい順に一覧取得
  const books = await prisma.book.findMany({
    where: {
      communityAt: {
        not: null,
      },
      status: {
        not: BookStatus.PUBLIC // PUBLIC 状態の絵本を除外
      }
    },
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
      <Heading size="lg" mb={6}>
        コミュニティ投稿一覧
      </Heading>
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
                <Image
                  src={book.coverImageUrl}
                  alt={book.title}
                  width={400}
                  height={300}
                  style={{ height: "auto", width: "100%" }}
                />
              ) : (
                <Box bg="gray.200" height="150px">
                  {/* No cover image */}
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