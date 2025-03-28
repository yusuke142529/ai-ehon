"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion, HTMLMotionProps } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Alert, AlertIcon, Box, Button } from "@chakra-ui/react";

// ★ ExtendedMotionDivProps: Framer Motion の HTMLMotionProps に React の HTMLAttributes をマージ
type ExtendedMotionDivProps = HTMLMotionProps<"div"> & React.HTMLAttributes<HTMLDivElement>;

// ★ MotionDiv コンポーネント: HTMLMotionProps と HTMLAttributes の両方を受け付ける
const MotionDiv: React.FC<ExtendedMotionDivProps> = (props) => {
  return <motion.div {...props} />;
};

// ローカルストレージのキー定義（CreatePageClientと一致させる）
const GENERATION_KEY = "ehon_generation_status";
const GENERATION_TIMESTAMP_KEY = "ehon_generation_timestamp";
const GENERATION_TIMEOUT_MS = 30 * 60 * 1000; // 30分

export default function EhonGenerateLoading() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  // ダミーの進捗 (0～100)
  const [progress, setProgress] = useState(0);
  // ヒント用のインデックス
  const [tipIndex, setTipIndex] = useState(0);

  // 処理状態管理
  const [networkError, setNetworkError] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState("");

  // ヒントメッセージ（例）
  const tips = [
    t("ehonLoadingTip1"),
    t("ehonLoadingTip2"),
    t("ehonLoadingTip3"),
    t("ehonLoadingTip4"),
    // 追加: 処理継続に関する情報
    t("ehonLoadingTipContinue", { defaultValue: "処理はバックグラウンドで継続します。アプリを閉じても大丈夫です。" })
  ];

  // 状態確認関数
  const checkGenerationStatus = useCallback(async (showRecoveryMessage = false) => {
    try {
      const generationStatus = localStorage.getItem(GENERATION_KEY);
      const generationTimestamp = localStorage.getItem(GENERATION_TIMESTAMP_KEY);
      
      if (!generationStatus || !generationTimestamp) {
        return false;
      }
      
      const timestamp = parseInt(generationTimestamp, 10);
      const now = Date.now();
      
      // タイムアウトチェック
      if (now - timestamp > GENERATION_TIMEOUT_MS) {
        localStorage.removeItem(GENERATION_KEY);
        localStorage.removeItem(GENERATION_TIMESTAMP_KEY);
        return false;
      }
      
      // 進行中の処理を確認
      if (generationStatus === "generating") {
        if (showRecoveryMessage) {
          setRecoveryMessage(t("generationCheckingStatus", { defaultValue: "生成状態を確認しています..." }));
        }
        
        const res = await fetch('/api/user/latest-book');
        if (!res.ok) {
          throw new Error("API response not OK");
        }
        
        const latestBook = await res.json();
        if (latestBook && latestBook.id) {
          // 成功! 絵本が見つかった
          if (showRecoveryMessage) {
            setRecoveryMessage(t("generationFoundBook", { defaultValue: "絵本が見つかりました！リダイレクトします..." }));
          }
          
          // 遅延してからリダイレクト（ユーザーにメッセージを見せるため）
          setTimeout(() => {
            localStorage.removeItem(GENERATION_KEY);
            localStorage.removeItem(GENERATION_TIMESTAMP_KEY);
            router.push(`/${locale}/ehon/${latestBook.id}`);
          }, 1500);
          
          return true;
        }
      }
      
      return false;
    } catch (err) {
      console.error("Error checking generation status:", err);
      return false;
    }
  }, [t, router, locale]);

  // 状態復旧を試みる
  const attemptRecovery = useCallback(async () => {
    setIsRecovering(true);
    setRecoveryMessage(t("generationAttemptingRecovery", { defaultValue: "生成状態の復旧を試みています..." }));
    
    try {
      const recovered = await checkGenerationStatus(true);
      
      if (!recovered) {
        // 1.5秒後にリカバリーモードを終了
        setTimeout(() => {
          setRecoveryMessage(t("generationRecoveryFailed", { defaultValue: "復旧に失敗しました。トップページに戻ってください。" }));
          setTimeout(() => {
            router.push(`/${locale}`);
          }, 3000);
        }, 1500);
      }
    } catch (err) {
      console.error("Recovery attempt failed:", err);
      setRecoveryMessage(t("generationRecoveryError", { defaultValue: "エラーが発生しました。トップページに戻ってください。" }));
      setTimeout(() => {
        router.push(`/${locale}`);
      }, 3000);
    }
  }, [checkGenerationStatus, router, locale, t]);

  // 初回マウント時に状態確認
  useEffect(() => {
    checkGenerationStatus();
  }, [checkGenerationStatus]);

  // ポーリングで状態確認（10秒ごと）
  useEffect(() => {
    // ネットワークエラー状態またはリカバリー中はポーリングしない
    if (networkError || isRecovering) return;
    
    const intervalId = setInterval(async () => {
      try {
        await checkGenerationStatus();
      } catch (err) {
        console.log("Polling error:", err);
        // エラーが続くようならネットワークエラー状態に
        setNetworkError(true);
      }
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, [checkGenerationStatus, networkError, isRecovering]);

  // 進捗バーを徐々に進める
  useEffect(() => {
    // エラー状態では進捗を止める
    if (networkError || isRecovering) return;
    
    const timer = setInterval(() => {
      setProgress((prev) => {
        // 長時間処理が続く場合も100%近くで停止
        if (prev >= 95) return prev + 0.1;
        return prev < 100 ? prev + 1 : prev;
      });
    }, 80);
    
    return () => clearInterval(timer);
  }, [networkError, isRecovering]);

  // 4秒ごとにヒントを切り替え
  useEffect(() => {
    if (networkError || isRecovering) return;
    
    const tipTimer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 4000);
    
    return () => clearInterval(tipTimer);
  }, [tips.length, networkError, isRecovering]);

  // ネットワークエラー検出用
  useEffect(() => {
    const handleOnline = () => setNetworkError(false);
    const handleOffline = () => setNetworkError(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
        aria-label={t("ehonLoadingAriaLabel", { defaultValue: "絵本生成中のローディング画面" })}
      >
        {/* ネットワークエラーや復旧中表示 */}
        {networkError && !isRecovering && (
          <Box className="w-4/5 max-w-md mb-6">
            <Alert 
              status="error" 
              borderRadius="md" 
              flexDirection="column" 
              alignItems="center" 
              justifyContent="center" 
              textAlign="center" 
              py={4}
            >
              <AlertIcon />
              <Box mt={2} mb={3}>
                {t("generationNetworkError", { defaultValue: "ネットワークエラーが発生しました" })}
              </Box>
              <Box fontSize="sm" mb={4}>
                {t("generationNetworkErrorDesc", { defaultValue: "処理はバックグラウンドで継続している可能性があります。復旧を試みますか？" })}
              </Box>
              <Button colorScheme="blue" size="sm" onClick={attemptRecovery}>
                {t("generationTryRecovery", { defaultValue: "復旧を試みる" })}
              </Button>
            </Alert>
          </Box>
        )}

        {/* 復旧中メッセージ */}
        {isRecovering && (
          <Box className="w-4/5 max-w-md mb-6">
            <Alert 
              status="info" 
              borderRadius="md"
              py={4}
            >
              <AlertIcon />
              <Box>{recoveryMessage}</Box>
            </Alert>
          </Box>
        )}

        {/* 通常の読み込み表示 (エラーまたは復旧中でない場合) */}
        {!networkError && !isRecovering && (
          <>
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
              {t("ehonLoadingProgress", { progress: Math.floor(progress) })}
            </p>
          </>
        )}
      </MotionDiv>
    </AnimatePresence>
  );
}