//src/hook/useUserSWR.ts

"use client";

import useSWR, { SWRResponse } from "swr";

/**
 * APIが返すユーザー型 (Prismaスキーマに合わせて適宜調整)
 */
export type MeUser = {
  id: number;
  email: string;
  name: string;
  iconUrl?: string | null; // 例: アイコンURLがnullになる可能性
  points: number;
};

/**
 * /api/user/me のレスポンス型
 * {
 *   user: {
 *     id: number;
 *     email: string;
 *     name: string;
 *     iconUrl?: string;
 *     points: number;
 *   }
 * }
 */
export type MeResponse = {
  user: MeUser;
};

/**
 * fetcher: /api/user/me をフェッチ
 * レスポンスを JSON.parse() して MeResponse を返却する
 */
async function fetcher(url: string): Promise<MeResponse> {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    // 本番稼働では、詳細なエラーメッセージを返すかどうかはポリシーに合わせて
    throw new Error(`Failed to fetch user data. Status: ${res.status}`);
  }
  return res.json();
}

/**
 * /api/user/me を取得し、ログイン中ユーザーの最新情報を管理するフック
 * - user オブジェクトを返却 (id, email, name, iconUrl, points ... )
 * - mutate("/api/user/me") で再取得可能 (例: ポイント更新など)
 */
export function useUserSWR() {
  const { data, error, isLoading, mutate }: SWRResponse<MeResponse, Error> =
    useSWR("/api/user/me", fetcher);

  // data が undefined の場合、user も undefined
  const user = data?.user;

  return {
    user,       // null でなければ { id, email, name, iconUrl, points ... }
    error,      // エラーオブジェクト
    isLoading,  // データ取得中かどうか
    mutate,     // 手動で再フェッチ (画面リフレッシュ) などに利用
  };
}