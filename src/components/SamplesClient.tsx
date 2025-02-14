"use client";

import React from "react";
import Link from "next/link";
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Container,
  Button,
  useColorModeValue,
  AspectRatio,
  IconButton,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { motion, useScroll, useTransform, Variants } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import BookCard from "@/components/BookCard";
import OnePageEhonCreateTutorial from "@/components/OnePageEhonCreateTutorial";

/* ----------------------------------------------------------------
   (型定義)
----------------------------------------------------------------- */
type SampleBook = {
  id: number;
  title: string;
  pages?: {
    pageNumber: number;
    imageUrl: string;
  }[];
};

interface SamplesClientProps {
  sampleBooks: SampleBook[];
}

export default function SamplesClient({ sampleBooks }: SamplesClientProps) {
  return (
    <Box bg="white" color="gray.800">
      <HeroSection />
      <SamplesListSection sampleBooks={sampleBooks} />
      <TutorialSection />
    </Box>
  );
}

/* ----------------------------------------------------------------
   (A) ヒーローセクション - 改良版
   - 背景にパララックスと2重の波形アニメーション
   - 視認性を高めるため、より濃いオーバーレイとフォントサイズ・行間を調整
   - CTAボタンをグラデーション＋シャドウで強調
   - セクション下に「次のセクションへの矢印」ボタンを追加
----------------------------------------------------------------- */
function HeroSection() {
  const t = useTranslations("common");
  const locale = useLocale();

  // 1. フレームモーションでスクロール時のパララックス
  const { scrollY } = useScroll();
  // 背景とオーバーレイをやや別の速さで動かす
  const yRangeBg = useTransform(scrollY, [0, 200], [0, 100]);
  const yRangeOverlay = useTransform(scrollY, [0, 200], [0, 50]);

  // 2. アニメーション variants
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut", staggerChildren: 0.2 },
    },
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const MotionBox = motion(Box);
  const MotionHeading = motion(Heading);
  const MotionText = motion(Text);

  // ライト/ダークモード対応の半透明オーバーレイ色
  // 以前より濃い目に設定して可読性UP
  const overlayBg = useColorModeValue("rgba(0,0,0,0.6)", "rgba(0,0,0,0.7)");

  // スクロールで次セクションへ移動する関数
  const handleScrollToSamples = () => {
    const section = document.getElementById("sample-list");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Box position="relative" overflow="hidden" minH="80vh">
      {/* 背景パララックス */}
      <MotionBox
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "110%",
          backgroundImage: "url('/images/hero-sample-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: 0,
          y: yRangeBg,
        }}
      />

      {/* 濃いめのオーバーレイ */}
      <MotionBox
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "110%",
          zIndex: 1,
          y: yRangeOverlay,
        }}
        bg={overlayBg}
      />

      {/* ヒーロー内テキスト */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ position: "relative", zIndex: 2 }}
      >
        <Container
          maxW="6xl"
          pt={{ base: 32, md: 40 }}
          pb={{ base: 16, md: 24 }}
          textAlign="center"
        >
          {/* 半透明黒背景のテキストラッパ */}
          <MotionBox
            variants={itemVariants}
            display="inline-block"
            px={6}
            py={4}
            bg="rgba(0, 0, 0, 0.4)"
            borderRadius="md"
            mb={6}
          >
            <MotionHeading
              as="h1"
              fontSize={{ base: "3xl", md: "5xl" }}
              fontWeight="extrabold"
              color="white"
              lineHeight={1.3}
              mb={4}
              variants={itemVariants}
            >
              {t("samplesHeroTitle", { defaultValue: "サンプル絵本を見てみよう" })}
            </MotionHeading>
            <MotionText
              fontSize={{ base: "lg", md: "xl" }}
              maxW="3xl"
              mx="auto"
              color="whiteAlpha.900"
              lineHeight="taller"
              variants={itemVariants}
            >
              {t("samplesHeroDesc", {
                defaultValue:
                  "多彩なサンプル絵本を集めました。ログインなしで自由に読めるので、アプリの雰囲気を体験してみてください。",
              })}
            </MotionText>
          </MotionBox>

          {/* CTAボタン */}
          <MotionBox variants={itemVariants}>
            <Link
              href={`/${locale}/samples#sample-list`}
              style={{ textDecoration: "none" }}
            >
              <Button
                size="lg"
                px={10}
                py={6}
                bgGradient="linear(to-r, teal.500, green.400)"
                color="white"
                fontWeight="bold"
                shadow="xl"
                transition="all 0.3s ease-in-out"
                _hover={{
                  bgGradient: "linear(to-r, teal.600, green.500)",
                  transform: "translateY(-2px)",
                  boxShadow: "2xl",
                }}
              >
                {t("ctaSeeSamples", { defaultValue: "作品一覧を見る" })}
              </Button>
            </Link>
          </MotionBox>
        </Container>
      </motion.section>

      {/* 下矢印アイコンで次セクションへスクロール */}
      <Box
        position="absolute"
        bottom={{ base: 6, md: 10 }}
        left="0"
        w="100%"
        textAlign="center"
        zIndex={3}
      >
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <IconButton
            aria-label="scroll to next section"
            variant="ghost"
            color="whiteAlpha.800"
            fontSize="2xl"
            icon={<ChevronDownIcon boxSize={8} />}
            onClick={handleScrollToSamples}
            _hover={{ color: "white" }}
          />
        </motion.div>
      </Box>

      {/* 2重の波形アニメーション */}
      <Box position="absolute" bottom="0" left="0" w="100%" overflow="hidden" zIndex={2}>
        {/* 波1（下層） */}
        <motion.svg
          viewBox="0 0 1440 150"
          fill="none"
          preserveAspectRatio="none"
          style={{ width: "100%", height: "auto" }}
          animate={{ x: [0, 15, 0] }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
        >
          <defs>
            <linearGradient id="waveGradient1" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#38B2AC" />
              <stop offset="100%" stopColor="#81E6D9" />
            </linearGradient>
          </defs>
          <path
            fill="url(#waveGradient1)"
            d="M0,64L48,80C96,96,192,128,288,138.7C384,149,480,139,576,133.3C672,128,768,128,864,122.7C960,117,1056,107,1152,90.7C1248,75,1344,53,1392,42.7L1440,32L1440,150L1392,150C1344,150,1248,150,1152,150C1056,150,960,150,864,150C768,150,672,150,576,150C480,150,384,150,288,150C192,150,96,150,48,150L0,150Z"
          />
        </motion.svg>

        {/* 波2（上層） */}
        <motion.svg
          viewBox="0 0 1440 150"
          fill="none"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "auto",
            opacity: 0.5,
          }}
          animate={{ x: [0, -15, 0] }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
        >
          <defs>
            <linearGradient id="waveGradient2" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#319795" />
              <stop offset="100%" stopColor="#4FD1C5" />
            </linearGradient>
          </defs>
          <path
            fill="url(#waveGradient2)"
            d="M0,64L48,80C96,96,192,128,288,138.7C384,149,480,139,576,133.3C672,128,768,128,864,122.7C960,117,1056,107,1152,90.7C1248,75,1344,53,1392,42.7L1440,32L1440,150L1392,150C1344,150,1248,150,1152,150C1056,150,960,150,864,150C768,150,672,150,576,150C480,150,384,150,288,150C192,150,96,150,48,150L0,150Z"
          />
        </motion.svg>
      </Box>
    </Box>
  );
}

