"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Box,
  Center,
  IconButton,
  Tooltip,
  Heading,
  Text,
  Image,
  Progress,
  useDisclosure,
  HStack,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
} from "@chakra-ui/react";
import {
  ArrowBackIcon,
  ArrowForwardIcon,
  ViewIcon,
  ViewOffIcon,
  InfoOutlineIcon,
  EditIcon,
} from "@chakra-ui/icons";
import { HiVolumeUp, HiVolumeOff } from "react-icons/hi";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import FlipBookWrapper from "./components/FlipBookWrapper";
import BookViewerDetailModal from "./BookViewerDetailModal";
import { PageData } from "./components/types";

type BookViewerClientProps = {
  pages: PageData[];
  bookTitle: string;
  bookId: number;
};

export default function BookViewerClient({
  pages,
  bookTitle,
  bookId,
  ...props
}: BookViewerClientProps) {
  const t = useTranslations("common");
  const locale = useLocale();

  // Google Fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Kosugi+Maru&display=swap";
    document.head.appendChild(link);

    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  const flipBookRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ページインデックス
  const [pageIndex, setPageIndex] = useState(0);

  // フルスクリーン
  const [isFullscreen, setIsFullscreen] = useState(false);
  function handleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  }
  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
    };
  }, []);

  // Detail modal
  const { isOpen, onOpen, onClose } = useDisclosure();

  // ページめくり音
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const audio = new Audio("/sounds/page-flip.mp3");
    audio.preload = "auto"; // 遅延を最小化
    audioRef.current = audio;
  }, []);

  // 音量管理
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  function handleToggleMute() {
    setIsMuted(!isMuted);
  }

  // ページめくり（ボタンクリック）
  const goNext = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    flipBookRef.current?.pageFlip().flipNext();
  };
  const goPrev = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    flipBookRef.current?.pageFlip().flipPrev();
  };

  // Flipbook のサイズ管理
  const [flipKey, setFlipKey] = useState(0);
  const [dimension, setDimension] = useState({ width: 600, height: 900 });

  useEffect(() => {
    function handleResize() {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth - 80;
      if (containerWidth < 0) return;

      const aspect = 2 / 3; // 2:3
      const newWidth = containerWidth;
      const newHeight = newWidth / aspect;

      setDimension({ width: newWidth, height: newHeight });
      setFlipKey((prev) => prev + 1);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // オーバーレイ（下部コントローラ）表示
  const [overlayVisible, setOverlayVisible] = useState(false);

  // ❶ オーバーレイ自体を上に、中央クリック用を下にするために zIndex を指定
  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    background: "rgba(0, 0, 0, 0.4)",
    color: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px",
    transition: "opacity 0.3s ease, transform 0.3s ease",
    opacity: overlayVisible ? 1 : 0,
    transform: overlayVisible ? "translateY(0)" : "translateY(20px)",
    pointerEvents: overlayVisible ? "auto" : "none",
    zIndex: 10 // ← オーバーレイのほうが前面に来るように
  };

  const iconButtonStyle = {
    variant: "ghost",
    size: "lg" as const,
    borderRadius: "full",
    transition: "all 0.2s ease",
    _hover: {
      transform: "scale(1.1)",
      bg: "blackAlpha.200",
    },
    _active: {
      transform: "scale(0.95)",
      bg: "blackAlpha.300",
    },
  };

  const boundary = 100;

  // ❷ 「中央クリック領域」はオーバーレイが非表示のときだけクリックを有効にする
  const centerBlockerStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: `${boundary}px`,
    width: `calc(100% - ${boundary * 2}px)`,
    height: "100%",
    pointerEvents: overlayVisible ? "none" : "auto",
    // overlayVisible が true ならクリックを受け付けない（オーバーレイ操作を優先）
    zIndex: 5
  };

  const sideOverlayStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    height: "100%",
    pointerEvents: "none",
  };

  return (
    <Box w="100%" minH="100vh" bg="#FAF7F2">
      <Center py={8}>
        <Box
          ref={containerRef}
          position="relative"
          border="40px solid transparent"
          sx={{
            borderImage: "url('/images/border-image_1.png') round",
            borderImageSlice: { base: 100, md: 160 },
          }}
          borderRadius="md"
          maxW="1200px"
          w="90vw"
          overflow="hidden"
        >
          {dimension.width < 1 || dimension.height < 1 ? (
            <Box p={8}>
              <Text>Loading size...</Text>
            </Box>
          ) : (
            <Box>
              <FlipBookWrapper
                key={flipKey}
                ref={flipBookRef}
                width={dimension.width}
                height={dimension.height}
                singlePage
                showCover={false}
                useMouseEvents={true}
                clickEventForward={false}
                mobileScrollSupport={false}
                maxShadowOpacity={0.5}
                style={{ backgroundColor: "#ECEAD8" }}
                onManualStart={() => {
                  // ドラッグ開始時に音を鳴らす
                  if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch(() => {});
                  }
                }}
                onFlip={(e: any) => {
                  setPageIndex(e.data);
                }}
              >
                {pages.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      width: "100%",
                      height: "100%",
                      boxSizing: "border-box",
                      padding: "16px",
                      backgroundColor: "#ECEAD8",
                    }}
                  >
                    {/* タイトル */}
                    <Heading
                      as="h2"
                      fontSize={{ base: "lg", md: "3xl", lg: "4xl" }}
                      fontFamily='"Kosugi Maru", sans-serif'
                      color="#4A3C31"
                      mb={4}
                    >
                      {bookTitle}
                    </Heading>

                    {/* 画像 or プレースホルダ */}
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl}
                        alt={`Page ${p.pageNumber}`}
                        maxWidth="100%"
                        height="auto"
                        borderRadius="4px"
                        mb={3}
                      />
                    ) : (
                      <Box bg="gray.200" height="200px" mb={3}>
                        <Text fontSize={{ base: "md", md: "xl", lg: "2xl" }}>
                          {t("viewerNoImage")}
                        </Text>
                      </Box>
                    )}

                    {/* テキスト */}
                    <Text
                      fontSize={{ base: "md", md: "xl", lg: "2xl" }}
                      fontFamily='"Kosugi Maru", sans-serif'
                      whiteSpace="pre-wrap"
                      lineHeight="1.6"
                      color="#4A3C31"
                    >
                      {p.text || t("viewerNoText")}
                    </Text>
                  </div>
                ))}
              </FlipBookWrapper>
            </Box>
          )}

          {/* オーバーレイON/OFF用クリック領域 */}
          <Box
            style={centerBlockerStyle}
            onClick={() => setOverlayVisible((prev) => !prev)}
          />
          <Box style={{ ...sideOverlayStyle, left: 0, width: `${boundary}px` }} />
          <Box style={{ ...sideOverlayStyle, right: 0, width: `${boundary}px` }} />

          {/* 下部オーバーレイ */}
          <Box style={overlayStyle}>
            <HStack spacing={3} mb={2}>
              {/* 前へ */}
              <Tooltip label={t("viewerPrev")} hasArrow placement="top">
                <IconButton
                  {...iconButtonStyle}
                  colorScheme="teal"
                  icon={<ArrowBackIcon boxSize={6} />}
                  onClick={(e) => {
                    e.stopPropagation(); 
                    goPrev();
                  }}
                  isDisabled={pageIndex === 0}
                  aria-label={t("viewerPrev")}
                />
              </Tooltip>

              {/* 次へ */}
              <Tooltip label={t("viewerNext")} hasArrow placement="top">
                <IconButton
                  {...iconButtonStyle}
                  colorScheme="teal"
                  icon={<ArrowForwardIcon boxSize={6} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    goNext();
                  }}
                  isDisabled={pageIndex >= pages.length - 1}
                  aria-label={t("viewerNext")}
                />
              </Tooltip>

              {/* フルスクリーン */}
              <Tooltip
                label={isFullscreen ? t("viewerFsExit") : t("viewerFsEnter")}
                hasArrow
                placement="top"
              >
                <IconButton
                  {...iconButtonStyle}
                  colorScheme="teal"
                  icon={isFullscreen ? <ViewOffIcon boxSize={6} /> : <ViewIcon boxSize={6} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFullscreen();
                  }}
                  aria-label={isFullscreen ? t("viewerFsExit") : t("viewerFsEnter")}
                />
              </Tooltip>

              {/* 詳細モーダル */}
              <Tooltip label={t("viewerDetailOpen")} hasArrow placement="top">
                <IconButton
                  {...iconButtonStyle}
                  colorScheme="blue"
                  icon={<InfoOutlineIcon boxSize={6} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen();
                  }}
                  aria-label={t("viewerDetailOpen")}
                />
              </Tooltip>

              {/* 編集ボタン */}
              <Tooltip label={t("viewerEdit")} hasArrow placement="top">
                <IconButton
                  {...iconButtonStyle}
                  colorScheme="purple"
                  icon={<EditIcon boxSize={6} />}
                  as={Link}
                  href={`/${locale}/ehon/${bookId}`}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={t("viewerEdit")}
                />
              </Tooltip>

              {/* 音量ポップオーバー */}
              <Popover placement="top">
                <PopoverTrigger>
                  {/* ❸ PopoverTrigger の直下は 1 要素 (Box) のみにする */}
                  <Box>
                    <Tooltip label={t("viewerVolume")} hasArrow placement="top">
                      <IconButton
                        {...iconButtonStyle}
                        colorScheme="orange"
                        icon={isMuted ? <HiVolumeOff size={22} /> : <HiVolumeUp size={22} />}
                        aria-label="Volume"
                        // ↓ 下部オーバーレイ内では stopPropagation() はなくてもOK
                        //   もし「アイコンをクリックしても下の centerBlocker にイベントが流れる」のを完全に防ぎたい場合は書く
                        // onClick={(e) => e.stopPropagation()}
                      />
                    </Tooltip>
                  </Box>
                </PopoverTrigger>

                <PopoverContent
                  bg="white"
                  _focus={{ outline: "none" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <PopoverArrow />
                  <PopoverBody>
                    <HStack spacing={2}>
                      <IconButton
                        size="md"
                        variant="ghost"
                        colorScheme="orange"
                        icon={isMuted ? <HiVolumeOff /> : <HiVolumeUp />}
                        aria-label="Mute toggle"
                        onClick={() => handleToggleMute()}
                      />
                      <Slider
                        value={Math.round(volume * 100)}
                        onChange={(val) => {
                          setVolume(val / 100);
                          if (isMuted) {
                            setIsMuted(false);
                          }
                        }}
                        min={0}
                        max={100}
                        step={1}
                        w="100px"
                      >
                        <SliderTrack>
                          <SliderFilledTrack bg="orange.300" />
                        </SliderTrack>
                        <SliderThumb boxSize={4} />
                      </Slider>
                    </HStack>
                  </PopoverBody>
                </PopoverContent>
              </Popover>
            </HStack>

            {/* ページ数表示 & プログレスバー */}
            <Box w="80%" maxW="400px">
              <Center mb={2}>
                <Text fontSize="lg" color="gray.100">
                  {pageIndex + 1} / {pages.length}
                </Text>
              </Center>
              <Progress
                value={((pageIndex + 1) / pages.length) * 100}
                size="xs"
                colorScheme="teal"
                borderRadius="md"
              />
            </Box>
          </Box>

          <BookViewerDetailModal
            bookId={bookId}
            isOpen={isOpen}
            onClose={onClose}
            locale={locale}
            title={bookTitle}
            {...props}
          />
        </Box>
      </Center>
    </Box>
  );
}
