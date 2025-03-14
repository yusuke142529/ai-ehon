import { Suspense } from "react";
import { prisma } from "@/lib/prismadb";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { BookStatus, Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CommunityHero from "@/components/community/CommunityHero";
import CommunityClientWrapper from "@/components/community/CommunityClientWrapper";
import LoadingFallback from "@/components/LoadingFallback";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Community" });
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
    openGraph: {
      title: t("pageTitle"),
      description: t("pageDescription"),
      images: ["/images/community-share.jpg"],
    },
  };
}

/**
 * ※ generateStaticParams() はここでは削除
 *    layout.tsx 側で `[locale]` パラメータを静的化するため
 */

// export function generateStaticParams() {
//   return [{ locale: "ja" }, { locale: "en" }];
// }

export default async function CommunityPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // 1) 認証チェック
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    const callbackUrl = encodeURIComponent(`/${locale}/community`);
    return redirect(`/${locale}/auth/login?callbackUrl=${callbackUrl}`);
  }

  // サポート外ロケールなら 404
  if (!["ja", "en"].includes(locale)) {
    return notFound();
  }

  const t = await getTranslations({ locale, namespace: "Community" });

  // パラメータ取得
  const getStringParam = (key: string) =>
    typeof searchParams[key] === "string" ? (searchParams[key] as string) : undefined;

  // 各フィルタ
  const sort = getStringParam("sort") || "latest";
  const age = getStringParam("age");
  const characters = getStringParam("characters"); // "characters" で統一
  const artStyleId = getStringParam("artStyleId");
  const pageCount = getStringParam("pageCount");
  const theme = getStringParam("theme");
  const genre = getStringParam("genre");
  const page = typeof searchParams.page === "string" ? parseInt(searchParams.page, 10) : 1;

  const pageSize = 12;
  const skip = (page - 1) * pageSize;

  // 2) Where 条件の構築
  const whereCondition: Prisma.BookWhereInput = {
    status: BookStatus.COMMUNITY,
    communityAt: { not: null },
    deletedAt: null,
  };

  if (theme) whereCondition.theme = theme;
  if (genre) whereCondition.genre = genre;
  if (age) whereCondition.targetAge = age;
  if (characters) {
    whereCondition.characters = characters;
  }
  if (artStyleId) {
    const styleIdNum = parseInt(artStyleId, 10);
    if (!isNaN(styleIdNum)) {
      whereCondition.artStyleId = styleIdNum;
    }
  }
  if (pageCount) {
    const countNum = parseInt(pageCount, 10);
    if (!isNaN(countNum)) {
      whereCondition.pageCount = countNum;
    }
  }

  // 3) ソート条件
  type OrderByOption =
    | { communityAt: "desc" }
    | { likes: { _count: "desc" } }
    | { title: "asc" };

  let orderBy: OrderByOption = { communityAt: "desc" };

  if (sort === "popular") {
    orderBy = { likes: { _count: "desc" } }; // いいね数多い順
  } else if (sort === "title") {
    orderBy = { title: "asc" };
  }

  // 4) DB検索
  const totalCount = await prisma.book.count({
    where: whereCondition,
  });

  const books = await prisma.book.findMany({
    where: whereCondition,
    orderBy,
    skip,
    take: pageSize,
    select: {
      id: true,
      title: true,
      coverImageUrl: true,
      communityAt: true,
      theme: true,
      genre: true,
      targetAge: true,
      artStyleId: true,
      pages: {
        orderBy: { pageNumber: "asc" },
        select: {
          pageNumber: true,
          imageUrl: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
      // 最新2件コメント
      comments: {
        take: 2,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          text: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  // 5) カテゴリ・年齢集計
  const genres = await prisma.book.groupBy({
    by: ["genre"],
    where: {
      status: BookStatus.COMMUNITY,
      communityAt: { not: null },
      genre: { not: null },
    },
    _count: true,
    orderBy: {
      _count: { genre: "desc" },
    },
    take: 10,
  });
  const themes = await prisma.book.groupBy({
    by: ["theme"],
    where: {
      status: BookStatus.COMMUNITY,
      communityAt: { not: null },
      theme: { not: null },
    },
    _count: true,
    orderBy: {
      _count: { theme: "desc" },
    },
    take: 10,
  });
  const ageGroups = await prisma.book.groupBy({
    by: ["targetAge"],
    where: {
      status: BookStatus.COMMUNITY,
      communityAt: { not: null },
      targetAge: { not: null },
    },
    _count: true,
  });

  const categories = [
    ...genres.map((g) => ({
      value: g.genre || "",
      label: g.genre || "",
      count: g._count,
    })),
    ...themes.map((t) => ({
      value: t.theme || "",
      label: t.theme || "",
      count: t._count,
    })),
  ].filter((c) => c.value !== "");

  const ageOptions = ageGroups
    .filter((a) => a.targetAge)
    .map((a) => ({
      value: a.targetAge || "",
      label: a.targetAge || "",
      count: a._count,
    }));

  // ページネーション
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return (
    <>
      {/* ヒーロー */}
      <CommunityHero
        locale={locale}
        translations={{
          title: t("pageTitle"),
          subtitle: t("pageDescription"),
        }}
      />

      <Suspense fallback={<LoadingFallback />}>
        <CommunityClientWrapper
          books={books}
          categories={categories}
          ageOptions={ageOptions}
          pagination={{
            currentPage: page,
            totalPages,
            hasNextPage,
            hasPrevPage,
          }}
          currentFilters={{
            sort,
            age,
            characters,
            artStyleId,
            pageCount,
            theme,
            genre,
          }}
          totalCount={totalCount}
          locale={locale}
        />
      </Suspense>
    </>
  );
}
