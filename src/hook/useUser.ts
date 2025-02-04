//src/hook/useUser.ts

"use client";

import { useSession } from "next-auth/react";

/**
 * フロント(クライアント)でログインユーザ情報を取得する簡易フック
 */
export function useUser() {
  const { data: session } = useSession();
  return session?.user || null;
}