/* ----------------------------------------------------------------
   (B) サンプル絵本一覧
----------------------------------------------------------------- */
function SamplesListSection({ sampleBooks }: { sampleBooks: SampleBook[] }) {
  const locale = useLocale();
  const t = useTranslations("common");

  return (
    <Box id="sample-list" as="section" bg="white" py={{ base: 16, md: 24 }}>
      <Container maxW="6xl">
        <Heading
          fontSize={{ base: "2xl", md: "3xl" }}
          textTransform="uppercase"
          mb={4}
          textAlign="center"
          color="teal.600"
        >
          {t("samplesTitle", { defaultValue: "サンプル一覧" })}
        </Heading>
        <Text fontSize="sm" color="gray.600" textAlign="center" mb={10}>
          {t("samplesDescription", { defaultValue: "こちらから様々な作品を自由に閲覧できます。" })}
        </Text>

        {sampleBooks.length > 0 ? (
          <SimpleGrid columns={[1, 2, 3]} spacing={6}>
            {sampleBooks.map((book) => {
              const coverImage = book.pages?.[0]?.imageUrl || "/images/sample-cover.png";
              return (
                <Link
                  key={book.id}
                  href={`/${locale}/ehon/${book.id}/viewer`}
                  style={{ textDecoration: "none" }}
                >
                  <Box
                    p={3}
                    borderWidth="1px"
                    borderRadius="md"
                    boxShadow="md"
                    transition="transform 0.3s ease, box-shadow 0.3s ease"
                    _hover={{
                      transform: "translateY(-4px)",
                      boxShadow: "xl",
                    }}
                  >
                    <AspectRatio ratio={3 / 4}>
                    <BookCard title={book.title} coverImage={coverImage} />
                    </AspectRatio>
                  </Box>
                </Link>
              );
            })}
          </SimpleGrid>
        ) : (
          <Text color="gray.500" textAlign="center" mt={6}>
            {t("noSamples", { defaultValue: "表示できる絵本がありません。" })}
          </Text>
        )}
      </Container>
    </Box>
  );
}

/* ----------------------------------------------------------------
   (C) チュートリアルUI表示
----------------------------------------------------------------- */
function TutorialSection() {
  const t = useTranslations("common");

  return (
    <Box as="section" bg="gray.100" py={{ base: 16, md: 24 }} px={[4, 8]}>
      <Container maxW="5xl" textAlign="center">
        <Heading size="lg" mb={4} color="teal.600">
          {t("tutorialCreationTitle", {
            defaultValue: "絵本作成ページのUIを見てみよう (操作はできません)",
          })}
        </Heading>
        <Text fontSize="md" color="gray.600" maxW="3xl" mx="auto" mb={8}>
          {t("tutorialCreationDesc", {
            defaultValue:
              "こちらはログイン後に使える本物の絵本作成フォームの見本です。今は操作できません。",
          })}
        </Text>

        <Box
          bg="white"
          maxW="xl"
          mx="auto"
          boxShadow="xl"
          borderRadius="lg"
          p={8}
        >
          {/* 本物のCreateフォームUIを閲覧のみ可能にしたモック */}
          <OnePageEhonCreateTutorial />
        </Box>
      </Container>
    </Box>
  );
}