"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion, HTMLMotionProps } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Alert, AlertIcon, Box, Button, useToast } from "@chakra-ui/react";

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

// 状態リダイレクトのフラグ - 検証済みかどうか
const VERIFIED_REDIRECT_KEY = "ehon_verified_redirect";

export default function EhonGenerateLoading() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const toast = useToast();

  // ダミーの進捗 (0～100)
  const [progress, setProgress] = useState(0);
  // ヒント用のインデックス
  const [tipIndex, setTipIndex] = useState(0);

  // 処理状態管理
  const [isRedirecting, setIsRedirecting] = useState(false);

  // ヒントメッセージ（例）
  const tips = [
    t("ehonLoadingTip1"),
    t("ehonLoadingTip2"),
    t("ehonLoadingTip3"),
    t("ehonLoadingTip4"),
    t("ehonLoadingTipContinue", { defaultValue: "処理はバックグラウンドで継続します。アプリを閉じても大丈夫です。" })
  ];

  // 状態確認と自動リダイレクト処理
  const checkAndRedirect = useCallback(async () => {
    // リダイレクト中なら処理しない
    if (isRedirecting) return;

    try {
      // すでに検証済みなら二重チェックを防止
      const alreadyVerified = sessionStorage.getItem(VERIFIED_REDIRECT_KEY);
      if (alreadyVerified === "true") return;

      const generationStatus = localStorage.getItem(GENERATION_KEY);
      const generationTimestamp = localStorage.getItem(GENERATION_TIMESTAMP_KEY);
      
      // 処理中ステータスがない場合 - デッドURL状態
      if (!generationStatus || !generationTimestamp) {
        // 安全のため少し遅延してからトップページへ
        setIsRedirecting(true);
        sessionStorage.setItem(VERIFIED_REDIRECT_KEY, "true");
        
        toast({
          title: t("deadGenerationPage", { defaultValue: "生成ページが無効です" }),
          description: t("redirectingToHome", { defaultValue: "トップページにリダイレクトします" }),
          status: "info",
          duration: 3000,
          isClosable: true,
        });
        
        setTimeout(() => {
          router.push(`/${locale}`);
        }, 1000);
        return;
      }
      
      const timestamp = parseInt(generationTimestamp, 10);
      const now = Date.now();
      
      // タイムアウトチェック - 30分以上経過していたらトップページへ
      if (now - timestamp > GENERATION_TIMEOUT_MS) {
        localStorage.removeItem(GENERATION_KEY);
        localStorage.removeItem(GENERATION_TIMESTAMP_KEY);
        setIsRedirecting(true);
        
        toast({
          title: t("generationTimeout", { defaultValue: "生成処理がタイムアウトしました" }),
          description: t("redirectingToHome", { defaultValue: "トップページにリダイレクトします" }),
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        
        setTimeout(() => {
          router.push(`/${locale}`);
        }, 1000);
        return;
      }
      
      // 生成中ステータスがある場合 - 最新の結果を確認
      if (generationStatus === "generating") {
        try {
          const res = await fetch('/api/user/latest-book');
          if (!res.ok) {
            throw new Error("API response not OK");
          }
          
          const latestBook = await res.json();
          if (latestBook && latestBook.id) {
            // 生成完了! 結果のIDが見つかった
            localStorage.removeItem(GENERATION_KEY);
            localStorage.removeItem(GENERATION_TIMESTAMP_KEY);
            setIsRedirecting(true);
            
            toast({
              title: t("generationCompleted", { defaultValue: "絵本の生成が完了しました！" }),
              description: t("redirectingToEdit", { defaultValue: "絵本の編集ページを表示します" }),
              status: "success",
              duration: 3000,
              isClosable: true,
            });
            
            // 編集ページに直接リダイレクト
            setTimeout(() => {
              router.push(`/${locale}/ehon/${latestBook.id}`);
            }, 1000);
            return;
          }
        } catch (err) {
          console.error("Error checking latest book:", err);
          // APIエラーの場合は自動的にトップページへ
          setIsRedirecting(true);
          
          toast({
            title: t("generationCheckError", { defaultValue: "生成状態の確認中にエラーが発生しました" }),
            description: t("redirectingToHome", { defaultValue: "トップページにリダイレクトします" }),
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          
          setTimeout(() => {
            router.push(`/${locale}`);
          }, 1500);
        }
      }
      
      // 処理中だがまだ結果がない - 正常処理継続中
      sessionStorage.setItem(VERIFIED_REDIRECT_KEY, "true");
      
    } catch (err) {
      console.error("Critical error in checkAndRedirect:", err);
      // 重大なエラー時はトップページへ
      setIsRedirecting(true);
      
      toast({
        title: t("criticalError", { defaultValue: "重大なエラーが発生しました" }),
        description: t("redirectingToHome", { defaultValue: "トップページにリダイレクトします" }),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      
      setTimeout(() => {
        router.push(`/${locale}`);
      }, 1000);
    }
  }, [isRedirecting, locale, router, t, toast]);

  // 初回マウント時に即時状態確認
  useEffect(() => {
    // クリーンアップ時にセッションストレージをクリア
    return () => {
      sessionStorage.removeItem(VERIFIED_REDIRECT_KEY);
    };
  }, []);

  // 初回レンダリング後すぐに状態チェック & リダイレクト判断
  useEffect(() => {
    // 最優先で実行 (requestAnimationFrameでDOM更新後に実行)
    const checkImmediately = () => {
      requestAnimationFrame(() => {
        checkAndRedirect();
      });
    };
    checkImmediately();
    
    // ネットワークイベント時も再チェック
    const handleOnline = () => checkAndRedirect();
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [checkAndRedirect]);

  // 進捗バーを徐々に進める
  useEffect(() => {
    // リダイレクト中は進捗を止める
    if (isRedirecting) return;
    
    const timer = setInterval(() => {
      setProgress((prev) => {
        // 長時間処理が続く場合も100%近くで停止
        if (prev >= 95) return prev + 0.05;
        return prev < 100 ? prev + 0.8 : prev;
      });
    }, 100);
    
    return () => clearInterval(timer);
  }, [isRedirecting]);

  // 4秒ごとにヒントを切り替え
  useEffect(() => {
    if (isRedirecting) return;
    
    const tipTimer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 4000);
    
    return () => clearInterval(tipTimer);
  }, [tips.length, isRedirecting]);

  // リダイレクト中は専用表示
  if (isRedirecting) {
    return (
      <AnimatePresence>
        <MotionDiv
          key="redirecting-overlay"
          className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box className="w-4/5 max-w-md">
            <Alert 
              status="info" 
              borderRadius="md"
              py={4}
            >
              <AlertIcon />
              <Box>{t("pleaseWait", { defaultValue: "しばらくお待ちください..." })}</Box>
            </Alert>
          </Box>
        </MotionDiv>
      </AnimatePresence>
    );
  }

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

        {/* 手動ホームリンク */}
        <Button 
          colorScheme="blue" 
          variant="link" 
          size="sm" 
          mt={6}
          onClick={() => router.push(`/${locale}`)}
        >
          {t("returnToHome", { defaultValue: "トップページに戻る" })}
        </Button>
      </MotionDiv>
    </AnimatePresence>
  );
}