// /src/app/api/ehon/route.ts

import { prisma } from "@/lib/prismadb";
import { NextResponse } from "next/server";
import { ensureActiveUser } from "@/lib/serverCheck";

/**
 * GET /api/ehon
 *
 * クエリパラメータ例:
 *   ?userId=123
 *   &favorite=true
 *   &theme=love
 *   &genre=fantasy
 *   &characters=Bear
 *   &artStyleCategory=anime
 *   &artStyleId=2
 *   &pageCount=10
 *   &targetAge=3-5才
 *   &search=princess
 *
 * ページング:
 *   &page=2
 *   &limit=8
 *
 * レスポンス形式: Book[] (配列)
 *   (フロントで配列を想定)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    // 1) ページングパラメータ
    const pageParam  = url.searchParams.get("page")  ?? "1";
    const limitParam = url.searchParams.get("limit") ?? "8";

    let page  = parseInt(pageParam, 10);
    let limit = parseInt(limitParam, 10);

    if (isNaN(page)  || page  < 1) page  = 1;
    if (isNaN(limit) || limit < 1) limit = 8;

    const MAX_LIMIT = 100;
    if (limit > MAX_LIMIT) {
      limit = MAX_LIMIT;
    }

    const skip = (page - 1) * limit;
    const take = limit;

    // 2) クエリパラメータ取得
    const favoriteParam         = url.searchParams.get("favorite");
    const themeParam            = url.searchParams.get("theme");
    const genreParam            = url.searchParams.get("genre");
    const charactersParam       = url.searchParams.get("characters");
    const artStyleCategoryParam = url.searchParams.get("artStyleCategory");
    const artStyleIdParam       = url.searchParams.get("artStyleId");
    const pageCountParam        = url.searchParams.get("pageCount");
    const targetAgeParam        = url.searchParams.get("targetAge");
    const userIdParam           = url.searchParams.get("userId");
    const searchParam           = url.searchParams.get("search");

    // 3) where 条件を組み立て
    const where: any = {};

    // userId 絞り込み
    if (userIdParam) {
      const parsedUserId = parseInt(userIdParam, 10);
      if (!isNaN(parsedUserId)) {
        where.userId = parsedUserId;
      }
    }

    // ★ favorite=true の場合だけ ensureActiveUser
    //   => ログイン中ユーザーの "お気に入り" を絞り込む
    if (favoriteParam === "true") {
      // ログイン必須 & 退会チェック
      const check = await ensureActiveUser();
      if (check.error) {
        return NextResponse.json({ error: check.error }, { status: check.status });
      }
      const userId = check.user.id;

      // "likes" テーブルに userId が含まれているBookを検索
      where.likes = { some: { userId } };
    }

    // テーマ
    if (themeParam) {
      where.theme = themeParam;
    }
    // ジャンル
    if (genreParam) {
      where.genre = genreParam;
    }
    // キャラクター
    if (charactersParam) {
      where.characters = charactersParam;
    }
    // アートスタイルカテゴリ
    if (artStyleCategoryParam) {
      where.artStyleCategory = artStyleCategoryParam;
    }
    // アートスタイルID
    if (artStyleIdParam) {
      const styleIdNum = parseInt(artStyleIdParam, 10);
      if (!isNaN(styleIdNum)) {
        where.artStyleId = styleIdNum;
      }
    }
    // ページ数
    if (pageCountParam) {
      const pcNum = parseInt(pageCountParam, 10);
      if (!isNaN(pcNum)) {
        where.pageCount = pcNum;
      }
    }
    // 対象年齢
    if (targetAgeParam) {
      where.targetAge = targetAgeParam;
    }
    // タイトル検索
    if (searchParam) {
      where.title = { contains: searchParam, mode: "insensitive" };
    }

    // 4) DB検索 (ページング)
    const books = await prisma.book.findMany({
      where,
      include: {
        pages: {
          select: {
            pageNumber: true,
            imageUrl: true,
          },
          orderBy: { pageNumber: "asc" },
          take: 1, // 表紙のみ (1ページ目のみ取得)
        },
        likes: true,
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take,
    });

    // 5) 配列を返却
    return NextResponse.json(books);

  } catch (err: any) {
    console.error("Error in GET /api/ehon:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}