//src/app/[locale]/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import HomeClient from "@/components/HomeClient";
import { useTranslations } from "next-intl";

type Book = {
  id: number; // Bookのidはint(autoincrement)なのでnumberでOK
  title: string;
  isPublished: boolean;
  isCommunity: boolean;
  pages: {
    pageNumber: number;
    imageUrl: string;
  }[];
};

type UserProfile = {
  // ★ idを string のみにする
  id?: string;
  name?: string;
  email?: string;
};

/**
 * 純粋なCSRページ
 * - サーバーサイドで session や DB を呼ばず、クライアント上で fetch などを行う
 */
export default function LocaleHomePageCSR() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userEhons, setUserEhons] = useState<Book[]>([]);

  const t = useTranslations("LocaleHomePageCSR");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // 1) セッション情報を取得 (/api/auth/session など)
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        const userData: UserProfile | null = sessionData?.user ?? null;

        // 2) ログイン中なら、ユーザーIDを使って絵本一覧を取得
        let fetchedUserEhons: Book[] = [];
        if (userData?.id) {
          // ★ userData.id は string として扱う
          const userId = userData.id; 
          // userId をURLクエリに文字列として付与
          const userEhonsRes = await fetch(`/api/ehon?userId=${userId}`);
          if (userEhonsRes.ok) {
            fetchedUserEhons = await userEhonsRes.json();
          }
        }

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

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: 100, color: "white" }}>
        {t("loading")}
      </div>
    );
  }

  // 取得した user と userEhons を HomeClient に渡す
  return <HomeClient user={user} userEhons={userEhons} />;
}