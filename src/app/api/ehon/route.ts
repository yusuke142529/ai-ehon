// src/app/api/ehon/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prismadb";
import { NextResponse } from "next/server";
import { ensureActiveUser } from "@/lib/serverCheck";

/**
 * GET /api/ehon
 *
 * クエリパラメータ:
 *   ?userId=<stringUserId>
 *   &favorite=true
 *   &theme=love
 *   &genre=fantasy
 *   &characters=Bear
 *   &artStyleId=2
 *   &pageCount=10
 *   &targetAge=3-5才
 *   &search=princess
 *
 * ページング:
 *   &page=2
 *   &limit=8
 *
 * 戻り値: Book[] (配列)
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
    const favoriteParam   = url.searchParams.get("favorite");
    const themeParam      = url.searchParams.get("theme");
    const genreParam      = url.searchParams.get("genre");
    const charactersParam = url.searchParams.get("characters");
    const artStyleIdParam = url.searchParams.get("artStyleId");
    const pageCountParam  = url.searchParams.get("pageCount");
    const targetAgeParam  = url.searchParams.get("targetAge");
    const userIdParam     = url.searchParams.get("userId");
    const searchParam     = url.searchParams.get("search");

    // 3) where 条件を組み立て
    const where: any = {};

    // userId 絞り込み (Stringで検索)
    if (userIdParam) {
      where.userId = userIdParam; // ← 文字列そのまま
    }

    // "favorite=true" の場合のみ ensureActiveUser => likesテーブルで絞り込み
    if (favoriteParam === "true") {
      const check = await ensureActiveUser();
      if (check.error || !check.user) {
        return NextResponse.json(
          { error: check.error || "Unauthorized" },
          { status: check.status || 401 }
        );
      }
      const userId = check.user.id; // string

      // likes テーブルに userId が含まれる Book を検索
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

    // アートスタイルID (intカラム)
    if (artStyleIdParam) {
      const styleIdNum = parseInt(artStyleIdParam, 10);
      if (!isNaN(styleIdNum)) {
        where.artStyleId = styleIdNum;
      }
    }

    // ページ数 (intカラム)
    if (pageCountParam) {
      const pcNum = parseInt(pageCountParam, 10);
      if (!isNaN(pcNum)) {
        where.pageCount = pcNum;
      }
    }

    // 対象年齢 (stringカラム)
    if (targetAgeParam) {
      where.targetAge = targetAgeParam;
    }

    // タイトル部分一致検索
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
          take: 1, // 表紙のみ (例: pageNumber=0)
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