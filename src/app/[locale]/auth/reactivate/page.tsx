"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Link as ChakraLink,
  useToast,
  useColorModeValue,
} from "@chakra-ui/react";

export default function ReactivatePage() {
  const t = useTranslations("reactivate"); // ← "reactivate" ネームスペース
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleReactivate = async () => {
    if (!email) {
      toast({
        title: t("toast.invalidEmailTitle"),
        description: t("toast.invalidEmailDesc"),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    setStatusMessage(t("status.reactivating"));

    try {
      const res = await fetch("/api/user/reactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: t("toast.errorTitle"),
          description: data.error ?? t("toast.errorDesc"),
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setStatusMessage("");
        return;
      }

      // 再有効化成功
      setSuccessMessage(t("status.reactivateDoneDesc"));
      setStatusMessage(t("status.reactivateDoneShort"));
    } catch (err: any) {
      console.error("Reactivate Error:", err);
      toast({
        title: t("toast.errorTitle"),
        description: t("toast.errorDesc"),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg={useColorModeValue("gray.50", "gray.800")}
      py={8}
      px={4}
    >
      <Box
        w="full"
        maxW="lg"
        bg={useColorModeValue("white", "gray.700")}
        boxShadow="lg"
        rounded="md"
        p={8}
      >
        <Heading as="h1" size="lg" textAlign="center" mb={6}>
          {t("pageTitle")}
        </Heading>

        {email ? (
          <Text mb={4} fontSize="md" textAlign="center">
            {t.rich("reactivateTarget", {
              email: () => (
                <Text as="span" fontWeight="bold" ml={1}>
                  {email}
                </Text>
              ),
            })}
          </Text>
        ) : (
          <Alert status="warning" mb={4}>
            <AlertIcon />
            <Box>
              <AlertTitle>{t("alert.noEmailTitle")}</AlertTitle>
              <AlertDescription>{t("alert.noEmailDesc")}</AlertDescription>
            </Box>
          </Alert>
        )}

        <Button
          w="full"
          colorScheme="blue"
          onClick={handleReactivate}
          disabled={!email || loading}
          mb={4}
        >
          {loading ? (
            <>
              <Spinner size="sm" mr={2} />
              {t("button.reactivating")}
            </>
          ) : (
            t("button.reactivateNow")
          )}
        </Button>

        {statusMessage && (
          <Alert status="info" mb={4}>
            <AlertIcon />
            {statusMessage}
          </Alert>
        )}

        {successMessage && (
          <Alert status="success" flexDirection="column" alignItems="start">
            <AlertIcon />
            <Box>
              <AlertTitle>{t("status.reactivateDoneTitle")}</AlertTitle>
              <AlertDescription>
                {successMessage}
                <Box mt={2}>
                  <ChakraLink
                    href="/ja/auth/login"
                    color="blue.400"
                    textDecoration="underline"
                  >
                    {t("link.goLoginPage")}
                  </ChakraLink>
                </Box>
                <Box mt={3}>
                  <Text fontSize="sm">
                    {t("status.afterReactivateNote")}
                  </Text>
                </Box>
              </AlertDescription>
            </Box>
          </Alert>
        )}
      </Box>
    </Flex>
  );
}