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
  Portal,
  useBreakpointValue,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
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
  /** オーバーレイ（操作パネル）の表示／非表示 */
  isVisible: boolean;
  onToggleOverlay: () => void;

  /** ページめくり可能かどうか */
  canPrev: boolean;
  canNext: boolean;

  /** 音量関連 */
  volume: number; // 0~1
  onVolumeChange?: (val: number) => void;

  /** ページめくり実行 */
  onPrev: () => void;
  onNext: () => void;

  /** 没入モード(フルスクリーン風)の切り替え */
  onToggleImmersive: () => void;
  immersiveMode: boolean;

  /** 詳細モーダルを開く・編集リンク */
  onOpenDetail: () => void;
  onEditLink: string;
  
  /** 編集ボタン表示条件 */
  showEditButton?: boolean;

  /** i18n 用翻訳関数 */
  t: (key: string) => string;
};

export default function BookViewerOverlay({
  isVisible,
  onToggleOverlay,

  canPrev,
  canNext,

  volume,
  onVolumeChange = () => {},

  onPrev,
  onNext,
  onToggleImmersive,
  immersiveMode,

  onOpenDetail,
  onEditLink,
  showEditButton = true,

  t,
}: BookViewerOverlayProps) {
  // -----------------------------------------
  // 音量スライダーの表示ON/OFF
  // -----------------------------------------
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // ローカル音量 (0~100) 管理
  const [localVol, setLocalVol] = useState(Math.round(volume * 100));
  useEffect(() => {
    setLocalVol(Math.round(volume * 100));
  }, [volume]);

  const handleVolumeChange = (val: number) => {
    setLocalVol(val);
  };
  const handleVolumeChangeEnd = (val: number) => {
    onVolumeChange(val / 100);
  };

  // オーバーレイが非表示になったらスライダーを閉じる
  useEffect(() => {
    if (!isVisible) {
      setShowVolumeSlider(false);
    }
  }, [isVisible]);

  // -----------------------------------------
  // アイコンサイズ / スペース (レスポンシブ)
  // -----------------------------------------
  const iconBoxSize = useBreakpointValue({ base: 4, md: 5 });
  const iconSpacing = useBreakpointValue({ base: 2, md: 3 });

  // 「背景なしアイコン」のスタイル
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

  // -----------------------------------------
  // 音量スライダーの Portal 表示位置を計算
  // -----------------------------------------
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
        top: btnCenterY - 120, // スライダーをボタンの上に表示
        left: btnCenterX,
      });
    }
  }, [showVolumeSlider]);

  // -----------------------------------------
  // 【A】最初の2秒だけ表示するガイド用レイヤー
  //    -> 飾り枠の「内側」に収まるよう、position="absolute"
  // -----------------------------------------
  const [showClickableGuide, setShowClickableGuide] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowClickableGuide(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  /**
   * ガイド用の半透明レイヤー＋矢印アイコン
   *  - pointerEvents="none" なのでクリック／タッチはホットゾーンに通す
   *  - position="absolute" + width="100%" + height="100%" で
   *    親コンテナの枠内だけを覆う
   */
  const renderClickableArrowsGuide = () => (
    <AnimatePresence>
      {showClickableGuide && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 10,
            pointerEvents: "none"
          }}
        >
          {/* 左側ガイド */}
          <Box
            position="absolute"
            top="0"
            left="0"
            width="15%"
            height="100%"
            bg="rgba(0,0,0,0.4)"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <ArrowBackIcon boxSize={12} color="white" />
          </Box>
          {/* 右側ガイド */}
          <Box
            position="absolute"
            top="0"
            right="0"
            width="15%"
            height="100%"
            bg="rgba(0,0,0,0.4)"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <ArrowForwardIcon boxSize={12} color="white" />
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // -----------------------------------------
  // 【B】継続的にクリックを受け付けるホットゾーン
  //    -> ガイド消失後もページめくり可能
  // -----------------------------------------
  const renderHotZones = () => (
    <>
      {/* 左ホットゾーン */}
      <Box
        position="absolute"
        top="0"
        left="0"
        width="15%"
        height="100%"
        bg="transparent"
        zIndex={9}
        onClick={(e) => {
          e.stopPropagation();
          if (canPrev) onPrev();
        }}
      />
      {/* 右ホットゾーン */}
      <Box
        position="absolute"
        top="0"
        right="0"
        width="15%"
        height="100%"
        bg="transparent"
        zIndex={9}
        onClick={(e) => {
          e.stopPropagation();
          if (canNext) onNext();
        }}
      />
    </>
  );

  // -----------------------------------------
  // オーバーレイ非表示時の「開く」ボタン
  // -----------------------------------------
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

  // -----------------------------------------
  // オーバーレイ表示時のパネル (motion.divでアニメーション)
  // -----------------------------------------
  const renderPanel = () => (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
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
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
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
                      immersiveMode ? t("viewerFsExit") : t("viewerFsEnter")
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
                        immersiveMode ? t("viewerFsExit") : t("viewerFsEnter")
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleImmersive();
                      }}
                    />
                  </Tooltip>
                </HStack>
              </motion.div>

              {/* 閉じる (中央) */}
              <Tooltip label={t("Hide overlay panel")} hasArrow placement="top">
                <IconButton
                  {...noBgIconStyle}
                  icon={<ChevronDownIcon boxSize={iconBoxSize} />}
                  aria-label={t("Hide overlay panel")}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleOverlay();
                    setShowVolumeSlider(false);
                  }}
                />
              </Tooltip>

              {/* 右グループ: 詳細 / 編集 / 音量 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <HStack spacing={iconSpacing}>
                  {/* 詳細 */}
                  <Tooltip label={t("viewerDetailOpen")} hasArrow placement="top">
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

                  {/* 編集ボタン - 条件付き表示 - ここを修正 */}
                  {showEditButton && (
                    <Tooltip label={t("viewerEdit")} hasArrow placement="top">
                      <Box as="span" display="inline-block">
                        <Link href={onEditLink} onClick={(e) => e.stopPropagation()} passHref>
                          <IconButton
                            {...noBgIconStyle}
                            icon={<EditIcon boxSize={iconBoxSize} />}
                            aria-label={t("viewerEdit")}
                            as="a"
                          />
                        </Link>
                      </Box>
                    </Tooltip>
                  )}

                  {/* 音量アイコン: volume === 0ならミュートアイコン */}
                  <Box position="relative" display="flex" alignItems="center">
                    <Tooltip label={t("viewerVolume")} hasArrow placement="top">
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
              </motion.div>
            </HStack>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // -----------------------------------------
  // 音量スライダーをポータルで表示 (画面上)
  // -----------------------------------------
  const renderVolumeSliderPortal = () => {
    if (!showVolumeSlider) return null;
    return (
      <Portal>
        {/* 
          ここでは position="fixed" なので画面全体を基準にスライダーを表示
          → 飾り枠内に限定したい場合は、本コンポーネント内で 
            position="absolute" + 親Box参照 等の実装に切り替える必要あり 
        */}
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
      {/* A: 2秒間だけ見えるガイド */}
      {renderClickableArrowsGuide()}

      {/* B: いつでもタップ可能な透明ホットゾーン */}
      {renderHotZones()}

      {/* オーバーレイ非表示時の「開く」ボタン */}
      {!isVisible && renderOpenButton()}

      {/* オーバーレイ表示時のパネル */}
      {renderPanel()}

      {/* 音量スライダー */}
      {renderVolumeSliderPortal()}
    </>
  );
}