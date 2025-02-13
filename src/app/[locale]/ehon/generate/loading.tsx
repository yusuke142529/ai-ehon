"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion, HTMLMotionProps } from "framer-motion";
import { useTranslations } from "next-intl";

// ★ ExtendedMotionDivProps: Framer Motion の HTMLMotionProps に React の HTMLAttributes をマージ
type ExtendedMotionDivProps = HTMLMotionProps<"div"> & React.HTMLAttributes<HTMLDivElement>;

// ★ MotionDiv コンポーネント: HTMLMotionProps と HTMLAttributes の両方を受け付ける
const MotionDiv: React.FC<ExtendedMotionDivProps> = (props) => {
  return <motion.div {...props} />;
};

export default function EhonGenerateLoading() {
  const t = useTranslations("common");

  // ダミーの進捗 (0～100)
  const [progress, setProgress] = useState(0);
  // ヒント用のインデックス
  const [tipIndex, setTipIndex] = useState(0);

  // ヒントメッセージ（例）
  const tips = [
    t("ehonLoadingTip1"),
    t("ehonLoadingTip2"),
    t("ehonLoadingTip3"),
    t("ehonLoadingTip4"),
  ];

  // 進捗バーを徐々に進める
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev < 100 ? prev + 1 : prev));
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
      <MotionDiv
        key="loading-overlay"
        className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        role="alert"
        aria-label={t("ehonLoadingAriaLabel")} // 例: "絵本生成中のローディング画面"
      >
        {/* ダミー進捗バー */}
        <div className="w-64 h-2 bg-gray-200 rounded-full mt-4 overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* ヒント表示 */}
        <p className="mt-4 text-gray-600 text-sm text-center px-4">
          {tips[tipIndex]}
        </p>

        {/* 進捗率表示 */}
        <p className="mt-2 text-gray-400 text-xs">
          {t("ehonLoadingProgress", { progress })}
        </p>
      </MotionDiv>
    </AnimatePresence>
  );
}