"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

/**
 * ImmersiveContext で「没入モード」の状態をグローバルに共有。
 * BookViewerClientなどで useImmersive() を呼び出すことで
 * immersiveMode を読み書きできる。
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
 *   - グローバルに Header / Footer を描画
 *   - immersiveMode を useState で管理し、Header/ Footer に hide={immersiveMode} を渡す
 */
export default function LayoutClientWrapper({ children }: { children: ReactNode }) {
  const [immersiveMode, setImmersiveMode] = useState(false);

  return (
    <ImmersiveContext.Provider value={{ immersiveMode, setImmersiveMode }}>
      {/* グローバルヘッダー：没入モード時は隠す */}
      <Header hide={immersiveMode} />

      <main>{children}</main>

      {/* グローバルフッター：没入モード時は隠す */}
      <Footer hide={immersiveMode} />
    </ImmersiveContext.Provider>
  );
}
