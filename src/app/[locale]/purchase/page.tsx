"use client";

import { useMemo } from "react";
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Heading,
  SimpleGrid,
  Text,
  useColorModeValue,
  useToast,
  Flex,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";

const USD_PLANS = [
  { price: 5, credits: 400 },
  { price: 10, credits: 1000 },
  { price: 20, credits: 2100 },
  { price: 40, credits: 4500 },
];

const JPY_PLANS = [
  { price: 500, credits: 300 },
  { price: 1000, credits: 650 },
  { price: 3000, credits: 2000 },
  { price: 5000, credits: 3500 },
];

type Currency = "usd" | "jpy";

export default function PurchasePage() {
  // purchase 名前空間
  const tPurchase = useTranslations("purchase");
  const locale = useLocale();
  const toast = useToast();

  const currency: Currency = useMemo(() => {
    if (locale.startsWith("ja")) {
      return "jpy";
    }
    return "usd";
  }, [locale]);

  const planList = currency === "usd" ? USD_PLANS : JPY_PLANS;

  // カラーモード設定
  const cardBg = useColorModeValue("white", "gray.700");
  const cardBorderColor = useColorModeValue("gray.200", "gray.600");
  const pageBg = useColorModeValue("gray.50", "gray.800");
  const headingGradient = useColorModeValue(
    "linear(to-r, teal.500, blue.500)",
    "linear(to-r, teal.300, blue.400)"
  );
  const textColorNote = useColorModeValue("gray.600", "gray.300");

  interface Plan {
    price: number;
    credits: number;
  }

  // ★ テスト実装のため、ここで購入処理を短絡化
  const handlePurchase = async (plan: Plan) => {
    // ここで一切のリクエストや遷移をしない
    // テストメッセージだけ表示して終了
    toast({
      title: "Test Mode",
      description: "Currently in test mode, so purchase is disabled.",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
    console.log("[TEST MODE] Purchase attempt was blocked:", plan);
    return; // ここで終了
  };

  // currencyUsd / currencyJpy などを適宜表示したい場合
  const currencyLabel =
    currency === "usd"
      ? tPurchase("currencyUsd")
      : tPurchase("currencyJpy");

  return (
    <Box minH="100vh" bg={pageBg} pb={16}>
      <Box
        as="section"
        w="full"
        py={[10, 12]}
        px={4}
        bgGradient="linear(to-r, blue.500, purple.600)"
        color="white"
        textAlign="center"
        mb={10}
      >
        <Heading size="2xl" fontWeight="extrabold" mb={2}>
          {tPurchase("pageHeading")}
        </Heading>
        <Text fontSize="lg" opacity={0.9}>
          {tPurchase("description")}
        </Text>
        <Text mt={2} fontSize="sm" opacity={0.8}>
          {currencyLabel}
        </Text>
      </Box>

      {/* ★★★ 注意メッセージを表示する部分 ★★★ */}
      <Box maxW="7xl" mx="auto" px={[4, 6]} mb={6}>
        <Text
          fontSize="lg"
          fontWeight="bold"
          color="red.500"
          textAlign="center"
        >
          現在はテスト実装のためクレジットの購入はできません。
        </Text>
      </Box>

      <Box maxW="7xl" mx="auto" px={[4, 6]}>
        <SimpleGrid columns={[1, 2, 4]} spacing={8}>
          {planList.map((plan, i) => {
            const priceText =
              currency === "usd"
                ? tPurchase("packPriceUsd", { price: plan.price })
                : tPurchase("packPriceJpy", { price: plan.price });

            const creditsText = tPurchase("packCredits", {
              credits: plan.credits,
            });

            return (
              <motion.div
                key={i}
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  bg={cardBg}
                  border="1px solid"
                  borderColor={cardBorderColor}
                  boxShadow="md"
                  borderRadius="lg"
                  overflow="hidden"
                  _hover={{ boxShadow: "xl" }}
                  h="full"
                  display="flex"
                  flexDir="column"
                >
                  <CardHeader textAlign="center">
                    <Heading
                      size="md"
                      bgClip="text"
                      bgGradient={headingGradient}
                    >
                      {priceText}
                    </Heading>
                  </CardHeader>
                  <Divider />
                  <CardBody
                    as={Flex}
                    flexDir="column"
                    justifyContent="center"
                    alignItems="center"
                    textAlign="center"
                    flexGrow={1}
                  >
                    <Text fontSize="lg" fontWeight="bold" mb={2}>
                      {creditsText}
                    </Text>
                    <Text fontSize="sm" color="gray.500" mb={6}>
                      {tPurchase("description")}
                    </Text>
                    <Button
                      colorScheme="blue"
                      size="md"
                      onClick={() => handlePurchase(plan)}
                      w="full"
                    >
                      {tPurchase("packButton")}
                    </Button>
                  </CardBody>
                </Card>
              </motion.div>
            );
          })}
        </SimpleGrid>

        <Box mt={16} textAlign="center" color={textColorNote}>
          <Text>{tPurchase("note")}</Text>
        </Box>
      </Box>
    </Box>
  );
}


/* 
"use client";

import { useMemo } from "react";
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Heading,
  SimpleGrid,
  Text,
  useColorModeValue,
  useToast,
  Flex,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";

const USD_PLANS = [
  { price: 5, credits: 400 },
  { price: 10, credits: 1000 },
  { price: 20, credits: 2100 },
  { price: 40, credits: 4500 },
];

const JPY_PLANS = [
  { price: 500, credits: 300 },
  { price: 1000, credits: 650 },
  { price: 3000, credits: 2000 },
  { price: 5000, credits: 3500 },
];

type Currency = "usd" | "jpy";

export default function PurchasePage() {
  // purchase 名前空間
  const tPurchase = useTranslations("purchase");
  const locale = useLocale();
  const toast = useToast();

  const currency: Currency = useMemo(() => {
    if (locale.startsWith("ja")) {
      return "jpy";
    }
    return "usd";
  }, [locale]);

  const planList = currency === "usd" ? USD_PLANS : JPY_PLANS;

  // カラーモード設定
  const cardBg = useColorModeValue("white", "gray.700");
  const cardBorderColor = useColorModeValue("gray.200", "gray.600");
  const pageBg = useColorModeValue("gray.50", "gray.800");
  const headingGradient = useColorModeValue(
    "linear(to-r, teal.500, blue.500)",
    "linear(to-r, teal.300, blue.400)"
  );
  const textColorNote = useColorModeValue("gray.600", "gray.300");

  interface Plan {
    price: number;
    credits: number;
  }

  const handlePurchase = async (plan: Plan) => {
    try {
      const res = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency,
          price: plan.price,
          credits: plan.credits,
          locale,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        // 400, 401, 500 etc
        throw new Error(data?.error ?? Error ${res.status});
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data?.error ?? "No Checkout URL returned");
      }
    } catch (error: unknown) {
      let msg = "Purchase failed";
      if (error instanceof Error) {
        msg = error.message;
      }
      console.error("Purchase Error:", error);
      toast({
        title: "Error",
        description: msg,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // currencyUsd / currencyJpy などを適宜表示したい場合
  const currencyLabel =
    currency === "usd"
      ? tPurchase("currencyUsd")
      : tPurchase("currencyJpy");

  return (
    <Box minH="100vh" bg={pageBg} pb={16}>
      <Box
        as="section"
        w="full"
        py={[10, 12]}
        px={4}
        bgGradient="linear(to-r, blue.500, purple.600)"
        color="white"
        textAlign="center"
        mb={10}
      >
        <Heading size="2xl" fontWeight="extrabold" mb={2}>
          {tPurchase("pageHeading")}
        </Heading>
        <Text fontSize="lg" opacity={0.9}>
          {tPurchase("description")}
        </Text>
        <Text mt={2} fontSize="sm" opacity={0.8}>
          {currencyLabel}
        </Text>
      </Box>

      <Box maxW="7xl" mx="auto" px={[4, 6]} mb={6}>
        <Text
          fontSize="lg"
          fontWeight="bold"
          color="red.500"
          textAlign="center"
        >
          現在はテスト実装のためクレジットの購入はできません。
        </Text>
      </Box>

      <Box maxW="7xl" mx="auto" px={[4, 6]}>
        <SimpleGrid columns={[1, 2, 4]} spacing={8}>
          {planList.map((plan, i) => {
            const priceText =
              currency === "usd"
                ? tPurchase("packPriceUsd", { price: plan.price })
                : tPurchase("packPriceJpy", { price: plan.price });

            const creditsText = tPurchase("packCredits", {
              credits: plan.credits,
            });

            return (
              <motion.div
                key={i}
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  bg={cardBg}
                  border="1px solid"
                  borderColor={cardBorderColor}
                  boxShadow="md"
                  borderRadius="lg"
                  overflow="hidden"
                  _hover={{ boxShadow: "xl" }}
                  h="full"
                  display="flex"
                  flexDir="column"
                >
                  <CardHeader textAlign="center">
                    <Heading
                      size="md"
                      bgClip="text"
                      bgGradient={headingGradient}
                    >
                      {priceText}
                    </Heading>
                  </CardHeader>
                  <Divider />
                  <CardBody
                    as={Flex}
                    flexDir="column"
                    justifyContent="center"
                    alignItems="center"
                    textAlign="center"
                    flexGrow={1}
                  >
                    <Text fontSize="lg" fontWeight="bold" mb={2}>
                      {creditsText}
                    </Text>
                    <Text fontSize="sm" color="gray.500" mb={6}>
                      {tPurchase("description")}
                    </Text>
                    <Button
                      colorScheme="blue"
                      size="md"
                      onClick={() => handlePurchase(plan)}
                      w="full"
                      // ★ ここで押しても実際に課金はできない（テスト実装）旨を明示してもOK
                    >
                      {tPurchase("packButton")}
                    </Button>
                  </CardBody>
                </Card>
              </motion.div>
            );
          })}
        </SimpleGrid>

        <Box mt={16} textAlign="center" color={textColorNote}>
          <Text>{tPurchase("note")}</Text>
        </Box>
      </Box>
    </Box>
  );
}
*/
