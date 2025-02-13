"use client";

import React, { useEffect, useState, forwardRef } from "react";

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

// ❶ モジュールキャッシュ（動的インポートでロードしたコンポーネントを使い回し）
let HTMLFlipBookModule: any | null = null;

/**
 * ❷ react-pageflip が受け取りそうな Props を独自に定義 (一例)
 *    公式ドキュメントやソースから実際の props を確認し、必要に応じて調整してください
 */
interface ReactPageflipProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: number;
  height?: number;
  size?: "fixed" | "stretch";
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  drawShadow?: boolean;
  flippingTime?: number;
  useMouseEvents?: boolean;
  useOrientation?: boolean;
  showCover?: boolean;
  mobileScrollSupport?: boolean;
  clickEventForward?: boolean;
  onFlip?: (e: any) => void;
  onChangeOrientation?: (e: any) => void;
  onChangeState?: (e: any) => void;
  className?: string;
  style?: React.CSSProperties;
  maxShadowOpacity?: number;
}

/**
 * ❸ FlipBookWrapperProps: 上記 props に加え、子要素(children)を許容
 */
interface FlipBookWrapperProps extends ReactPageflipProps {
  children?: React.ReactNode;
}

const FlipBookWrapper = forwardRef<any, FlipBookWrapperProps>((props, ref) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // すでにロード済みかチェック
    if (!HTMLFlipBookModule) {
      import("react-pageflip")
        .then((mod) => {
          // 'default' にはクラスコンポーネント HTMLFlipBook が入っている
          HTMLFlipBookModule = mod.default;
          setIsLoaded(true);
        })
        .catch((err) => {
          console.error("Failed to load react-pageflip:", err);
        });
    } else {
      setIsLoaded(true);
    }
  }, []);

  if (!isLoaded || !HTMLFlipBookModule) {
    // ロードが終わるまではローディング表示
    return <div>Loading flipbook...</div>;
  }

  // ロード完了後に実際の <HTMLFlipBook> を返す
  const HTMLFlipBook = HTMLFlipBookModule;
  return <HTMLFlipBook ref={ref} {...props} />;
});

FlipBookWrapper.displayName = "FlipBookWrapper";
export default FlipBookWrapper;