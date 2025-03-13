"use client";

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import HeaderClient from "@/components/HeaderClient";
import FooterClient from "@/components/FooterClient";

/** 没入モード用コンテキストの型 */
type ImmersiveContextType = {
  immersiveMode: boolean;
  setImmersiveMode: React.Dispatch<React.SetStateAction<boolean>>;
  isClient: boolean; // クライアント描画完了かどうか
};

const ImmersiveContext = createContext<ImmersiveContextType | undefined>(undefined);

/** useImmersive(): 没入モードの状態を読み書きするフック */
export function useImmersive() {
  const ctx = useContext(ImmersiveContext);
  if (!ctx) {
    throw new Error("useImmersive must be used within ImmersiveContext.Provider");
  }
  return ctx;
}

type LayoutClientWrapperProps = {
  children: ReactNode;
  locale: string;
};

/**
 * LayoutClientWrapper:
 *   - グローバルで「immersiveMode」(没入モード)を提供
 *   - 全ページ共通の HeaderClient / FooterClient をここで描画する
 */
export default function LayoutClientWrapper({ children, locale }: LayoutClientWrapperProps) {
  const [immersiveMode, setImmersiveMode] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // クライアント側でマウント完了を検知 (SSRとの不整合回避)
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <ImmersiveContext.Provider value={{ immersiveMode, setImmersiveMode, isClient }}>
      {/* 全ページ共通のヘッダー */}
      <HeaderClient locale={locale} />

      {/* メインコンテンツ (各ページ) */}
      {children}

      {/* 全ページ共通のフッター */}
      <FooterClient locale={locale} />
    </ImmersiveContext.Provider>
  );
}
