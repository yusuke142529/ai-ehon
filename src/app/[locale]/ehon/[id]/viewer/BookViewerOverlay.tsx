"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  HStack,
  IconButton,
  Tooltip,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  ScaleFade,
  Slide,
  Portal,
  useBreakpointValue,
} from "@chakra-ui/react";
import {
  ArrowBackIcon,
  ArrowForwardIcon,
  InfoOutlineIcon,
  EditIcon,
  ViewIcon,
  ViewOffIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@chakra-ui/icons";
import { HiVolumeUp, HiVolumeOff } from "react-icons/hi";
import Link from "next/link";

type BookViewerOverlayProps = {
  isVisible: boolean;
  onToggleOverlay: () => void;

  canPrev: boolean;
  canNext: boolean;

  volume: number; // 0~1
  onVolumeChange?: (val: number) => void; // 音量スライダーが変化したときのコールバック

  onPrev: () => void;
  onNext: () => void;
  onToggleImmersive: () => void;
  immersiveMode: boolean;

  onOpenDetail: () => void;
  onEditLink: string;

  t: (key: string) => string;
};

export default function BookViewerOverlay({
  isVisible,
  onToggleOverlay,

  canPrev,
  canNext,

  volume, // 0~1
  onVolumeChange = () => {},

  onPrev,
  onNext,
  onToggleImmersive,
  immersiveMode,

  onOpenDetail,
  onEditLink,

  t,
}: BookViewerOverlayProps) {
  // ▼ 音量スライダーの表示ON/OFF
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // ▼ 音量ローカル管理 (0~100)
  const [localVol, setLocalVol] = useState(Math.round(volume * 100));
  useEffect(() => {
    setLocalVol(Math.round(volume * 100));
  }, [volume]);

  const handleVolumeChange = (val: number) => {
    setLocalVol(val);
  };
  const handleVolumeChangeEnd = (val: number) => {
    // 親へ 0~1 の音量を返す
    onVolumeChange(val / 100);
  };

  // レスポンシブなアイコンサイズ & spacing
  const iconBoxSize = useBreakpointValue({ base: 4, md: 5 });
  const iconSpacing = useBreakpointValue({ base: 2, md: 3 });

  // 背景なしアイコンスタイル
  const noBgIconStyle = {
    variant: "unstyled" as const,
    size: "md" as const,
    color: "white",
    borderRadius: "full" as const,
    transition: "all 0.2s ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    verticalAlign: "middle",
    lineHeight: "0",
    _hover: {
      transform: "scale(1.1)",
      bg: "transparent",
    },
    _active: {
      transform: "scale(0.95)",
      bg: "transparent",
    },
  };

  // 「開く」ボタン用スタイル
  const openButtonStyle = {
    ...noBgIconStyle,
    color: "gray.400",
    _hover: {
      transform: "scale(1.2)",
      color: "gray.300",
    },
  };

  // 音量アイコンボタン位置の取得
  const volumeBtnRef = useRef<HTMLButtonElement>(null);
  const [sliderPos, setSliderPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  useEffect(() => {
    if (showVolumeSlider && volumeBtnRef.current) {
      const rect = volumeBtnRef.current.getBoundingClientRect();
      const btnCenterX = rect.left + rect.width / 2;
      const btnCenterY = rect.top + rect.height / 2;
      setSliderPos({
        top: btnCenterY - 120, // スライダー分だけ上方向にズラす
        left: btnCenterX,
      });
    }
  }, [showVolumeSlider]);

  // ======================================
  // 「開く」ボタン (オーバーレイ非表示時)
  // ======================================
  const renderOpenButton = () => {
    if (isVisible) return null;

    return (
      <Box
        position="absolute"
        bottom="0"
        left="50%"
        transform="translate(-50%, 20%)"
        zIndex={20}
        pointerEvents="auto"
      >
        <Tooltip label={t("Show overlay panel")} hasArrow placement="top">
          <IconButton
            {...openButtonStyle}
            icon={<ChevronUpIcon boxSize={8} />}
            aria-label={t("Show overlay panel")}
            onClick={(e) => {
              e.stopPropagation();
              onToggleOverlay();
            }}
          />
        </Tooltip>
      </Box>
    );
  };

  // ======================================
  // 操作パネル (Slideアニメで上下切り替え)
  // ======================================
  const renderPanel = () => {
    return (
      <Slide
        direction="bottom"
        in={isVisible}
        style={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          zIndex: 20,
          overflow: "visible",
        }}
      >
        <Box
          bg="rgba(0, 0, 0, 0.5)"
          color="white"
          pt={8}
          pb={6}
          px={4}
          borderTopRadius="md"
          overflow="hidden"
        >
          <HStack
            w="full"
            justifyContent="center"
            alignItems="center"
            spacing={iconSpacing}
          >
            {/* 左グループ: 前へ / 次へ / 没入モード */}
            <ScaleFade in={isVisible} initialScale={0.9}>
              <HStack spacing={iconSpacing}>
                {/* 前へ */}
                <Tooltip label={t("viewerPrev")} hasArrow placement="top">
                  <IconButton
                    {...noBgIconStyle}
                    icon={<ArrowBackIcon boxSize={iconBoxSize} />}
                    aria-label={t("viewerPrev")}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPrev();
                    }}
                    isDisabled={!canPrev}
                  />
                </Tooltip>

                {/* 次へ */}
                <Tooltip label={t("viewerNext")} hasArrow placement="top">
                  <IconButton
                    {...noBgIconStyle}
                    icon={<ArrowForwardIcon boxSize={iconBoxSize} />}
                    aria-label={t("viewerNext")}
                    onClick={(e) => {
                      e.stopPropagation();
                      onNext();
                    }}
                    isDisabled={!canNext}
                  />
                </Tooltip>

                {/* 没入モード */}
                <Tooltip
                  label={
                    immersiveMode
                      ? t("viewerFsExit")
                      : t("viewerFsEnter")
                  }
                  hasArrow
                  placement="top"
                >
                  <IconButton
                    {...noBgIconStyle}
                    icon={
                      immersiveMode ? (
                        <ViewOffIcon boxSize={iconBoxSize} />
                      ) : (
                        <ViewIcon boxSize={iconBoxSize} />
                      )
                    }
                    aria-label={
                      immersiveMode
                        ? t("viewerFsExit")
                        : t("viewerFsEnter")
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleImmersive();
                    }}
                  />
                </Tooltip>
              </HStack>
            </ScaleFade>

            {/* 閉じる (中央) */}
            <Tooltip
              label={t("Hide overlay panel")}
              hasArrow
              placement="top"
            >
              <IconButton
                {...noBgIconStyle}
                icon={<ChevronDownIcon boxSize={iconBoxSize} />}
                aria-label={t("Hide overlay panel")}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleOverlay();
                }}
              />
            </Tooltip>

            {/* 右グループ: 詳細 / 編集 / 音量 */}
            <ScaleFade in={isVisible} initialScale={0.9}>
              <HStack spacing={iconSpacing}>
                {/* 詳細 */}
                <Tooltip
                  label={t("viewerDetailOpen")}
                  hasArrow
                  placement="top"
                >
                  <IconButton
                    {...noBgIconStyle}
                    icon={<InfoOutlineIcon boxSize={iconBoxSize} />}
                    aria-label={t("viewerDetailOpen")}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetail();
                    }}
                  />
                </Tooltip>

                {/* 編集 */}
                <Tooltip label={t("viewerEdit")} hasArrow placement="top">
                  <IconButton
                    {...noBgIconStyle}
                    icon={<EditIcon boxSize={iconBoxSize} />}
                    aria-label={t("viewerEdit")}
                    as={Link}
                    href={onEditLink}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Tooltip>

                {/* 音量アイコン: volume === 0 ならミュートアイコン */}
                <Box position="relative" display="flex" alignItems="center">
                  <Tooltip
                    label={t("viewerVolume")}
                    hasArrow
                    placement="top"
                  >
                    <IconButton
                      {...noBgIconStyle}
                      ref={volumeBtnRef}
                      icon={
                        volume === 0 ? (
                          <HiVolumeOff
                            style={{
                              fontSize:
                                iconBoxSize === 4 ? "1rem" : "1.25rem",
                            }}
                          />
                        ) : (
                          <HiVolumeUp
                            style={{
                              fontSize:
                                iconBoxSize === 4 ? "1rem" : "1.25rem",
                            }}
                          />
                        )
                      }
                      aria-label="toggle-volume-slider"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowVolumeSlider((prev) => !prev);
                      }}
                    />
                  </Tooltip>
                </Box>
              </HStack>
            </ScaleFade>
          </HStack>
        </Box>
      </Slide>
    );
  };

  // ===============================
  // 音量スライダーをポータルに表示
  // ===============================
  const renderVolumeSliderPortal = () => {
    if (!showVolumeSlider) return null;

    return (
      <Portal>
        <Box
          position="fixed"
          top={`${sliderPos.top}px`}
          left={`${sliderPos.left}px`}
          transform="translate(-50%, -10px)"
          p={2}
          bg="rgba(0, 0, 0, 0.8)"
          borderRadius="md"
          zIndex={9999}
        >
          <Slider
            orientation="vertical"
            minH="100px"
            value={localVol}
            onChange={handleVolumeChange}
            onChangeEnd={handleVolumeChangeEnd}
            min={0}
            max={100}
            step={1}
            colorScheme="orange"
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb boxSize={4} />
          </Slider>
        </Box>
      </Portal>
    );
  };

  return (
    <>
      {/* 非表示時の「開く」ボタン */}
      {!isVisible && renderOpenButton()}

      {/* 表示時のパネル */}
      {isVisible && renderPanel()}

      {/* 音量スライダー (Portal でオーバーレイ外に描画) */}
      {renderVolumeSliderPortal()}
    </>
  );
}
