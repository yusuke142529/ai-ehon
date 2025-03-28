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

// ローカルストレージキー (CreatePageClientと共通)
const GENERATION_KEY = "ehon_generation_status";
const GENERATION_TIMESTAMP_KEY = "ehon_generation_timestamp";
const GENERATION_TIMEOUT_MS = 30 * 60 * 1000; // 30分

/**
 * 純粋なCSRページ
 * - サーバーサイドで session や DB を呼ばず、クライアント上で fetch などを行う
 */
export default function LocaleHomePageCSR() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userEhons, setUserEhons] = useState<Book[]>([]);
  const [hasGenerationRecovery, setHasGenerationRecovery] = useState(false);

  const t = useTranslations("LocaleHomePageCSR");

  // データフェッチ共通関数
  const fetchUserData = async () => {
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
  };

  // 初回マウント時データ取得と生成状態の確認
  useEffect(() => {
    const checkAndFetchData = async () => {
      await fetchUserData();
      
      // 生成状態の確認
      const generationStatus = localStorage.getItem(GENERATION_KEY);
      const generationTimestamp = localStorage.getItem(GENERATION_TIMESTAMP_KEY);
      
      if (generationStatus === "generating" && generationTimestamp) {
        const timestamp = parseInt(generationTimestamp, 10);
        const now = Date.now();
        
        // 有効期限内の場合
        if (now - timestamp < GENERATION_TIMEOUT_MS) {
          // 生成状態を確認し、最終結果を反映
          try {
            const res = await fetch('/api/user/latest-book');
            if (res.ok) {
              setHasGenerationRecovery(true);
              // データ更新
              await fetchUserData();
            }
          } catch (error) {
            console.error("Generation recovery check failed:", error);
          } finally {
            // 状態クリア
            localStorage.removeItem(GENERATION_KEY);
            localStorage.removeItem(GENERATION_TIMESTAMP_KEY);
          }
        } else {
          // タイムアウトした状態はクリア
          localStorage.removeItem(GENERATION_KEY);
          localStorage.removeItem(GENERATION_TIMESTAMP_KEY);
        }
      }
    };
    
    checkAndFetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: 100, color: "white" }}>
        {t("loading")}
      </div>
    );
  }

  // 取得した user と userEhons を HomeClient に渡す
  return <HomeClient 
    user={user} 
    userEhons={userEhons} 
    hasGenerationRecovery={hasGenerationRecovery} 
  />;
}