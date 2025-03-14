"use client";

import React from "react";
import { CacheProvider } from "@chakra-ui/next-js";
import { ChakraProvider } from "@chakra-ui/react";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

import theme from "@/lib/theme"; // Chakra UI v2用のテーマをimport

type RootProvidersProps = {
  children: React.ReactNode;
  session?: Session | null; // SSRで取得したセッション
};

/**
 * Chakra UI (v2), next-auth SessionProvider をまとめるラッパ
 */
export default function RootProviders({ children, session }: RootProvidersProps) {
  return (
    <CacheProvider>
      <SessionProvider session={session}>
        {/* v2系の場合は cssVarsRoot="body" を指定してFOUCを防ぐ */}
        <ChakraProvider theme={theme} cssVarsRoot="body">
          {children}
        </ChakraProvider>
      </SessionProvider>
    </CacheProvider>
  );
}
