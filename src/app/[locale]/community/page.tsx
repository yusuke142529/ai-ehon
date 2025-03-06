// src/app/[locale]/community/page.tsx

import { Suspense } from "react";
import { prisma } from "@/lib/prismadb";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { BookStatus } from "@prisma/client";
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

export function generateStaticParams() {
  return [{ locale: "ja" }, { locale: "en" }];
}

export default async function CommunityPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  if (!["ja", "en"].includes(locale)) {
    return notFound();
  }

  const t = await getTranslations({ locale, namespace: "Community" });

  const category = typeof searchParams.category === "string" ? searchParams.category : undefined;
  const sort = typeof searchParams.sort === "string" ? searchParams.sort : "latest";
  const age = typeof searchParams.age === "string" ? searchParams.age : undefined;
  const page = typeof searchParams.page === "string" ? parseInt(searchParams.page, 10) : 1;

  const pageSize = 12;
  const skip = (page - 1) * pageSize;

  const whereCondition = {
    communityAt: { not: null },
    status: BookStatus.COMMUNITY,
    deletedAt: null,
    ...(category && { 
      OR: [
        { genre: category },
        { theme: category }
      ]
    }),
    ...(age && { targetAge: age }),
  };

  type OrderByOption = 
    | { communityAt: 'desc' } 
    | { likes: { _count: 'desc' } } 
    | { title: 'asc' };

  let orderBy: OrderByOption = { communityAt: "desc" };
  if (sort === "popular") {
    orderBy = { likes: { _count: "desc" } };
  } else if (sort === "title") {
    orderBy = { title: "asc" };
  }

  // 1. 絵本の総数
  const totalCount = await prisma.book.count({
    where: whereCondition,
  });

  // 2. 絵本一覧を取得 (修正ポイント：pagesを含める)
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
    // ▼ ここから追加 -----------------------------
     pages: {
       orderBy: { pageNumber: "asc" },
       select: {
         pageNumber: true,
         imageUrl: true,
       },
     },
     // ▲ ここまで追加 -----------------------------
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

  // 3. カテゴリー
  const genres = await prisma.book.groupBy({
    by: ["genre"],
    where: {
      communityAt: { not: null },
      genre: { not: null },
      status: BookStatus.COMMUNITY,
    },
    _count: true,
    orderBy: {
      _count: {
        genre: "desc",
      },
    },
    take: 10,
  });
  const themes = await prisma.book.groupBy({
    by: ["theme"],
    where: {
      communityAt: { not: null },
      theme: { not: null },
      status: BookStatus.COMMUNITY,
    },
    _count: true,
    orderBy: {
      _count: {
        theme: "desc",
      },
    },
    take: 10,
  });

  const ageGroups = await prisma.book.groupBy({
    by: ["targetAge"],
    where: {
      communityAt: { not: null },
      targetAge: { not: null },
      status: BookStatus.COMMUNITY,
    },
    _count: true,
  });

  const categories = [
    ...genres.map(g => ({ value: g.genre || "", label: g.genre || "", count: g._count })),
    ...themes.map(t => ({ value: t.theme || "", label: t.theme || "", count: t._count }))
  ].filter(c => c.value !== "");

  const ageOptions = ageGroups
    .filter(a => a.targetAge)
    .map(a => ({ value: a.targetAge || "", label: a.targetAge || "", count: a._count }));

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  // 5. 注目の絵本
  const featuredBooks = await prisma.book.findMany({
    where: {
      communityAt: { not: null },
      status: BookStatus.COMMUNITY,
      deletedAt: null,
    },
    orderBy: {
      likes: {
        _count: "desc",
      },
    },
    select: {
      id: true,
      title: true,
      coverImageUrl: true,
      user: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          likes: true,
        },
      },
    },
    take: 3,
  });

  return (
    <>
      <CommunityHero 
        featuredBooks={featuredBooks} 
        locale={locale}
        translations={{
          title: t("heroTitle"),
          subtitle: t("heroSubtitle"),
          featured: t("featuredBooks"),
          viewAll: t("viewAll"),
          by: t("byAuthor"),
          likes: t("likesCount"),
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
            category,
            sort,
            age,
          }}
          totalCount={totalCount}
          locale={locale}
        />
      </Suspense>
    </>
  );
}
