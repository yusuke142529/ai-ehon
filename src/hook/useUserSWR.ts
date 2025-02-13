// src/hook/useUserSWR.ts
"use client";

import useSWR, { SWRResponse } from "swr";

/**
 * APIが返すユーザー型 (idを string に修正)
 */
export type MeUser = {
  id: string;           // ← ここを number→string に変更
  email: string;
  name: string;
  image?: string | null;
  points: number;
};

/**
 * /api/user/me のレスポンス型
 */
export type MeResponse = {
  user: MeUser;
};

/**
 * fetcher: /api/user/me をフェッチ
 */
async function fetcher(url: string): Promise<MeResponse> {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    throw new Error(`Failed to fetch user data. Status: ${res.status}`);
  }
  return res.json();
}

/**
 * /api/user/me を取得し、ログイン中ユーザーの最新情報を管理するフック
 */
export function useUserSWR() {
  const { data, error, isLoading, mutate }: SWRResponse<MeResponse, Error> =
    useSWR("/api/user/me", fetcher);

  const user = data?.user;

  return {
    user,       // { id: string, email, name, image, points } など
    error,
    isLoading,
    mutate,
  };
}