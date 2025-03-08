// src/app/[locale]/ehon/[id]/viewer/components/types.ts

import type React from "react";

/**
 * 絵本フリップブックで使用するページデータ型
 */
export type PageData = {
  id: number;
  pageNumber: number;
  text: string;
  imageUrl?: string | null;
};

/** ページがめくられた際のイベント用インターフェース例 */
export interface FlipEvent {
  data: number; 
}

/**
 * FlipBookInstance:
 * - flipNext(), flipPrev() などを呼び出せるインスタンス
 */
export interface FlipBookInstance {
  pageFlip: () => {
    flipNext: () => void;
    flipPrev: () => void;
    flip: (page: number) => void;
  };
}

/**
 * FlipBookWrapperProps:
 * - FlipBookWrapper コンポーネントに渡すプロパティ
 * - 必要に応じて拡張してください
 */
export interface FlipBookWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: number;
  height?: number;
  /** 1ページ表示モードかどうか */
  singlePage?: boolean;
  /** 表紙を表示するか */
  showCover?: boolean;
  /** PCブラウザでマウスドラッグでめくれるかどうか */
  useMouseEvents?: boolean;
  /** スワイプの感知距離 */
  swipeDistance?: number;
  /** モバイルのスクロールサポート */
  mobileScrollSupport?: boolean;
  /** ページめくりアニメーションの時間 (ms) */
  flippingTime?: number;
  /** 影の最大不透明度 */
  maxShadowOpacity?: number;

  /** ページがめくられたときのイベントハンドラ (任意) */
  onFlip?: (event: FlipEvent) => void;

  /** 子要素 (各ページ) */
  children?: React.ReactNode;
}