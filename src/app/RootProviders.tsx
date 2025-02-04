"use client";

import React from "react";
import { CacheProvider } from "@chakra-ui/next-js";
import { ChakraProvider } from "@chakra-ui/react";
import { SessionProvider } from "next-auth/react";
import theme from "@/lib/theme";

/**
 * Chakra UI, next-auth のSessionProvider,
 * SSR最適化のCacheProvider等をまとめる。
 */
export default function RootProviders({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <CacheProvider>
      <SessionProvider>
        <ChakraProvider theme={theme}>
          {children}
        </ChakraProvider>
      </SessionProvider>
    </CacheProvider>
  );
}