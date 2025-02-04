"use client";

import React, { useEffect, useState, forwardRef } from "react";
import type { HTMLFlipBookProps } from "react-pageflip";

/**
 * Next.js (App Router) + SSR環境で、`react-pageflip` をそのまま dynamic import すると
 * 「Function components cannot be given refs」エラーが出やすい。
 *
 * そこで、このコンポーネントでは「段階的読み込み方式」を採用。
 *
 * 1) 初期表示時には "Loading..." のようなプレースホルダーを返す
 * 2) クライアント側で useEffect() で `import("react-pageflip")`
 * 3) 読み込み完了後に <HTMLFlipBook> を forwardRef して返す
 *
 * こうすることで SSR はスキップされ、LoadableComponent の衝突を回避できます。
 */

// モジュールキャッシュ（すでに読み込んだら再読み込みしない）
let HTMLFlipBookModule: React.ComponentType<HTMLFlipBookProps> | null = null;

interface FlipBookWrapperProps extends HTMLFlipBookProps {
  children: React.ReactNode;
}

const FlipBookWrapper = forwardRef<any, FlipBookWrapperProps>((props, ref) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!HTMLFlipBookModule) {
      // まだ読み込んでなければ import する
      import("react-pageflip")
        .then((mod) => {
          HTMLFlipBookModule = mod.default;
          setIsLoaded(true);
        })
        .catch((err) => {
          console.error("Failed to load react-pageflip:", err);
        });
    } else {
      // すでにロード済みなら即完了
      setIsLoaded(true);
    }
  }, []);

  if (!isLoaded || !HTMLFlipBookModule) {
    // ロードが終わるまではローディング表示
    return <div>Loading flipbook...</div>;
  }

  // ロード完了後に実際の <HTMLFlipBook> を描画
  const HTMLFlipBook = HTMLFlipBookModule;
  return <HTMLFlipBook {...props} ref={ref} />;
});

FlipBookWrapper.displayName = "FlipBookWrapper";
export default FlipBookWrapper;