// src/app/[locale]/community/page.tsx

import { Suspense } from "react";
import { prisma } from "@/lib/prismadb";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { BookStatus } from "@prisma/client";

// コンポーネントをインポート
import CommunityHero from "@/components/community/CommunityHero";
import CommunityClientWrapper from "@/components/community/CommunityClientWrapper";
import LoadingFallback from "@/components/LoadingFallback";

// メタデータを動的に生成
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
      images: ["/images/community-share.jpg"], // ソーシャルシェア用の画像
    },
  };
}

// SSG 用に全ロケールの静的パスを生成
export function generateStaticParams() {
  return [{ locale: "ja" }, { locale: "en" }];
}

// メインのコミュニティページ (サーバーコンポーネント)
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

  // クエリパラメータを解析
  const category = typeof searchParams.category === "string" ? searchParams.category : undefined;
  const sort = typeof searchParams.sort === "string" ? searchParams.sort : "latest";
  const age = typeof searchParams.age === "string" ? searchParams.age : undefined;
  const page = typeof searchParams.page === "string" ? parseInt(searchParams.page, 10) : 1;
  
  // ページサイズの設定
  const pageSize = 12;
  const skip = (page - 1) * pageSize;

  // クエリの条件を構築
  const whereCondition = {
    communityAt: { not: null },
    status: BookStatus.COMMUNITY, // コミュニティステータスの書籍のみ
    deletedAt: null, // 論理削除されていないもの
    // カテゴリーフィルター（ジャンルやテーマで絞り込み）
    ...(category && { 
      OR: [
        { genre: category },
        { theme: category }
      ]
    }),
    // 年齢層フィルター
    ...(age && { targetAge: age }),
  };

  // ソート条件を設定
  let orderBy: any = { communityAt: "desc" };
  if (sort === "popular") {
    orderBy = { likes: { _count: "desc" } };
  } else if (sort === "title") {
    orderBy = { title: "asc" };
  }

  // 1. 絵本の総数を取得
  const totalCount = await prisma.book.count({
    where: whereCondition,
  });

  // 2. 絵本一覧を取得（リッチなデータを含む）
  const books = await prisma.book.findMany({
    where: whereCondition,
    orderBy,
    select: {
      id: true,
      title: true,
      coverImageUrl: true,
      communityAt: true,
      theme: true,
      genre: true,
      targetAge: true,
      artStyleId: true,
      // ユーザー情報を取得
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      // いいね数を取得
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
      // 最新のコメント2件を取得
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
    skip,
    take: pageSize,
  });

  // 3. カテゴリー（ジャンル・テーマ）一覧を取得
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

  // 4. 年齢層一覧を取得
  const ageGroups = await prisma.book.groupBy({
    by: ["targetAge"],
    where: {
      communityAt: { not: null },
      targetAge: { not: null },
      status: BookStatus.COMMUNITY,
    },
    _count: true,
  });

  // カテゴリーと年齢層のオプションを整形
  const categories = [
    ...genres.map(g => ({ value: g.genre || "", label: g.genre || "", count: g._count })),
    ...themes.map(t => ({ value: t.theme || "", label: t.theme || "", count: t._count }))
  ].filter(c => c.value !== "");

  const ageOptions = ageGroups
    .filter(a => a.targetAge)
    .map(a => ({ value: a.targetAge || "", label: a.targetAge || "", count: a._count }));

  // ページネーション情報を計算
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  // 5. 注目の絵本（特に人気のある絵本）を取得
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

  // データをクライアントコンポーネントに渡す
  return (
    <>
      {/* ヒーローセクション */}
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
      
      {/* メインコンテンツ (クライアントコンポーネント) */}
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