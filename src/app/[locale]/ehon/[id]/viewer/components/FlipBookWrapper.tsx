//src/app/[locale]/ehon/[id]/viewer/components/FlipBookWrapper.tsx

"use client";

import React, { useState, useEffect, forwardRef } from "react";

/** ページがめくられた際のイベント例 (必要に応じて拡張) */
export interface FlipEvent {
  data: number;
}

/**
 * IProps: react-pageflip が要求する (バージョン2.x想定) 必須 + オプションのプロパティ群。
 * - startPage, usePortrait, etc. が必須項目。
 */
export interface IProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 必須プロパティ例 */
  startPage?: number;
  usePortrait?: boolean;
  startZIndex?: number;
  autoSize?: boolean;
  flippingTime?: number;
  drawShadow?: boolean;
  responsive?: boolean;
  singlePage?: boolean;

  /** オプション・任意プロパティ */
  width?: number;
  height?: number;
  size?: "fixed" | "stretch";
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  swipeDistance?: number;
  showPageCorners?: boolean;
  disableFlipByClick?: boolean;
  useMouseEvents?: boolean;
  showCover?: boolean;
  mobileScrollSupport?: boolean;
  clickEventForward?: boolean;
  maxShadowOpacity?: number;

  /**
   * ページがめくられたときなどのイベントハンドラ。
   * BookViewerClient.tsx 等で受け取る場合に使う。
   */
  onFlip?: (e: FlipEvent) => void;
  onManualStart?: () => void;
}

/** flipNext / flipPrev などを呼び出せるインスタンス */
export interface FlipBookInstance {
  pageFlip: () => {
    flipNext: () => void;
    flipPrev: () => void;
    // 他にも必要なら追加
  };
}

/** 
 * FlipBookWrapperProps:
 * IProps (ライブラリ必須) に加え、children を受け取れるようにする 
 */
export interface FlipBookWrapperProps extends IProps {
  children?: React.ReactNode;
}

/** 
 * ライブラリの default export に相当するコンポーネント型
 * IProps & RefAttributes<FlipBookInstance> を forwardRef で受け取る想定 
 */
type HTMLFlipBookType =
  | React.MemoExoticComponent<
      React.ForwardRefExoticComponent<IProps & React.RefAttributes<FlipBookInstance>>
    >
  | null;

// モジュールキャッシュ（ロードを1回だけにするため）
let HTMLFlipBookModule: HTMLFlipBookType = null;

/**
 * FlipBookWrapper:
 * - Next.js App Router + dynamic import で SSR を避ける
 * - 親が参照する ref は FlipBookInstance となる
 */
const FlipBookWrapper = forwardRef<FlipBookInstance, FlipBookWrapperProps>(
  function FlipBookWrapper(props, ref) {
    const [isLoaded, setIsLoaded] = useState(false);

    // dynamic import
    useEffect(() => {
      if (!HTMLFlipBookModule) {
        import("react-pageflip")
          .then((mod) => {
            // @ts-expect-error ← これ
            HTMLFlipBookModule = mod.default; // defaultエクスポートをキャッシュ
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
      return <div>Loading flipbook...</div>;
    }

    // デフォルト値を設定したい場合は下記のように分割代入する例も可
    // const {
    //   startPage = 0,
    //   usePortrait = false,
    //   flippingTime = 1000,
    //   drawShadow = true,
    //   responsive = true,
    //   ...restProps
    // } = props;

    // 実際の react-pageflip コンポーネント
    const HTMLFlipBook = HTMLFlipBookModule;

    // flipbook 内に children を配置しないとめくるページがないので注意
    return (
      <HTMLFlipBook ref={ref} {...props}>
        {props.children}
      </HTMLFlipBook>
    );
  }
);

FlipBookWrapper.displayName = "FlipBookWrapper";
export default FlipBookWrapper;