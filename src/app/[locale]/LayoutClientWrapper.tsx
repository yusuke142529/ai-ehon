"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";

type ImmersiveContextType = {
  immersiveMode: boolean;
  setImmersiveMode: React.Dispatch<React.SetStateAction<boolean>>;
  // サーバークライアント同期のためのフラグ
  isClient: boolean;
};

// デフォルト値を設定して、undefined のケースを減らす
const defaultContext: ImmersiveContextType = {
  immersiveMode: false,
  setImmersiveMode: () => {},
  isClient: false
};

const ImmersiveContext = createContext<ImmersiveContextType>(defaultContext);

export function useImmersive() {
  const ctx = useContext(ImmersiveContext);
  return ctx;
}

export default function LayoutClientWrapper({ children }: { children: ReactNode }) {
  // 初期状態はfalse - サーバーとクライアントで一致させる
  const [immersiveMode, setImmersiveMode] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // クライアントサイドでのみモードを変更
  useEffect(() => {
    // クライアントサイドのフラグを設定
    setIsClient(true);

    // localStorage から保存された状態をロード（必要に応じて）
    const savedMode = localStorage.getItem('immersiveMode');
    if (savedMode === 'true') {
      setImmersiveMode(true);
    }
  }, []);

  // immersiveMode が変更されたら localStorage に保存（必要に応じて）
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('immersiveMode', immersiveMode.toString());
    }
  }, [immersiveMode, isClient]);

  return (
    <ImmersiveContext.Provider value={{ immersiveMode, setImmersiveMode, isClient }}>
      {children}
    </ImmersiveContext.Provider>
  );
}