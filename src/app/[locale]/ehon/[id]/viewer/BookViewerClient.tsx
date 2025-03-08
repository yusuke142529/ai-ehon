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
import BookViewerOverlay from "./BookViewerOverlay";

/** BookViewerClientProps */
interface BookViewerClientProps {
  pages: PageData[];
  bookTitle: string;
  bookId: number;
  artStyleId?: number;
  theme?: string;
  genre?: string;
  characters?: string;
  targetAge?: string;
  pageCount?: number;
  createdAt?: string;
  isFavorite?: boolean;
  isSharedView?: boolean;
  showEditButton?: boolean; // 所有者チェック結果を受け取るための新しいプロパティ
}

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
  isSharedView = false,
  showEditButton = false, // デフォルト値を false に設定
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

  // 手動でページめくり
  function goNext() {
    flipBookRef.current?.pageFlip()?.flipNext();
  }
  function goPrev() {
    flipBookRef.current?.pageFlip()?.flipPrev();
  }

  // 音声再生関連
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // Load the flip sound (クライアントのみでOK)
  useEffect(() => {
    try {
      const audio = new Audio("/sounds/page-flip.mp3");
      audio.preload = "auto";
      audioRef.current = audio;
    } catch (error) {
      console.error("Error loading audio:", error);
    }
  }, []);

  // Unlock audio on first user interaction
  async function handleFirstTap() {
    if (!audioRef.current || audioUnlocked) return;
    try {
      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAudioUnlocked(true);
    } catch (err) {
      console.error("Audio unlock failed:", err);
    }
  }

  // Volume
  const [volume, setVolume] = useState(0.5);
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Play sound on page flip
  function handleFlip(e: { data: number }) {
    setPageIndex(e.data);
    if (audioRef.current && audioUnlocked) {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .catch((err) => console.error("Page flip sound failed:", err));
    }
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

  // Handle rescaling
  useEffect(() => {
    function handleResize() {
      if (!outerRef.current) return;
      const containerWidth = outerRef.current.clientWidth;
      const containerHeight = outerRef.current.clientHeight;
      const newScale = Math.min(
        containerWidth / FRAME_WIDTH,
        containerHeight / FRAME_HEIGHT
      );

      // If the scale changed significantly, re-init FlipBook
      if (Math.abs(newScale - scale) > 0.05) {
        setScale(newScale);
        setFlipKey((prev) => prev + 1);
      } else {
        setScale(newScale);
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [FRAME_WIDTH, FRAME_HEIGHT, scale]);

  // After re-init, restore the current page
  useEffect(() => {
    flipBookRef.current?.pageFlip()?.flip(pageIndex);
  }, [flipKey, pageIndex]);

  // 初回ロード時だけ数秒表示後に自動で閉じるオーバーレイ
  const [overlayVisible, setOverlayVisible] = useState(false);
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

  const totalPages = pageCount ?? pages.length;

  return (
    <>
      <Flex direction="column" minH="100vh">
        {/* 音声アンロック用オーバーレイ */}
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

            {/* FlipBook本体 (no mouse dragging) */}
            <Box
              position="absolute"
              top={`${BASE_BORDER * scale}px`}
              left={`${BASE_BORDER * scale}px`}
              width={`${BASE_WIDTH * scale}px`}
              height={`${BASE_HEIGHT * scale}px`}
              bg="#ECEAD8"
              overflow="hidden"
              zIndex={2}
            >
              <FlipBookWrapper
                key={flipKey}
                ref={flipBookRef}
                width={BASE_WIDTH * scale}
                height={BASE_HEIGHT * scale}
                singlePage
                showCover={false}
                useMouseEvents={false} // Disable drag events
                swipeDistance={0}      // No swiping
                mobileScrollSupport
                flippingTime={800}
                maxShadowOpacity={0.5}
                style={{ backgroundColor: "#ECEAD8" }}
                onFlip={handleFlip}
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

              {/*
                Invisible "hot zones" for clicking:
                Left side -> goPrev
                Right side -> goNext
              */}
              <Box
                position="absolute"
                top={0}
                left={0}
                width="15%"
                height="100%"
                zIndex={3}
                cursor="pointer"
                onClick={goPrev}
              />
              <Box
                position="absolute"
                top={0}
                right={0}
                width="15%"
                height="100%"
                zIndex={3}
                cursor="pointer"
                onClick={goNext}
              />

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
                onEditLink={isSharedView ? "" : `/${locale}/ehon/${bookId}`}
                showEditButton={showEditButton}
                t={t}
              />
            </Box>
          </Box>
        </Flex>
      </Flex>

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
