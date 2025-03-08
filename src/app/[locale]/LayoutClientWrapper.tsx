"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";

/**
 * ImmersiveContext で「没入モード」の状態をグローバルに共有。
 * 例: BookViewerClientなどで useImmersive() を呼び出せば
 *     immersiveMode を読み書きできる。
 */
type ImmersiveContextType = {
  immersiveMode: boolean;
  setImmersiveMode: React.Dispatch<React.SetStateAction<boolean>>;
};

const ImmersiveContext = createContext<ImmersiveContextType | undefined>(undefined);

/** Hook: コンテキストを取得 */
export function useImmersive() {
  const ctx = useContext(ImmersiveContext);
  if (!ctx) {
    throw new Error("useImmersive must be used within ImmersiveContext.Provider");
  }
  return ctx;
}

/**
 * LayoutClientWrapper:
 *   - クライアントコンポーネントとして、没入モード状態 (immersiveMode) をグローバルに提供する
 *   - ヘッダー/フッターの描画はしない（サーバーコンポーネントが担当）
 */
export default function LayoutClientWrapper({ children }: { children: ReactNode }) {
  const [immersiveMode, setImmersiveMode] = useState(false);

  return (
    <ImmersiveContext.Provider value={{ immersiveMode, setImmersiveMode }}>
      {children}
    </ImmersiveContext.Provider>
  );
}
