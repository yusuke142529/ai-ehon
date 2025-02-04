//src/app/[locale]/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import HomeClient from "@/components/HomeClient";
import { useTranslations } from "next-intl";

type Book = {
  id: number;
  title: string;
  isPublished: boolean;
  isCommunity: boolean;
  pages: {
    pageNumber: number;
    imageUrl: string;
  }[];
};

type UserProfile = {
  id?: string | number;
  name?: string;
  email?: string;
  image?: string;
};

/**
 * 純粋なCSRページ
 * - サーバーサイドで session や DB を呼ばない
 * - 代わりにクライアント上で fetch などを行う
 */
export default function LocaleHomePageCSR() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  // 「ユーザー絵本」だけを管理
  const [userEhons, setUserEhons] = useState<Book[]>([]);

  // next-intl でメッセージを取得
  const t = useTranslations("LocaleHomePageCSR");

  useEffect(() => {
    // クライアントでデータ取得
    async function fetchData() {
      try {
        setLoading(true);

        // 1) セッション情報を取得 (/api/auth/session 等)
        const sessionRes = await fetch("/api/auth/session");
        // セッションがない場合は { user: null } などが返ってくる想定
        const sessionData = await sessionRes.json();
        const userData: UserProfile | null = sessionData?.user ?? null;

        // 2) ログイン中なら ユーザーIDを使って絵本を取得
        let fetchedUserEhons: Book[] = [];
        if (userData?.id) {
          const userId = Number(userData.id);
          // => /api/ehon?userId=xxx を想定
          const userEhonsRes = await fetch(`/api/ehon?userId=${userId}`);
          if (userEhonsRes.ok) {
            fetchedUserEhons = await userEhonsRes.json();
          }
        }

        // ステート更新
        setUser(userData);
        setUserEhons(fetchedUserEhons);
      } catch (err) {
        console.error("Error fetching data in CSR:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // ローディング中の表示 (スピナーなど)
  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: 100, color: "white" }}>
        {t("loading")}
      </div>
    );
  }

  // 取得したデータを HomeClient へ渡す
  return (
    <HomeClient
      user={user}
      userEhons={userEhons}
    />
  );
}