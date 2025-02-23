"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Image,
  useDisclosure,
} from "@chakra-ui/react";
import { useTranslations, useLocale } from "next-intl";

import FlipBookWrapper, { FlipBookInstance } from "./components/FlipBookWrapper";
import BookViewerDetailModal from "./BookViewerDetailModal";
import { PageData } from "./components/types";
import { useImmersive } from "@/app/[locale]/LayoutClientWrapper";

// オーバーレイ
import BookViewerOverlay from "./BookViewerOverlay";

/** ページめくりイベント型 */
export interface ViewerFlipEvent {
  data: number;
}

/** BookViewerClientProps */
type BookViewerClientProps = {
  pages: PageData[];
  bookTitle: string;
  bookId: number;
  artStyleId?: number;
  theme?: string;
  genre?: string;
  characters?: string;
  targetAge?: string;
  pageCount?: number; // DB上のページ数
  createdAt?: string;
  isFavorite?: boolean;
};

export default function BookViewerClient({
  pages,
  bookTitle,
  bookId,
  artStyleId,
  theme,
  genre,
  characters,
  targetAge,
  pageCount,
  createdAt,
  isFavorite,
}: BookViewerClientProps) {
  const t = useTranslations("common");
  const locale = useLocale();

  // 没入モード
  const { immersiveMode, setImmersiveMode } = useImmersive();
  function toggleImmersiveMode() {
    setImmersiveMode((prev) => !prev);
  }

  // FlipBook
  const flipBookRef = useRef<FlipBookInstance>(null);
  const [pageIndex, setPageIndex] = useState(0);

  // 音声再生関連
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // 「まだアンロックされていない」状態。初期値 false (ロック中)
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // 初期化（音声ファイルの読み込みなど）
  useEffect(() => {
    const audio = new Audio("/sounds/page-flip.mp3");
    audio.preload = "auto";
    audioRef.current = audio;
  }, []);

  // 初回のタップで音声アンロック
  async function handleFirstTap() {
    if (!audioRef.current || audioUnlocked) return;
    try {
      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAudioUnlocked(true);
      console.log("Audio unlocked by first tap.");
    } catch (err) {
      console.error("Audio unlock failed:", err);
    }
  }

  // 音量: 0 ~ 1
  const [volume, setVolume] = useState(0.5);
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // 手動でページめくり
  function goNext() {
    flipBookRef.current?.pageFlip()?.flipNext();
  }
  function goPrev() {
    flipBookRef.current?.pageFlip()?.flipPrev();
  }

  // 詳細モーダル
  const { isOpen, onOpen, onClose } = useDisclosure();

  // レイアウト用計算
  const outerRef = useRef<HTMLDivElement>(null);
  const BASE_WIDTH = 600;
  const BASE_HEIGHT = 900;
  const BASE_BORDER = 40;
  const FRAME_WIDTH = BASE_WIDTH + BASE_BORDER * 2;
  const FRAME_HEIGHT = BASE_HEIGHT + BASE_BORDER * 2;

  const [scale, setScale] = useState(1);
  const [flipKey, setFlipKey] = useState(0);

  useEffect(() => {
    function handleResize() {
      if (!outerRef.current) return;
      const containerWidth = outerRef.current.clientWidth;
      const containerHeight = outerRef.current.clientHeight;
      const scaleFactor = Math.min(
        containerWidth / FRAME_WIDTH,
        containerHeight / FRAME_HEIGHT
      );
      setScale(scaleFactor);
      setFlipKey((prev) => prev + 1);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [FRAME_WIDTH, FRAME_HEIGHT]);

  // オーバーレイの開閉
  const [overlayVisible, setOverlayVisible] = useState(false);

  // 初回ロード時だけ数秒表示後に自動で閉じる
  useEffect(() => {
    setOverlayVisible(true);
    const timer = setTimeout(() => {
      setOverlayVisible(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  function handleToggleOverlay() {
    setOverlayVisible((prev) => !prev);
  }

  // ページ総数 (DBからの pageCount がなければ pages.length)
  const totalPages = pageCount ?? pages.length;

  /** ========== ドラッグ vs タップ 判定ロジック ========== */

  // ドラッグ中かどうかを管理するフラグ
  const [isDragging, setIsDragging] = useState(false);
  // タッチ／マウスダウンの開始座標
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  // pointerDown / touchStart
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // マウスの右クリックや中クリックなどは無視したい場合
    if (e.button !== 0) return; // 左クリックのみ対象

    touchStartPos.current = { x: e.clientX, y: e.clientY };
    setIsDragging(false);
  }

  // pointerMove / touchMove
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!touchStartPos.current) return;
    const dx = Math.abs(e.clientX - touchStartPos.current.x);
    const dy = Math.abs(e.clientY - touchStartPos.current.y);
    // 例えば 10px 以上移動したらドラッグ扱い
    if (dx + dy > 10) {
      setIsDragging(true);
    }
  }

  // pointerUp / touchEnd
  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    // ドラッグだった場合 → タップ扱いしない
    if (isDragging) {
      setIsDragging(false);
      return;
    }
    // もしクリックした要素が「背景」以外(子要素)ならタップ処理をスキップ
    // 例: Overlayのボタンなど
    if (e.currentTarget !== e.target) {
      return;
    }

    // ドラッグでなく、要素自体をクリック → ページをタップで送り
    handleTapToFlip(e);
  }

  /** 画面タップ時に左右判定して前後ページへ */
  function handleTapToFlip(e: React.PointerEvent<HTMLDivElement>) {
    // 要素内座標を計算
    const rect = e.currentTarget.getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    const half = rect.width / 2;
    if (tapX > half) {
      goNext();
    } else {
      goPrev();
    }
  }

  return (
    <>
      <Flex direction="column" minH="100vh">
        {/* 
          1) audioUnlocked=false の間だけ、全画面タップを拾う透明オーバーレイを表示 
        */}
        {!audioUnlocked && (
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            zIndex={9999}
            bg="rgba(255, 255, 255, 0.01)"
            onClick={handleFirstTap}
          >
            <Flex
              width="100%"
              height="100%"
              align="center"
              justify="center"
              pointerEvents="none"
            >
              <Text
                color="white"
                bg="rgba(0,0,0,0.5)"
                px={4}
                py={2}
                borderRadius="md"
                pointerEvents="none"
              >
                {t("tapToUnlockSound")}
              </Text>
            </Flex>
          </Box>
        )}

        {/* 中央領域 */}
        <Flex
          ref={outerRef}
          flex="1"
          position="relative"
          overflow="hidden"
          align="center"
          justify="center"
          bg="#FAF7F2"
        >
          <Box
            position="relative"
            width={`${FRAME_WIDTH * scale}px`}
            height={`${FRAME_HEIGHT * scale}px`}
          >
            {/* 枠 */}
            <Box
              position="absolute"
              top="0"
              left="0"
              width={`${FRAME_WIDTH * scale}px`}
              height={`${FRAME_HEIGHT * scale}px`}
              border={`${BASE_BORDER * scale}px solid transparent`}
              sx={{
                borderImage: "url('/images/border-image_1.png') round",
                borderImageSlice: 100,
              }}
              borderRadius="md"
              bg="#ECEAD8"
              pointerEvents="none"
              zIndex={1}
            />

            {/* FlipBook + ドラッグエリア */}
            <Box
              position="absolute"
              top={`${BASE_BORDER * scale}px`}
              left={`${BASE_BORDER * scale}px`}
              width={`${BASE_WIDTH * scale}px`}
              height={`${BASE_HEIGHT * scale}px`}
              bg="#ECEAD8"
              overflow="hidden"
              zIndex={2}
              // ★ Pointerイベントでドラッグとタップを判定する
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <FlipBookWrapper
                key={flipKey}
                ref={flipBookRef}
                width={BASE_WIDTH * scale}
                height={BASE_HEIGHT * scale}
                singlePage
                showCover={false}
                useMouseEvents
                clickEventForward={false}
                mobileScrollSupport
                maxShadowOpacity={0.5}
                swipeDistance={20} // 軽いフリックでめくり開始
                flippingTime={800} // アニメ時間(例:0.8s)
                style={{ backgroundColor: "#ECEAD8" }}
                onManualStart={() => {
                  // ドラッグ開始(ライブラリ的にはここで始まる)
                }}
                onFlip={(e) => {
                  // ページがめくり終わったタイミングで音を鳴らす
                  setPageIndex(e.data);
                  if (audioRef.current && audioUnlocked) {
                    audioRef.current.currentTime = 0;
                    audioRef.current
                      .play()
                      .catch((err) =>
                        console.error("Page flip sound failed:", err)
                      );
                  }
                }}
              >
                {pages.map((p, index) => {
                  const displayPageNumber = p.pageNumber ?? index + 1;
                  return (
                    <div
                      key={p.id}
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#ECEAD8",
                        boxSizing: "border-box",
                        position: "relative",
                      }}
                    >
                      {/* ページ内スクロールエリア */}
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          overflowY: "auto",
                          WebkitOverflowScrolling: "touch",
                          padding: "16px",
                          boxSizing: "border-box",
                        }}
                      >
                        {/* ページ上部: タイトル & ページ数 */}
                        <Flex justify="space-between" align="center" mb={4}>
                          <Heading
                            as="h2"
                            fontSize="xl"
                            fontFamily='"Kosugi Maru", sans-serif'
                            color="#4A3C31"
                          >
                            {bookTitle}
                          </Heading>
                          <Text
                            fontSize="sm"
                            color="#4A3C31"
                            fontWeight="semibold"
                          >
                            {displayPageNumber}/{totalPages}page
                          </Text>
                        </Flex>

                        {p.imageUrl ? (
                          <Image
                            src={p.imageUrl}
                            alt={`Page ${displayPageNumber}`}
                            maxWidth="100%"
                            height="auto"
                            borderRadius="4px"
                            mb={3}
                          />
                        ) : (
                          <Box bg="gray.200" height="200px" mb={3}>
                            <Text fontSize="md">{t("viewerNoImage")}</Text>
                          </Box>
                        )}

                        <Text
                          fontSize="md"
                          fontFamily='"Kosugi Maru", sans-serif'
                          whiteSpace="pre-wrap"
                          lineHeight="1.6"
                          color="#4A3C31"
                        >
                          {p.text || t("viewerNoText")}
                        </Text>
                      </div>
                    </div>
                  );
                })}
              </FlipBookWrapper>

              {/* オーバーレイ */}
              <BookViewerOverlay
                isVisible={overlayVisible}
                onToggleOverlay={handleToggleOverlay}
                canPrev={pageIndex > 0}
                canNext={pageIndex < pages.length - 1}
                onPrev={goPrev}
                onNext={goNext}
                volume={volume}
                onVolumeChange={(val) => setVolume(val)}
                immersiveMode={immersiveMode}
                onToggleImmersive={toggleImmersiveMode}
                onOpenDetail={onOpen}
                onEditLink={`/${locale}/ehon/${bookId}`}
                t={t}
              />
            </Box>
          </Box>
        </Flex>
      </Flex>

      {/* 詳細モーダル */}
      <BookViewerDetailModal
        bookId={bookId}
        isOpen={isOpen}
        onClose={onClose}
        locale={locale}
        title={bookTitle}
        theme={theme}
        genre={genre}
        characters={characters}
        artStyleId={artStyleId}
        targetAge={targetAge}
        pageCount={totalPages}
        createdAt={createdAt}
        isFavorite={isFavorite}
      />
    </>
  );
}
