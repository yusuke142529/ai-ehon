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
  const t = useTranslations();
  const locale = useLocale();
  const toast = useToast();

  const currency: Currency = useMemo(() => {
    if (locale.startsWith("ja")) {
      return "jpy";
    }
    return "usd";
  }, [locale]);

  const planList = currency === "usd" ? USD_PLANS : JPY_PLANS;

  // カラーモード
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
        throw new Error(data?.error ?? `Error ${res.status}`);
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
          {t("purchase.pageHeading")}
        </Heading>
        <Text fontSize="lg" opacity={0.9}>
          {t("purchase.description")}
        </Text>
      </Box>

      <Box maxW="7xl" mx="auto" px={[4, 6]}>
        <SimpleGrid columns={[1, 2, 4]} spacing={8}>
          {planList.map((plan, i) => {
            const priceText =
              currency === "usd"
                ? t("purchase.packPriceUsd", { price: plan.price })
                : t("purchase.packPriceJpy", { price: plan.price });

            const creditsText = t("purchase.packCredits", {
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
                      {t("purchase.description")}
                    </Text>
                    <Button
                      colorScheme="blue"
                      size="md"
                      onClick={() => handlePurchase(plan)}
                      w="full"
                    >
                      {t("purchase.packButton")}
                    </Button>
                  </CardBody>
                </Card>
              </motion.div>
            );
          })}
        </SimpleGrid>

        <Box mt={16} textAlign="center" color={textColorNote}>
          <Text>{t("purchase.note")}</Text>
        </Box>
      </Box>
    </Box>
  );
}
