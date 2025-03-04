import { Metadata } from "next";
import { prisma } from "@/lib/prismadb";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Box, Container, Button, Text } from "@chakra-ui/react";
import { BookStatus } from "@prisma/client";

// 公式ビューワーをインポート (多言語対応フックを使用するコンポーネント)
import BookViewerClient from "@/app/[locale]/ehon/[id]/viewer/BookViewerClient";

/**
 * 動的メタデータ生成
 */
export async function generateMetadata({
  params,
}: {
  params: { locale: string; id: string };
}): Promise<Metadata> {
  const bookId = Number(params.id);

  if (isNaN(bookId)) {
    return {
      title: "絵本が見つかりません",
      description: "無効な絵本IDが指定されました",
    };
  }

  // 公開絵本のみ検索
  const book = await prisma.book.findFirst({
    where: {
      id: bookId,
      status: BookStatus.PUBLIC,
    },
    include: {
      pages: {
        where: { pageNumber: 0 },
        select: { imageUrl: true },
      },
      user: {
        select: { name: true },
      },
    },
  });

  if (!book) {
    return {
      title: "絵本が見つかりません",
      description: "この絵本は存在しないか、公開されていません",
    };
  }

  const coverImage = book.pages[0]?.imageUrl || "/images/default-cover.png";

  const title = `${book.title} | AIえほんメーカー`;
  const description = `${book.user.name}さんが作成した絵本です`;
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/${params.locale}/share/${bookId}`;

  return {
    title,
    description,
    openGraph: {
      title: book.title,
      description,
      images: [coverImage],
      type: "book",
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: book.title,
      description,
      images: [coverImage],
    },
  };
}

/**
 * メインのページコンポーネント
 */
export default async function SharedBookPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const { locale, id } = params;
  const bookId = Number(id);

  if (isNaN(bookId)) {
    return notFound();
  }

  // 公開状態の絵本のみ取得
  const book = await prisma.book.findFirst({
    where: {
      id: bookId,
      status: BookStatus.PUBLIC,
    },
    include: {
      pages: {
        orderBy: { pageNumber: "asc" },
      },
    },
  });

  // 404相当
  if (!book) {
    return (
      <Container maxW="container.md" py={20} textAlign="center">
        <Text mb={8}>この絵本は存在しないか、公開されていません。</Text>
        <Button as={Link} href={`/${locale}`} colorScheme="blue">
          トップページへ戻る
        </Button>
      </Container>
    );
  }

  // FlipBookViewer で使うページデータへ整形
  const sortedPages = book.pages.map((page) => ({
    id: page.id,
    pageNumber: page.pageNumber,
    text: page.text,
    imageUrl: page.imageUrl,
  }));

  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      {/* メインコンテンツ - 公式ビューワーを使用 */}
      <Box flex="1" display="flex" flexDirection="column">
        <BookViewerClient
          pages={sortedPages}
          bookTitle={book.title}
          bookId={bookId}
          isSharedView={true} // 共有ビューモード
        />
      </Box>

      {/* 最小限のフッター */}
      <Box
        py={3}
        textAlign="center"
        borderTop="1px solid"
        borderColor="gray.200"
        bg="white"
      >
        <Text fontSize="sm" color="gray.500" mb={2}>
          AIえほんメーカーで作成された絵本です
        </Text>
        <Button as={Link} href={`/${locale}`} size="sm" colorScheme="blue">
          あなたも絵本を作ってみませんか？
        </Button>
      </Box>
    </Box>
  );
}