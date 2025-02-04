"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Chakra UI のカスタムコンポーネント(例)
import { LoadingIndicator } from "@/components/LoadingIndicator";

// next-intl
import { useTranslations } from "next-intl";

/**
 * AI絵本生成中のローディング画面を表示するコンポーネントです。
 * - "use client" でクライアントコンポーネント
 * - Framer Motion でアニメーション
 * - Chakra UI のカスタムコンポーネント LoadingIndicator
 */
export default function EhonGenerateLoading() {
  // 国際化フック
  const t = useTranslations("common");

  // ダミーの進捗管理 (0〜100)
  const [progress, setProgress] = useState(0);

  // ヒント用に複数パターンを管理
  // ここでは例として、common.json に "tips" を配列として定義している想定
  // （または "tip1","tip2",... と個別キーを定義してもOK）
  const tips = [
    t("ehonLoadingTip1"), // "好きなキャラクターを想像してみてください…"
    t("ehonLoadingTip2"), // "ページが増えるほど冒険が深まります！"
    t("ehonLoadingTip3"), // "オリジナルイラストが生まれるまで..."
    t("ehonLoadingTip4"), // "あなたの物語の世界が、今生まれようとしています..."
  ];
  const [tipIndex, setTipIndex] = useState(0);

  // ダミーの進捗バーを徐々に進める
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev < 100) return prev + 1;
        return prev;
      });
    }, 80);
    return () => clearInterval(timer);
  }, []);

  // 4秒ごとにヒントを切り替え
  useEffect(() => {
    const tipTimer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 4000);
    return () => clearInterval(tipTimer);
  }, [tips.length]);

  return (
    <AnimatePresence>
      <motion.div
        key="loading-overlay"
        className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        role="alert"
        aria-label={t("ehonLoadingAriaLabel")} // 例: "絵本生成中のローディング画面"
      >
        {/* カスタムローディングインジケータ */}
        <LoadingIndicator />

        {/* ダミー進捗バー */}
        <div className="w-64 h-2 bg-gray-200 rounded-full mt-4 overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* ローディング時に表示するヒント */}
        <p className="mt-4 text-gray-600 text-sm text-center px-4">
          {tips[tipIndex]}
        </p>

        {/* 進捗率の表示 */}
        <p className="mt-2 text-gray-400 text-xs">
          {t("ehonLoadingProgress", { progress })} 
          {/* 例: "絵本を生成しています... {progress}%" */}
        </p>
      </motion.div>
    </AnimatePresence>
  );
}